export type Severity = 'info' | 'low' | 'medium' | 'high' | 'critical';
export type ReportFormat = 'markdown' | 'json';

export type RuleCategory = 'injection' | 'secret' | 'external-action' | 'provenance' | 'safety';

export interface Rule {
  id: string;
  title: string;
  category: RuleCategory;
  severity: Severity;
  description: string;
  remediation: string;
  patterns?: RegExp[];
  requiredAny?: string[];
  appliesToWholeFile?: boolean;
}

export interface Finding {
  ruleId: string;
  title: string;
  category: RuleCategory;
  severity: Severity;
  file: string;
  line: number;
  column: number;
  snippet: string;
  remediation: string;
}

export interface ScanOptions {
  cwd: string;
  inputs: string[];
  format: ReportFormat;
  failOn: Severity;
  out?: string;
  config?: string;
  noDefaultRules: boolean;
}

export interface LintConfig {
  rules?: Rule[];
  disabledRules?: string[];
  includeDefaultRules?: boolean;
  failOn?: Severity;
}

export interface ScanReport {
  ok: boolean;
  generatedAt: string;
  tool: string;
  files: string[];
  findingCount: number;
  severityCounts: Record<Severity, number>;
  categoryCounts: Partial<Record<RuleCategory, number>>;
  failOn: Severity;
  findings: Finding[];
}
