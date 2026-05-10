import type { Severity } from './types.js';

export const severityOrder: Severity[] = ['info', 'low', 'medium', 'high', 'critical'];

export function severityRank(severity: Severity): number {
  return severityOrder.indexOf(severity);
}

export function isSeverity(value: string): value is Severity {
  return (severityOrder as readonly string[]).includes(value);
}

export function meetsThreshold(severity: Severity, threshold: Severity): boolean {
  return severityRank(severity) >= severityRank(threshold);
}
