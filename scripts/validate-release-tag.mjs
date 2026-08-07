import { readFile } from 'node:fs/promises';

const packageJson = JSON.parse(
  await readFile(new URL('../package.json', import.meta.url), 'utf8'),
);
const actualTag = process.argv[2] ?? process.env.GITHUB_REF_NAME;
const expectedTag = `v${packageJson.version}`;

if (!actualTag) {
  console.error(`Release tag is required; expected ${expectedTag}.`);
  process.exit(1);
}

if (actualTag !== expectedTag) {
  console.error(`Release tag ${actualTag} does not match package version ${expectedTag}.`);
  process.exit(1);
}

console.log(`Release tag ${actualTag} matches package version.`);
