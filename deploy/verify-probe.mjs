import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { createClient } from 'genlayer-js';
import { studionet } from 'genlayer-js/chains';
import { TransactionHashVariant } from 'genlayer-js/types';

const proof = JSON.parse(readFileSync(new URL('./probe-proof.json', import.meta.url), 'utf8'));
if (proof.status !== 'deployed' || proof.network !== 'studionet') throw new Error('Probe proof is not deployed on StudioNet.');
const source = readFileSync(new URL('../contracts/evidence_probe.py', import.meta.url));
const sourceHash = createHash('sha256').update(source).digest('hex');
if (sourceHash !== proof.source_sha256) throw new Error('Probe source hash mismatch.');

const client = createClient({ chain: studionet });
const code = await client.getContractCode(proof.contract_address);
const deployed = code.startsWith('0x') ? Buffer.from(code.slice(2), 'hex') : Buffer.from(code, 'utf8');
if (!deployed.equals(source)) throw new Error('Deployed probe source differs byte-for-byte.');

const checks = [];
for (const item of proof.transactions) {
  const tx = await client.getTransaction({ hash: item.hash });
  const leader = tx.consensus_data?.leader_receipt?.find(receipt => receipt.mode === 'leader');
  const execution = leader?.execution_result ?? 'UNKNOWN';
  const readable = leader?.result?.payload?.readable;
  const returned = typeof readable === 'string' ? JSON.parse(readable) : undefined;
  const agrees = Object.values(tx.consensus_data?.votes ?? {}).filter(vote => vote === 'agree').length;
  if (tx.statusName !== 'FINALIZED' || execution !== 'SUCCESS' || returned !== item.expected_result || agrees < 3) {
    throw new Error(`${item.label}: finality, execution, return value, or validator agreement failed`);
  }
  checks.push({ label: item.label, hash: item.hash, status: tx.statusName, execution, returned, agrees });
}

const readback = await client.readContract({
  address: proof.contract_address,
  functionName: 'get_last',
  args: [],
  transactionHashVariant: TransactionHashVariant.LATEST_FINAL,
});
if (readback !== proof.expected_finalized_readback) throw new Error('Finalized probe readback mismatch.');
console.log(JSON.stringify({ verified: true, contract_address: proof.contract_address, source_sha256: sourceHash, checks, finalized_readback: readback }, null, 2));
