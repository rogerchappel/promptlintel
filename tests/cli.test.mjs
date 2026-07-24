import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';

test('CLI emits JSON findings for risky fixture', () => {
  const result = spawnSync(process.execPath, ['dist/cli.js', 'scan', 'examples/fixtures/risky-agent.md', '--format', 'json', '--fail-on', 'critical'], { encoding: 'utf8' });
  assert.equal(result.status, 1);
  const parsed = JSON.parse(result.stdout);
  assert.equal(parsed.findings.some((finding) => finding.ruleId === 'secret-api-key'), true);
  assert.equal(parsed.severityCounts.critical >= 1, true);
  assert.equal(parsed.categoryCounts.secret >= 1, true);
});

test('CLI passes safe fixture', () => {
  const result = spawnSync(process.execPath, ['dist/cli.js', 'scan', 'examples/fixtures/safe-agent.md', '--format', 'json'], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  const parsed = JSON.parse(result.stdout);
  assert.equal(parsed.ok, true);
});

for (const { name, args, diagnostic } of [
  { name: 'unsupported rules format', args: ['rules', '--format', 'yaml'], diagnostic: '--format must be markdown or json' },
  { name: 'missing rules format', args: ['rules', '--format'], diagnostic: '--format requires a value' },
  { name: 'unknown rules option', args: ['rules', '--verbose'], diagnostic: 'Unknown option: --verbose' },
]) {
  test(`CLI rejects ${name}`, () => {
    const result = spawnSync(process.execPath, ['dist/cli.js', ...args], { encoding: 'utf8' });

    assert.equal(result.status, 2);
    assert.match(result.stderr, new RegExp(diagnostic.replaceAll('-', '\\-')));
    assert.equal(result.stdout, '');
  });
}
