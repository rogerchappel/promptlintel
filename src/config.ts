import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { LintConfig, Rule } from './types.js';

export async function loadConfig(configPath: string | undefined, cwd: string): Promise<LintConfig> {
  if (!configPath) return {};
  const resolved = path.resolve(cwd, configPath);
  const raw = await readFile(resolved, 'utf8');
  const parsed = JSON.parse(raw) as LintConfig;
  if (parsed.rules) {
    parsed.rules = parsed.rules.map(hydrateRule);
  }
  return parsed;
}

function hydrateRule(rule: Rule): Rule {
  return {
    ...rule,
    patterns: rule.patterns?.map((pattern) => new RegExp(String(pattern), 'i'))
  };
}

export function mergeRules(defaultRules: Rule[], config: LintConfig, noDefaultRules: boolean): Rule[] {
  const includeDefaults = !noDefaultRules && config.includeDefaultRules !== false;
  const disabled = new Set(config.disabledRules ?? []);
  const rules = [...(includeDefaults ? defaultRules : []), ...(config.rules ?? [])];
  return rules.filter((rule) => !disabled.has(rule.id));
}
