import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { discoverFiles } from '../dist/discover.js';

test('globstar directory segments include direct and nested matches', async (t) => {
  const cwd = await mkdtemp(path.join(tmpdir(), 'promptlintel-discover-'));
  t.after(() => rm(cwd, { recursive: true, force: true }));

  await mkdir(path.join(cwd, 'prompts', 'nested'), { recursive: true });
  await writeFile(path.join(cwd, 'prompts', 'direct.md'), 'direct');
  await writeFile(path.join(cwd, 'prompts', 'nested', 'deep.md'), 'deep');
  await writeFile(path.join(cwd, 'prompts', 'ignored.txt'), 'ignored');

  const files = await discoverFiles(['prompts/**/*.md'], cwd);

  assert.deepEqual(files.map((file) => path.relative(cwd, file)), [
    path.join('prompts', 'direct.md'),
    path.join('prompts', 'nested', 'deep.md'),
  ]);
});
