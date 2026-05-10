#!/usr/bin/env node
import { scan, writeReport } from './scan.js';
import { defaultRules } from './rules.js';
import { renderJson, renderMarkdown } from './reporters.js';
import { isSeverity } from './severity.js';
import type { ReportFormat, Severity } from './types.js';

const args = process.argv.slice(2);
const command = args.shift();

try {
  if (command === 'scan') {
    const parsed = parseScanArgs(args);
    const report = await scan(parsed);
    const rendered = parsed.format === 'json' ? renderJson(report) : renderMarkdown(report);
    await writeReport(parsed.out, rendered);
    process.exitCode = report.ok ? 0 : 1;
  } else if (command === 'rules') {
    const format = readOption(args, '--format') ?? 'markdown';
    if (format === 'json') {
      process.stdout.write(`${JSON.stringify({ rules: defaultRules.map(stripPatterns) }, null, 2)}\n`);
    } else {
      process.stdout.write(renderRulesMarkdown());
    }
  } else {
    help(command ? `Unknown command: ${command}` : undefined);
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 2;
}

function parseScanArgs(argv: string[]) {
  const inputs: string[] = [];
  let format: ReportFormat = 'markdown';
  let failOn: Severity = 'high';
  let out: string | undefined;
  let config: string | undefined;
  let noDefaultRules = false;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--format') {
      const value = argv[++i];
      if (value !== 'markdown' && value !== 'json') throw new Error('--format must be markdown or json');
      format = value;
    } else if (arg === '--fail-on') {
      const value = argv[++i];
      if (!value || !isSeverity(value)) throw new Error('--fail-on must be info, low, medium, high, or critical');
      failOn = value;
    } else if (arg === '--out') {
      out = argv[++i];
      if (!out) throw new Error('--out requires a path');
    } else if (arg === '--config') {
      config = argv[++i];
      if (!config) throw new Error('--config requires a path');
    } else if (arg === '--no-default-rules') {
      noDefaultRules = true;
    } else if (arg.startsWith('-')) {
      throw new Error(`Unknown option: ${arg}`);
    } else {
      inputs.push(arg);
    }
  }

  if (inputs.length === 0) throw new Error('scan requires at least one file, directory, or glob');
  return { cwd: process.cwd(), inputs, format, failOn, out, config, noDefaultRules };
}

function readOption(argv: string[], flag: string): string | undefined {
  const index = argv.indexOf(flag);
  return index >= 0 ? argv[index + 1] : undefined;
}

function stripPatterns(rule: unknown): unknown {
  return JSON.parse(JSON.stringify(rule, (key, value) => key === 'patterns' ? undefined : value));
}

function renderRulesMarkdown(): string {
  const lines = ['# PromptLintel rules', ''];
  for (const rule of defaultRules) {
    lines.push(`## ${rule.id}`, '', `- Severity: ${rule.severity}`, `- Category: ${rule.category}`, `- Description: ${rule.description}`, `- Remediation: ${rule.remediation}`, '');
  }
  return lines.join('\n');
}

function help(error?: string): void {
  if (error) console.error(error);
  console.error(`Usage:\n  promptlintel scan <files...> [--format markdown|json] [--out path] [--fail-on severity] [--config path] [--no-default-rules]\n  promptlintel rules [--format markdown|json]`);
  process.exitCode = error ? 2 : 0;
}
