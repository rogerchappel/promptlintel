export function allowedRuleIds(line: string): Set<string> {
  const match = line.match(/promptlintel-allow\s+([^\s]+)/i) ?? line.match(/promptlintel:disable-next-line\s+([^\s]+)/i);
  if (!match) return new Set();
  return new Set(match[1].split(',').map((id) => id.trim()).filter(Boolean));
}

export function isAllowed(ruleId: string, line: string, previousLine = ''): boolean {
  const ids = new Set([...allowedRuleIds(line), ...allowedRuleIds(previousLine)]);
  return ids.has(ruleId) || ids.has('*');
}
