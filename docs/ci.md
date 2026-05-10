# CI usage

PromptLintel works as a normal local command in CI:

```yaml
- run: npm ci
- run: npm run build
- run: node dist/cli.js scan AGENTS.md docs/**/*.md --format markdown --out promptlintel-report.md --fail-on high
```

Recommended policy:

1. Start with Markdown reports in pull requests.
2. Fail on `critical` first.
3. Move to `high` once fixtures and allow comments are in place.
4. Keep provenance and safety findings visible even if they do not fail early adoption.
