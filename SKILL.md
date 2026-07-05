# promptlintel

Use this skill before an agent consumes repository instructions, skill docs, prompt snippets, MCP/tool descriptions, or generated Markdown that will steer future tool use.

## Inputs

- Local files, directories, or workspace-local glob patterns.
- Optional `promptlintel.config.json` for disabled rules, custom rules, and fail threshold.
- Optional inline allow comments for quoted examples and intentional fixtures.

## Side-Effect Boundaries

- Reads only requested local paths.
- Writes only stdout or the explicit `--out` report path.
- Performs no network calls, telemetry, external account writes, or prompt mutation.
- Does not execute commands found in scanned files.

## Approval Requirements

No approval is needed for local scans. Require explicit human approval before using a generated report as a blocking policy, sharing it outside the workspace, or committing exceptions that suppress high or critical findings.

## Examples

```bash
promptlintel scan AGENTS.md skills/**/*.md --fail-on high
promptlintel scan prompts/ --format json --out promptlintel-report.json
promptlintel rules --format markdown
```

## Validation Workflow

1. Run `npm test`.
2. Run `npm run check`.
3. Run `npm run build`.
4. Run `npm run smoke`.
5. Review severity and category summaries before deciding whether findings are release blockers.

