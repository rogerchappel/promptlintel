# Release Candidate Notes

## Classification

ship

## Candidate Scope

- Adds reusable `SKILL.md` packaging for prompt-file linting workflows.
- Adds report-level severity and category summaries for CI and PR triage.
- Adds a default rule for broad, unbounded tool or command execution wording.
- Keeps scanning deterministic, fixture-backed, local-only, and mutation-free by default.

## Verification Plan

```bash
npm test
npm run check
npm run build
npm run smoke
npm run release:check
bash scripts/validate.sh
```

## Release Risks

- Regex rules can produce false positives when dangerous wording appears in teaching examples.
- Inline allows should stay visible and reviewed.
- PromptLintel is a guardrail for prompt files, not a replacement for runtime permissions or secret scanners.
