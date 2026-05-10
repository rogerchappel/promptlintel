import type { Finding, ScanReport } from './types.js';

export function renderJson(report: ScanReport): string {
  return `${JSON.stringify(report, null, 2)}\n`;
}

export function renderMarkdown(report: ScanReport): string {
  const lines = [
    '# PromptLintel report',
    '',
    `- Tool: ${report.tool}`,
    `- Files scanned: ${report.files.length}`,
    `- Findings: ${report.findingCount}`,
    `- Fail threshold: ${report.failOn}`,
    `- Status: ${report.ok ? 'pass' : 'fail'}`,
    '',
    '## Findings',
    ''
  ];

  if (report.findings.length === 0) {
    lines.push('No findings. Nice lintel. 🧱', '');
    return lines.join('\n');
  }

  for (const finding of report.findings) {
    lines.push(...renderFinding(finding));
  }
  return lines.join('\n');
}

function renderFinding(finding: Finding): string[] {
  return [
    `### ${finding.severity.toUpperCase()} ${finding.ruleId}`,
    '',
    `- File: \`${finding.file}:${finding.line}:${finding.column}\``,
    `- Category: ${finding.category}`,
    `- Title: ${finding.title}`,
    `- Snippet: ${finding.snippet ? `\`${escapeTicks(finding.snippet)}\`` : '_whole file_'}`,
    `- Remediation: ${finding.remediation}`,
    ''
  ];
}

function escapeTicks(value: string): string {
  return value.replaceAll('`', '\\`');
}
