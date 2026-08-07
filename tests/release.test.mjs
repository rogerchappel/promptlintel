import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import test from 'node:test';

const root = resolve(import.meta.dirname, '..');

function runTag(tag) {
  return spawnSync(process.execPath, ['scripts/validate-release-tag.mjs', tag], {
    cwd: root,
    encoding: 'utf8',
  });
}

test('release tag must exactly match the package version', () => {
  assert.equal(runTag('v0.1.0').status, 0);

  for (const tag of ['0.1.0', 'v0.1.1', 'v0.1.0-rc.1', 'release-v0.1.0']) {
    const result = runTag(tag);
    assert.notEqual(result.status, 0, tag);
    assert.match(result.stderr, /does not match package version v0\.1\.0/);
  }
});

test('release tag is required', () => {
  const result = spawnSync(process.execPath, ['scripts/validate-release-tag.mjs'], {
    cwd: root,
    encoding: 'utf8',
    env: { ...process.env, GITHUB_REF_NAME: '' },
  });

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Release tag is required/);
});

test('packed package installs and runs in a clean consumer', () => {
  const workspace = mkdtempSync(join(tmpdir(), 'promptlintel-consumer-'));

  try {
    const tarballName = execFileSync('npm', ['pack', '--json'], {
      cwd: root,
      encoding: 'utf8',
    });
    const [{ filename }] = JSON.parse(tarballName);
    const tarball = join(root, filename);

    execFileSync('npm', ['init', '--yes'], { cwd: workspace, stdio: 'ignore' });
    execFileSync('npm', ['install', '--ignore-scripts', tarball], {
      cwd: workspace,
      stdio: 'ignore',
    });
    const output = execFileSync(
      join(workspace, 'node_modules', '.bin', 'promptlintel'),
      ['rules', '--format', 'markdown'],
      { cwd: workspace, encoding: 'utf8' },
    );

    assert.match(output, /injection-ignore-prior-instructions/);
    rmSync(tarball);
  } finally {
    rmSync(workspace, { recursive: true, force: true });
  }
});

test('release workflows preserve validation and publication ordering', () => {
  const release = readFileSync(join(root, '.github/workflows/release.yml'), 'utf8');
  const dryRun = readFileSync(join(root, '.github/workflows/release-dry-run.yml'), 'utf8');

  const releaseTag = release.indexOf('npm run release:tag -- "${GITHUB_REF_NAME}"');
  const releaseCheck = release.indexOf('npm run release:check');
  const publish = release.indexOf('npm publish --provenance --access public');
  const githubRelease = release.indexOf('gh release create');
  assert.ok(releaseTag >= 0 && releaseTag < releaseCheck);
  assert.ok(releaseCheck < publish && publish < githubRelease);

  const prospectiveTag = dryRun.indexOf('PROSPECTIVE_TAG: v0.1.0');
  const dryTag = dryRun.indexOf('npm run release:tag -- "${PROSPECTIVE_TAG}"');
  const dryCheck = dryRun.indexOf('npm run release:check');
  const dryPublish = dryRun.indexOf('npm publish --dry-run --provenance --access public');
  assert.ok(prospectiveTag >= 0 && prospectiveTag < dryTag);
  assert.ok(dryTag < dryCheck && dryCheck < dryPublish);
});
