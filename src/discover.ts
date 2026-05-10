import { readdir, stat } from 'node:fs/promises';
import path from 'node:path';

const promptExtensions = new Set(['.md', '.mdx', '.txt', '.prompt', '.instructions']);

export async function discoverFiles(inputs: string[], cwd: string): Promise<string[]> {
  const seen = new Set<string>();
  for (const input of inputs) {
    for (const candidate of await expandInput(input, cwd)) {
      seen.add(candidate);
    }
  }
  return [...seen].sort();
}

async function expandInput(input: string, cwd: string): Promise<string[]> {
  if (hasGlob(input)) {
    return expandGlob(input, cwd);
  }
  const resolved = safeResolve(cwd, input);
  const info = await stat(resolved);
  if (info.isDirectory()) return walk(resolved);
  if (info.isFile()) return [resolved];
  return [];
}

async function walk(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'dist') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await walk(full));
    if (entry.isFile() && promptExtensions.has(path.extname(entry.name).toLowerCase())) files.push(full);
  }
  return files;
}

async function expandGlob(pattern: string, cwd: string): Promise<string[]> {
  const normalized = pattern.replaceAll('\\', '/');
  const base = normalized.split(/[\*\?\[]/)[0].replace(/\/[^/]*$/, '') || '.';
  const root = safeResolve(cwd, base);
  const files = await walk(root);
  const regex = globToRegExp(path.resolve(cwd, normalized).replaceAll('\\', '/'));
  return files.filter((file) => regex.test(file.replaceAll('\\', '/')));
}

function hasGlob(value: string): boolean {
  return /[*?\[]/.test(value);
}

function safeResolve(cwd: string, input: string): string {
  const resolved = path.resolve(cwd, input);
  const relative = path.relative(cwd, resolved);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`Refusing to read outside the current workspace: ${input}`);
  }
  return resolved;
}

function globToRegExp(glob: string): RegExp {
  let out = '^';
  for (let i = 0; i < glob.length; i++) {
    const char = glob[i];
    const next = glob[i + 1];
    if (char === '*' && next === '*') {
      out += '.*';
      i++;
    } else if (char === '*') {
      out += '[^/]*';
    } else if (char === '?') {
      out += '[^/]';
    } else {
      out += char.replace(/[|\\{}()[\]^$+?.]/g, '\\$&');
    }
  }
  return new RegExp(`${out}$`);
}
