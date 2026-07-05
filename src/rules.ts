import type { Rule } from './types.js';

export const defaultRules: Rule[] = [
  {
    id: 'injection-ignore-prior-instructions',
    title: 'Instruction override phrase',
    category: 'injection',
    severity: 'high',
    description: 'Phrases that tell an agent to ignore earlier, higher-priority, or safety instructions are prompt-injection footguns.',
    remediation: 'Remove override wording or quote it as an example with an inline allow comment and explanation.',
    patterns: [/ignore (all |any |previous |prior |above )?instructions?/i, /disregard (all |any |previous |prior |above )?instructions?/i, /forget (all |any |previous |prior |above )?instructions?/i]
  },
  {
    id: 'injection-hidden-directive',
    title: 'Hidden or secret directive',
    category: 'injection',
    severity: 'high',
    description: 'Hidden-directive language encourages instructions that evade review.',
    remediation: 'Make instructions explicit and reviewable; do not ask agents to hide behavior from users or maintainers.',
    patterns: [/secretly (do|run|execute|send|exfiltrate)/i, /do not (tell|reveal|mention) (the )?(user|maintainer|operator)/i, /hidden (system|developer|tool) (prompt|instruction|directive)/i]
  },
  {
    id: 'secret-api-key',
    title: 'Secret-like token',
    category: 'secret',
    severity: 'critical',
    description: 'The file contains text shaped like an API key, token, private key, or credential.',
    remediation: 'Remove the secret, rotate it if real, and replace it with a documented environment variable placeholder.',
    patterns: [/\b(?:sk|pk|ghp|gho|github_pat|xox[baprs])-?[A-Za-z0-9_\-]{20,}\b/, /AKIA[0-9A-Z]{16}/, /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/, /(?:api[_-]?key|token|secret|password)\s*[:=]\s*["']?[A-Za-z0-9_\-]{18,}/i]
  },
  {
    id: 'external-action-without-confirmation',
    title: 'Unsafe external action wording',
    category: 'external-action',
    severity: 'high',
    description: 'Instructions that encourage sending, publishing, deleting, buying, or changing external state without approval are risky.',
    remediation: 'Require explicit human confirmation before external, irreversible, destructive, or privacy-sensitive actions.',
    patterns: [/(send|email|post|tweet|publish|deploy|delete|purchase|charge|transfer|dm) .{0,80}\b(without|no need for|skip) (asking|approval|confirmation|permission)/i, /automatically (send|email|post|tweet|publish|deploy|delete|purchase|charge|transfer|dm)/i]
  },
  {
    id: 'tool-unbounded-execution',
    title: 'Unbounded tool execution wording',
    category: 'external-action',
    severity: 'high',
    description: 'Instructions that grant broad tool execution without scoped inputs, dry-run boundaries, or approval are unsafe for reusable agent prompts.',
    remediation: 'Scope tool use to named inputs and require dry-run or explicit approval for external, destructive, or privacy-sensitive actions.',
    patterns: [/use (any|all|whatever) tools? (you want|needed|available)/i, /run (any|all|whatever) commands? (you want|needed|available)/i, /full access to (shell|filesystem|browser|network|tools?)/i]
  },
  {
    id: 'provenance-missing',
    title: 'Missing provenance section',
    category: 'provenance',
    severity: 'medium',
    description: 'Prompt-like files should explain their source, owner, or intended use before agents trust them.',
    remediation: 'Add a provenance, source attribution, owner, or context section.',
    requiredAny: ['provenance', 'source attribution', 'owner', 'context'],
    appliesToWholeFile: true
  },
  {
    id: 'safety-boundary-missing',
    title: 'Missing safety boundary',
    category: 'safety',
    severity: 'medium',
    description: 'Prompt-like files should state safety, permission, or external-action boundaries.',
    remediation: 'Add a safety, permissions, boundaries, security, or red-lines section.',
    requiredAny: ['safety', 'permission', 'permissions', 'boundaries', 'security', 'red lines', 'red-lines'],
    appliesToWholeFile: true
  }
];
