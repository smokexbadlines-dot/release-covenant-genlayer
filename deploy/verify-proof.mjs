import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { createClient } from 'genlayer-js';
import { studionet } from 'genlayer-js/chains';
import { TransactionHashVariant } from 'genlayer-js/types';

const manifest = JSON.parse(readFileSync(new URL('./proof.json', import.meta.url), 'utf8'));
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
  const ok = tx.statusName === 'FINALIZED' && tx.txExecutionResultName === 'FINISHED_WITH_RETURN';
  checks.push({ label: item.label, hash: item.hash, status: tx.statusName, execution: tx.txExecutionResultName, ok });
  if (!ok) throw new Error(`Transaction ${item.label} is not FINALIZED with successful execution.`);
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
console.log(JSON.stringify({ verified: true, source_sha256: sourceHash, contract_address: manifest.contract_address, transactions: checks, snapshot }, null, 2));
