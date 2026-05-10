# PromptLintel orchestration

PromptLintel was built in small, reviewable waves so agents and humans can inspect each layer:

1. **Scaffold** — create the public-package skeleton with StackForge and preserve the PRD in `docs/PRD.md`.
2. **Planning** — capture rules, validation, and release expectations before implementation.
3. **Core** — keep scanning deterministic, local-only, and independent from network services.
4. **Reports** — make Markdown and JSON stable so CI diffs are useful.
5. **Examples and tests** — prove risky, safe, and allowed prompts behave as documented.
6. **Publish and protect** — push directly to `main`, then best-effort enable GitHub branch protection.

## Safety constraints

- No telemetry or network calls.
- No hidden writes; reports only go to explicit `--out` paths or stdout.
- Do not follow arbitrary expansion outside requested roots.
- Inline allows must be visible in source and tied to a specific rule id.

## Verification gates

Run these before release:

```bash
npm test
npm run check
npm run build
npm run smoke
bash scripts/validate.sh
node dist/cli.js scan examples --fail-on critical --format markdown
```
