import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { request } from 'node:https';

const packageName = 'promptlintel';

function registryPackageExists(name) {
  return new Promise((resolve, reject) => {
    const registryRequest = request(
      `https://registry.npmjs.org/${encodeURIComponent(name)}/latest`,
      { method: 'HEAD', timeout: 10_000 },
      (response) => {
        response.resume();
        resolve(response.statusCode === 200);
      },
    );

    registryRequest.on('timeout', () => registryRequest.destroy(new Error('npm registry request timed out')));
    registryRequest.on('error', reject);
    registryRequest.end();
  });
}

test('README only recommends npm registry commands for an available package', async () => {
  const readme = await readFile(new URL('../README.md', import.meta.url), 'utf8');
  const recommendsRegistryInstall = new RegExp(
    String.raw`(?:npm\s+(?:install|i)|npx)\s+(?:[^\n]*\s)?${packageName}(?:\s|$)`,
    'm',
  ).test(readme);

  if (!recommendsRegistryInstall) {
    assert.match(readme, /git clone https:\/\/github\.com\/rogerchappel\/promptlintel\.git/);
    return;
  }

  assert.equal(
    await registryPackageExists(packageName),
    true,
    `README recommends npm registry commands, but ${packageName} is unavailable from npm`,
  );
});
