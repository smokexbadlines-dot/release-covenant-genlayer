import { readFileSync } from 'node:fs';

const fixture = JSON.parse(readFileSync(new URL('./demo-fixture.json', import.meta.url), 'utf8'));
const stages = [
  ['baseline', fixture.baseline_sha, fixture.baseline_quote],
  ['break', fixture.break_sha, fixture.break_quote],
  ['repair', fixture.repair_sha, fixture.repair_quote],
];

for (const [stage, sha, quote] of stages) {
  if (!/^[a-f0-9]{40}$/.test(sha)) throw new Error(`${stage}: invalid full commit SHA`);
  const url = `https://raw.githubusercontent.com/${fixture.repo}/${sha}/${fixture.path}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${stage}: HTTP ${response.status}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length === 0 || bytes.length > 24000) throw new Error(`${stage}: ${bytes.length} bytes outside contract limit`);
  const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  if (!text.includes(quote)) throw new Error(`${stage}: exact quote absent`);
  console.log(JSON.stringify({ stage, sha, path: fixture.path, bytes: bytes.length, quote, url }));
}
