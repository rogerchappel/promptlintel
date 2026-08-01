import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { LintConfig, Rule } from './types.js';
import { isSeverity } from './severity.js';

const categories = new Set(['injection', 'secret', 'external-action', 'provenance', 'safety']);
const configFields = new Set(['failOn', 'includeDefaultRules', 'disabledRules', 'rules']);
const ruleFields = new Set(['id', 'title', 'category', 'severity', 'description', 'remediation', 'patterns', 'requiredAny', 'appliesToWholeFile']);

export async function loadConfig(configPath: string | undefined, cwd: string): Promise<LintConfig> {
  if (!configPath) return {};
  const resolved = path.resolve(cwd, configPath);
  const raw = await readFile(resolved, 'utf8');
  const parsed: unknown = JSON.parse(raw);
  return validateConfig(parsed);
}

function validateConfig(value: unknown): LintConfig {
  const config = requireObject(value, 'config');
  rejectUnknownFields(config, configFields, 'config');
  if (config.failOn !== undefined && (typeof config.failOn !== 'string' || !isSeverity(config.failOn))) {
    throw new Error('config.failOn must be info, low, medium, high, or critical');
  }
  if (config.includeDefaultRules !== undefined && typeof config.includeDefaultRules !== 'boolean') {
    throw new Error('config.includeDefaultRules must be a boolean');
  }
  if (config.disabledRules !== undefined) requireStringArray(config.disabledRules, 'config.disabledRules');
  if (config.rules !== undefined && !Array.isArray(config.rules)) throw new Error('config.rules must be an array');
  return {
    failOn: config.failOn as LintConfig['failOn'],
    includeDefaultRules: config.includeDefaultRules as boolean | undefined,
    disabledRules: config.disabledRules as string[] | undefined,
    rules: (config.rules as unknown[] | undefined)?.map((rule, index) => validateRule(rule, index))
  };
}

function validateRule(value: unknown, index: number): Rule {
  const label = `config.rules[${index}]`;
  const rule = requireObject(value, label);
  rejectUnknownFields(rule, ruleFields, label);
  for (const field of ['id', 'title', 'description', 'remediation'] as const) {
    if (typeof rule[field] !== 'string' || rule[field].trim() === '') throw new Error(`${label}.${field} must be a non-empty string`);
  }
  if (typeof rule.category !== 'string' || !categories.has(rule.category)) throw new Error(`${label}.category is invalid`);
  if (typeof rule.severity !== 'string' || !isSeverity(rule.severity)) throw new Error(`${label}.severity is invalid`);
  if (rule.patterns !== undefined) requireStringArray(rule.patterns, `${label}.patterns`);
  if (rule.requiredAny !== undefined) requireStringArray(rule.requiredAny, `${label}.requiredAny`);
  if (rule.appliesToWholeFile !== undefined && typeof rule.appliesToWholeFile !== 'boolean') throw new Error(`${label}.appliesToWholeFile must be a boolean`);
  if (rule.patterns === undefined && rule.requiredAny === undefined) throw new Error(`${label} must define patterns or requiredAny`);
  if (rule.appliesToWholeFile === true && rule.requiredAny === undefined) throw new Error(`${label}.requiredAny is required when appliesToWholeFile is true`);

  return {
    id: rule.id as string,
    title: rule.title as string,
    category: rule.category as Rule['category'],
    severity: rule.severity as Rule['severity'],
    description: rule.description as string,
    remediation: rule.remediation as string,
    patterns: (rule.patterns as string[] | undefined)?.map((pattern, patternIndex) => compilePattern(pattern, `${label}.patterns[${patternIndex}]`)),
    requiredAny: rule.requiredAny as string[] | undefined,
    appliesToWholeFile: rule.appliesToWholeFile as boolean | undefined
  };
}

function requireObject(value: unknown, label: string): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new Error(`${label} must be a JSON object`);
  return value as Record<string, unknown>;
}

function requireStringArray(value: unknown, label: string): asserts value is string[] {
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string' || item.trim() === '')) {
    throw new Error(`${label} must be an array of non-empty strings`);
  }
}

function rejectUnknownFields(value: Record<string, unknown>, allowed: Set<string>, label: string): void {
  const unknown = Object.keys(value).find((field) => !allowed.has(field));
  if (unknown) throw new Error(`${label}.${unknown} is not a supported field`);
}

function compilePattern(pattern: string, label: string): RegExp {
  try {
    return new RegExp(pattern, 'i');
  } catch (error) {
    throw new Error(`${label} is not a valid regular expression: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export function mergeRules(defaultRules: Rule[], config: LintConfig, noDefaultRules: boolean): Rule[] {
  const includeDefaults = !noDefaultRules && config.includeDefaultRules !== false;
  const disabled = new Set(config.disabledRules ?? []);
  const rules = [...(includeDefaults ? defaultRules : []), ...(config.rules ?? [])];
  return rules.filter((rule) => !disabled.has(rule.id));
}
