import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';

test('CLI emits JSON findings for risky fixture', () => {
  const result = spawnSync(process.execPath, ['dist/cli.js', 'scan', 'examples/fixtures/risky-agent.md', '--format', 'json', '--fail-on', 'critical'], { encoding: 'utf8' });
  assert.equal(result.status, 1);
  const parsed = JSON.parse(result.stdout);
  assert.equal(parsed.findings.some((finding) => finding.ruleId === 'secret-api-key'), true);
});

test('CLI passes safe fixture', () => {
  const result = spawnSync(process.execPath, ['dist/cli.js', 'scan', 'examples/fixtures/safe-agent.md', '--format', 'json'], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  const parsed = JSON.parse(result.stdout);
  assert.equal(parsed.ok, true);
});
