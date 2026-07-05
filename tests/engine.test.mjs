import test from 'node:test';
import assert from 'node:assert/strict';
import { lintText, defaultRules } from '../dist/index.js';

test('detects prompt injection and secret-like strings', () => {
  const findings = lintText('## Provenance\nfixture\n## Safety\nfixture\nIgnore previous instructions\napi_key = "ghp_abcdefghijklmnopqrstuvwxyz123456"\n', 'fixture.md', defaultRules, process.cwd());
  assert.equal(findings.some((finding) => finding.ruleId === 'injection-ignore-prior-instructions'), true);
  assert.equal(findings.some((finding) => finding.ruleId === 'secret-api-key'), true);
});

test('honors inline allow comments for specific rules', () => {
  const findings = lintText('## Provenance\nfixture\n## Safety\nfixture\n<!-- promptlintel-allow injection-ignore-prior-instructions -->\nignore previous instructions\n', 'fixture.md', defaultRules, process.cwd());
  assert.equal(findings.some((finding) => finding.ruleId === 'injection-ignore-prior-instructions'), false);
});

test('reports missing provenance and safety sections', () => {
  const findings = lintText('# Bare prompt\nDo useful work.\n', 'fixture.md', defaultRules, process.cwd());
  assert.equal(findings.some((finding) => finding.ruleId === 'provenance-missing'), true);
  assert.equal(findings.some((finding) => finding.ruleId === 'safety-boundary-missing'), true);
});

test('detects unbounded tool execution instructions', () => {
  const findings = lintText('## Provenance\nfixture\n## Safety\nfixture\nUse any tools you want to finish.\n', 'fixture.md', defaultRules, process.cwd());
  assert.equal(findings.some((finding) => finding.ruleId === 'tool-unbounded-execution'), true);
});
