import { readFileSync } from 'node:fs';
import { createClient } from 'genlayer-js';
import { studionet } from 'genlayer-js/chains';

const contract = process.argv[2] === 'evidence' ? 'evidence_probe.py' : 'release_covenant.py';
const code = readFileSync(new URL(`../contracts/${contract}`, import.meta.url), 'utf8');
const client = createClient({ chain: studionet });

try {
  const schema = await client.getContractSchemaForCode(code);
  console.log(JSON.stringify({ ok: true, contract, runner: code.split('\n')[0], methods: Object.keys(schema || {}) }));
} catch (error) {
  console.error(JSON.stringify({ ok: false, message: error instanceof Error ? error.message : String(error) }));
  process.exitCode = 1;
}
