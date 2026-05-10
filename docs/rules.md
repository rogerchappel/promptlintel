# Rule philosophy

PromptLintel rules are small deterministic checks. A rule should ship only when it has:

- a stable id;
- a clear severity;
- a remediation that tells maintainers what to do next;
- fixtures for risky, safe, and allowed cases when relevant.

## Severity guide

- `critical` — likely credential exposure or similarly urgent issue.
- `high` — instruction or external-action wording that can cause unsafe agent behavior.
- `medium` — missing context or safety boundaries that reduce reviewability.
- `low` — weak signals that should not usually fail CI.
- `info` — advisory metadata.

## Allow comments

Inline allow comments are intentionally noisy in source. They should explain that a phrase is quoted, synthetic, or otherwise safe in context.
