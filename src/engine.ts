import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { isAllowed } from './allow.js';
import type { Finding, Rule } from './types.js';

export async function lintFiles(files: string[], rules: Rule[], cwd: string): Promise<Finding[]> {
  const findings: Finding[] = [];
  for (const file of files) {
    const text = await readFile(file, 'utf8');
    findings.push(...lintText(text, file, rules, cwd));
  }
  return findings.sort(compareFindings);
}

export function lintText(text: string, file: string, rules: Rule[], cwd = process.cwd()): Finding[] {
  const lines = text.split(/\r?\n/);
  const lower = text.toLowerCase();
  const findings: Finding[] = [];
  const relativeFile = path.relative(cwd, file) || file;

  for (const rule of rules) {
    if (rule.appliesToWholeFile && rule.requiredAny) {
      if (!rule.requiredAny.some((needle) => lower.includes(needle.toLowerCase()))) {
        findings.push(toFinding(rule, relativeFile, 1, 1, firstNonEmpty(lines) ?? '', rule.remediation));
      }
      continue;
    }

    for (const [index, line] of lines.entries()) {
      const previousLine = index > 0 ? lines[index - 1] : '';
      if (isAllowed(rule.id, line, previousLine)) continue;
      for (const pattern of rule.patterns ?? []) {
        const match = line.match(pattern);
        if (match?.index !== undefined) {
          findings.push(toFinding(rule, relativeFile, index + 1, match.index + 1, line.trim(), rule.remediation));
          break;
        }
      }
    }
  }

  return findings;
}

function toFinding(rule: Rule, file: string, line: number, column: number, snippet: string, remediation: string): Finding {
  return {
    ruleId: rule.id,
    title: rule.title,
    category: rule.category,
    severity: rule.severity,
    file,
    line,
    column,
    snippet: snippet.slice(0, 180),
    remediation
  };
}

function firstNonEmpty(lines: string[]): string | undefined {
  return lines.find((line) => line.trim().length > 0)?.trim();
}

function compareFindings(a: Finding, b: Finding): number {
  return a.file.localeCompare(b.file) || a.line - b.line || a.ruleId.localeCompare(b.ruleId);
}
