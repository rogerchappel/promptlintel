import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const cliPath = resolve('dist/cli.js');

function cli(args, options = {}) {
  return spawnSync(process.execPath, [cliPath, ...args], { encoding: 'utf8', ...options });
}

test('CLI emits JSON findings for risky fixture', () => {
  const result = spawnSync(process.execPath, ['dist/cli.js', 'scan', 'examples/fixtures/risky-agent.md', '--format', 'json', '--fail-on', 'critical'], { encoding: 'utf8' });
  assert.equal(result.status, 1);
  const parsed = JSON.parse(result.stdout);
  assert.equal(parsed.findings.some((finding) => finding.ruleId === 'secret-api-key'), true);
  assert.equal(parsed.severityCounts.critical >= 1, true);
  assert.equal(parsed.categoryCounts.secret >= 1, true);
});

test('rules accepts its documented formats', () => {
  const markdown = cli(['rules']);
  assert.equal(markdown.status, 0, markdown.stderr);
  assert.match(markdown.stdout, /^# PromptLintel rules/);
  const json = cli(['rules', '--format', 'json']);
  assert.equal(json.status, 0, json.stderr);
  assert.ok(Array.isArray(JSON.parse(json.stdout).rules));
});

for (const [name, args, diagnostic] of [
  ['unknown options', ['rules', '--bogus'], 'Unknown option: --bogus'],
  ['missing format values', ['rules', '--format'], '--format must be markdown or json'],
  ['unsupported formats', ['rules', '--format', 'yaml'], '--format must be markdown or json'],
  ['positional arguments', ['rules', 'extra'], 'Unexpected argument: extra']
]) {
  test(`rules rejects ${name}`, () => {
    const result = cli(args);
    assert.equal(result.status, 2);
    assert.match(result.stderr, new RegExp(diagnostic));
    assert.equal(result.stdout, '');
  });
}

test('valid custom rules are loaded from config', () => {
  const directory = mkdtempSync(join(tmpdir(), 'promptlintel-config-'));
  const config = join(directory, 'config.json');
  writeFileSync(config, JSON.stringify({ includeDefaultRules: false, failOn: 'low', rules: [{ id: 'local-rule', title: 'Local rule', category: 'safety', severity: 'low', description: 'Test rule', remediation: 'Remove marker', patterns: ['unsafe marker'] }] }));
  const result = cli(['scan', 'examples/fixtures/safe-agent.md', '--format', 'json', '--config', config]);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(JSON.parse(result.stdout).failOn, 'low');
});

for (const [name, config, diagnostic] of [
  ['a non-object config', [], 'config must be a JSON object'],
  ['invalid failOn', { failOn: 'never' }, 'config.failOn must be'],
  ['non-boolean includeDefaultRules', { includeDefaultRules: 'yes' }, 'config.includeDefaultRules must be a boolean'],
  ['non-array disabledRules', { disabledRules: 'one' }, 'config.disabledRules must be an array'],
  ['unknown fields', { unknown: true }, 'config.unknown is not a supported field'],
  ['incomplete custom rules', { rules: [{ id: 'local' }] }, 'config.rules\\[0\\].title must be a non-empty string'],
  ['invalid pattern values', { rules: [{ id: 'local', title: 'Local', category: 'safety', severity: 'low', description: 'Test', remediation: 'Fix', patterns: [42] }] }, 'config.rules\\[0\\].patterns must be an array'],
  ['invalid regular expressions', { rules: [{ id: 'local', title: 'Local', category: 'safety', severity: 'low', description: 'Test', remediation: 'Fix', patterns: ['['] }] }, 'config.rules\\[0\\].patterns\\[0\\] is not a valid regular expression']
]) {
  test(`scan rejects ${name}`, () => {
    const directory = mkdtempSync(join(tmpdir(), 'promptlintel-config-'));
    const configPath = join(directory, 'config.json');
    writeFileSync(configPath, JSON.stringify(config));
    const result = cli(['scan', 'examples/fixtures/safe-agent.md', '--config', configPath]);
    assert.equal(result.status, 2);
    assert.match(result.stderr, new RegExp(diagnostic));
    assert.equal(result.stdout, '');
  });
}

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

test('CLI globstar scans root-level and nested files in deterministic deduplicated order', () => {
  const directory = mkdtempSync(join(tmpdir(), 'promptlintel-globstar-'));
  writeFileSync(join(directory, 'root.md'), 'Owner: test\nSafety: do not perform external actions.\n');
  const nested = join(directory, 'nested');
  mkdirSync(nested);
  writeFileSync(join(nested, 'child.md'), 'Owner: test\nSafety: do not perform external actions.\n');

  const result = cli(['scan', '**/*.md', 'root.md', '--format', 'json'], { cwd: directory });

  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(JSON.parse(result.stdout).files, ['nested/child.md', 'root.md']);
});

test('CLI character classes support sets, ranges, and negation with deterministic deduplication', () => {
  const directory = mkdtempSync(join(tmpdir(), 'promptlintel-character-class-'));
  for (const name of ['a.md', 'b.md', 'c.md']) {
    writeFileSync(join(directory, name), 'Owner: test\nSafety: do not perform external actions.\n');
  }

  const result = cli(['scan', '[ab].md', '[a-b].md', '[!c].md', '--format', 'json'], { cwd: directory });

  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(JSON.parse(result.stdout).files, ['a.md', 'b.md']);
});

test('CLI reports unmatched character-class globs', () => {
  const directory = mkdtempSync(join(tmpdir(), 'promptlintel-character-class-unmatched-'));
  writeFileSync(join(directory, 'a.md'), 'Owner: test\nSafety: do not perform external actions.\n');

  const result = cli(['scan', '[bc].md', '--format', 'json'], { cwd: directory });

  assert.equal(result.status, 2);
  assert.equal(result.stdout, '');
  assert.match(result.stderr, /No prompt files matched input: \[bc\]\.md/);
});

test('CLI treats an unclosed character class as literal text', () => {
  const directory = mkdtempSync(join(tmpdir(), 'promptlintel-character-class-malformed-'));
  writeFileSync(join(directory, '[a.md'), 'Owner: test\nSafety: do not perform external actions.\n');

  const result = cli(['scan', '[a.md', '--format', 'json'], { cwd: directory });

  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(JSON.parse(result.stdout).files, ['[a.md']);
});

test('CLI preserves exit 2 and no report for a genuinely unmatched globstar', () => {
  const directory = mkdtempSync(join(tmpdir(), 'promptlintel-globstar-unmatched-'));
  writeFileSync(join(directory, 'root.md'), 'Owner: test\nSafety: do not perform external actions.\n');

  const result = cli(['scan', '**/*.mdx', '--format', 'json'], { cwd: directory });

  assert.equal(result.status, 2);
  assert.equal(result.stdout, '');
  assert.match(result.stderr, /No prompt files matched input: \*\*\/\*\.mdx/);
});
