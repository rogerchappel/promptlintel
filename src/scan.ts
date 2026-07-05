import { writeFile } from 'node:fs/promises';
import { loadConfig, mergeRules } from './config.js';
import { discoverFiles } from './discover.js';
import { lintFiles } from './engine.js';
import { defaultRules } from './rules.js';
import { meetsThreshold } from './severity.js';
import type { Finding, RuleCategory, ScanOptions, ScanReport, Severity } from './types.js';

export async function scan(options: ScanOptions): Promise<ScanReport> {
  const config = await loadConfig(options.config, options.cwd);
  const failOn = config.failOn ?? options.failOn;
  const rules = mergeRules(defaultRules, config, options.noDefaultRules);
  const files = await discoverFiles(options.inputs, options.cwd);
  const findings = await lintFiles(files, rules, options.cwd);
  const ok = !findings.some((finding) => meetsThreshold(finding.severity, failOn));
  return {
    ok,
    generatedAt: 'stable',
    tool: 'promptlintel@0.1.0',
    files: files.map((file) => file.replace(`${options.cwd}/`, '')).sort(),
    findingCount: findings.length,
    severityCounts: countBySeverity(findings),
    categoryCounts: countByCategory(findings),
    failOn,
    findings
  };
}

export async function writeReport(out: string | undefined, rendered: string): Promise<void> {
  if (out) {
    await writeFile(out, rendered, 'utf8');
    return;
  }
  process.stdout.write(rendered);
}

function countBySeverity(findings: Finding[]): Record<Severity, number> {
  return {
    info: findings.filter((finding) => finding.severity === 'info').length,
    low: findings.filter((finding) => finding.severity === 'low').length,
    medium: findings.filter((finding) => finding.severity === 'medium').length,
    high: findings.filter((finding) => finding.severity === 'high').length,
    critical: findings.filter((finding) => finding.severity === 'critical').length
  };
}

function countByCategory(findings: Finding[]): Partial<Record<RuleCategory, number>> {
  const counts: Partial<Record<RuleCategory, number>> = {};
  for (const finding of findings) {
    counts[finding.category] = (counts[finding.category] ?? 0) + 1;
  }
  return counts;
}
