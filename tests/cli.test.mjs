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

test('CLI rejects an unmatched file input', () => {
  const result = spawnSync(process.execPath, ['dist/cli.js', 'scan', 'examples/fixtures/missing-agent.md', '--format', 'json'], { encoding: 'utf8' });
  assert.equal(result.status, 2);
  assert.equal(result.stdout, '');
  assert.match(result.stderr, /No prompt files matched input: examples\/fixtures\/missing-agent\.md/);
});

test('CLI rejects an unmatched glob input', () => {
  const result = spawnSync(process.execPath, ['dist/cli.js', 'scan', 'examples/**/*.does-not-exist', '--format', 'json'], { encoding: 'utf8' });
  assert.equal(result.status, 2);
  assert.equal(result.stdout, '');
  assert.match(result.stderr, /No prompt files matched input: examples\/\*\*\/\*\.does-not-exist/);
});

test('CLI rejects mixed inputs when any explicit input is unmatched', () => {
  const result = spawnSync(process.execPath, [
    'dist/cli.js',
    'scan',
    'examples/fixtures/safe-agent.md',
    'examples/fixtures/missing-agent.md',
    'examples/**/*.does-not-exist',
    '--format',
    'json'
  ], { encoding: 'utf8' });
  assert.equal(result.status, 2);
  assert.equal(result.stdout, '');
  assert.match(result.stderr, /No prompt files matched inputs:\n- examples\/fixtures\/missing-agent\.md\n- examples\/\*\*\/\*\.does-not-exist/);
});

test('CLI scans a matched explicit glob', () => {
  const result = spawnSync(process.execPath, ['dist/cli.js', 'scan', 'examples/fixtures/safe-*.md', '--format', 'json'], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  const parsed = JSON.parse(result.stdout);
  assert.deepEqual(parsed.files, ['examples/fixtures/safe-agent.md']);
});
