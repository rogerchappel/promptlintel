# Contributing to PromptLintel

Thanks for helping make prompt files safer to hand to agents.

## Development loop

```bash
npm install
npm test
npm run check
npm run build
npm run smoke
```

## Rule changes

For every new or changed rule:

- keep the rule deterministic and local-only;
- add or update fixtures under `examples/fixtures/`;
- add tests for risky, safe, and allowed cases;
- include remediation text that a maintainer can act on;
- avoid rules that require network calls, telemetry, or hidden state.

## Pull requests

Please explain the safety problem, expected false-positive profile, and examples. Small focused PRs are much easier to review.
