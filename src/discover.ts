import { readdir, stat } from 'node:fs/promises';
import path from 'node:path';

const promptExtensions = new Set(['.md', '.mdx', '.txt', '.prompt', '.instructions']);

export async function discoverFiles(inputs: string[], cwd: string): Promise<string[]> {
  const seen = new Set<string>();
  const unmatched: string[] = [];
  for (const input of inputs) {
    const candidates = await expandInput(input, cwd);
    if (candidates.length === 0) unmatched.push(input);
    for (const candidate of candidates) {
      seen.add(candidate);
    }
  }
  if (unmatched.length > 0) {
    if (unmatched.length === 1) {
      throw new Error(`No prompt files matched input: ${unmatched[0]}`);
    }
    throw new Error(`No prompt files matched inputs:\n${unmatched.map((input) => `- ${input}`).join('\n')}`);
  }
  return [...seen].sort();
}

async function expandInput(input: string, cwd: string): Promise<string[]> {
  try {
    if (hasGlob(input)) {
      return await expandGlob(input, cwd);
    }
    const resolved = safeResolve(cwd, input);
    const info = await stat(resolved);
    if (info.isDirectory()) return walk(resolved);
    if (info.isFile()) return [resolved];
    return [];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return [];
    throw error;
  }
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
      if (glob[i + 2] === '/') {
        out += '(?:.*/)?';
        i += 2;
      } else {
        out += '.*';
        i++;
      }
    } else if (char === '*') {
      out += '[^/]*';
    } else if (char === '?') {
      out += '[^/]';
    } else if (char === '[') {
      const characterClass = parseCharacterClass(glob, i);
      if (characterClass) {
        out += characterClass.source;
        i = characterClass.end;
      } else {
        out += '\\[';
      }
    } else {
      out += char.replace(/[|\\{}()[\]^$+?.]/g, '\\$&');
    }
  }
  return new RegExp(`${out}$`);
}

function parseCharacterClass(glob: string, start: number): { source: string; end: number } | undefined {
  const end = glob.indexOf(']', start + 1);
  if (end === -1) return undefined;

  let content = glob.slice(start + 1, end);
  if (content.length === 0 || content.includes('/')) return undefined;

  let negated = false;
  if (content[0] === '!' || content[0] === '^') {
    negated = true;
    content = content.slice(1);
  }
  if (content.length === 0) return undefined;

  const escaped = content
    .replaceAll('\\', '\\\\')
    .replaceAll(']', '\\]');
  const source = `[${negated ? '^' : ''}${escaped}]`;
  try {
    new RegExp(source);
  } catch {
    return undefined;
  }
  return { source, end };
}
