#!/usr/bin/env node
import { chmod } from 'node:fs/promises';
await chmod(new URL('../dist/src/cli.js', import.meta.url), 0o755).catch(async () => {
  await chmod(new URL('../dist/cli.js', import.meta.url), 0o755);
});
