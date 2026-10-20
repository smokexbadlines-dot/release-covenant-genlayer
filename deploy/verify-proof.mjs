import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { createClient } from 'genlayer-js';
import { studionet } from 'genlayer-js/chains';
import { TransactionHashVariant } from 'genlayer-js/types';

const manifest = JSON.parse(readFileSync(new URL(process.argv[2] || './proof.json', import.meta.url), 'utf8'));
if (manifest.status !== 'deployed') {
  console.error('NO LIVE PROOF: deploy/proof.json has no finalized deployment receipts.');
  process.exit(2);
}
if (manifest.network !== 'studionet' || !/^0x[0-9a-fA-F]{40}$/.test(manifest.contract_address || '')) {
  throw new Error('Invalid network or contract address in proof manifest.');
}
if (!Array.isArray(manifest.transactions) || manifest.transactions.length === 0) {
  throw new Error('Proof manifest contains no transactions.');
}
const source = readFileSync(new URL('../contracts/release_covenant.py', import.meta.url));
const sourceHash = createHash('sha256').update(source).digest('hex');
if (sourceHash !== manifest.source_sha256) throw new Error('Local contract source hash differs from proof manifest.');
const client = createClient({ chain: studionet });
const chainCode = await client.getContractCode(manifest.contract_address);
const decoded = chainCode.startsWith('0x') ? Buffer.from(chainCode.slice(2), 'hex') : Buffer.from(chainCode, 'utf8');
if (!decoded.equals(source)) throw new Error('Deployed contract source differs byte-for-byte from the local source.');
const checks = [];
for (const item of manifest.transactions) {
  if (!/^0x[0-9a-fA-F]{64}$/.test(item.hash || '')) throw new Error(`Invalid transaction hash for ${item.label}`);
  const tx = await client.getTransaction({ hash: item.hash });
  const leader = tx.consensus_data?.leader_receipt?.find(receipt => receipt.mode === 'leader');
  const execution = leader?.execution_result ?? 'UNKNOWN';
  const ok = tx.statusName === 'FINALIZED' && execution === (item.expected_execution ?? 'SUCCESS');
  if (!ok) throw new Error(`Transaction ${item.label} is not FINALIZED with successful execution.`);
  const readable = leader?.result?.payload?.readable;
  const result = typeof readable === 'string' ? JSON.parse(readable) : null;
  if ('expected_result' in item && result !== item.expected_result) {
    throw new Error(`Transaction ${item.label} returned ${JSON.stringify(result)}, expected ${JSON.stringify(item.expected_result)}.`);
  }
  if (item.expected_error && !String(leader?.result?.payload ?? '').includes(item.expected_error)) {
    throw new Error(`Transaction ${item.label} did not contain the expected rollback message.`);
  }
  const agreeVotes = Object.values(tx.consensus_data?.votes ?? {}).filter(vote => vote === 'agree').length;
  if (item.minimum_agree_votes && agreeVotes < item.minimum_agree_votes) {
    throw new Error(`Transaction ${item.label} has only ${agreeVotes} agreeing validators.`);
  }
  checks.push({ label: item.label, hash: item.hash, status: tx.statusName, execution, result, rollback: item.expected_error || undefined, agree_votes: agreeVotes, ok });
}
const read = await client.readContract({
  address: manifest.contract_address,
  functionName: 'get_snapshot',
  args: [],
  transactionHashVariant: TransactionHashVariant.LATEST_FINAL,
});
const snapshot = typeof read === 'string' ? JSON.parse(read) : read;
if (manifest.expected_snapshot) {
  for (const [key, expected] of Object.entries(manifest.expected_snapshot)) {
    if (JSON.stringify(snapshot[key]) !== JSON.stringify(expected)) throw new Error(`Finalized snapshot mismatch: ${key}`);
  }
}
if (manifest.expected_promise_states) {
  const actual = snapshot.promises.map(promise => promise.state);
  if (JSON.stringify(actual) !== JSON.stringify(manifest.expected_promise_states)) {
    throw new Error(`Finalized promise states mismatch: ${JSON.stringify(actual)}`);
  }
}
const accounts = [];
for (const expected of manifest.expected_accounts ?? []) {
  const value = await client.readContract({
    address: manifest.contract_address,
    functionName: 'get_account',
    args: [expected.address],
    transactionHashVariant: TransactionHashVariant.LATEST_FINAL,
  });
  const actual = typeof value === 'string' ? JSON.parse(value) : value;
  for (const key of ['deposited_wei', 'claimable_wei']) {
    if (actual[key] !== expected[key]) throw new Error(`Finalized account mismatch for ${expected.address}: ${key}`);
  }
  accounts.push({ address: expected.address, ...actual });
}
console.log(JSON.stringify({ verified: true, workflow_status: manifest.workflow_status, source_sha256: sourceHash, contract_address: manifest.contract_address, transactions: checks, snapshot, accounts }, null, 2));
