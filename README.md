# PromptLintel 🧱

PromptLintel is a local CLI that lint-checks prompt-like files before agents ingest them. It looks for prompt-injection footguns, secret-shaped strings, unsafe external-action wording, and missing provenance or safety boundaries.

It is deliberately boring in the best way: deterministic rules, stable Markdown/JSON reports, no telemetry, no network calls, and no surprise file edits.

## Install

```bash
npm install -D promptlintel
npx promptlintel scan AGENTS.md prompts/**/*.md
```

From this repository:

```bash
npm install
npm run build
node dist/cli.js scan examples/fixtures --fail-on high
```

## Quick start

```bash
promptlintel scan AGENTS.md skills/**/*.md --out promptlintel-report.md
promptlintel scan prompts/ --format json --fail-on high
promptlintel rules --format markdown
```

A failing result means at least one finding met or exceeded `--fail-on` (`info`, `low`, `medium`, `high`, or `critical`).

## What it catches

- **Prompt injection footguns** — phrases like “ignore previous instructions” or hidden-directive wording.
- **Secret-like strings** — token/API-key/private-key patterns that should not live in prompt files.
- **Unsafe external actions** — wording that encourages sending, posting, deleting, purchasing, or publishing without approval.
- **Missing provenance** — prompt files with no source, owner, context, or attribution.
- **Missing safety boundary** — prompt files with no safety, permissions, security, or red-lines section.

## Inline allows

Use allows sparingly and visibly. They are for quoted examples, fixtures, and documented exceptions — not for hiding risk.

```md
<!-- promptlintel-allow injection-ignore-prior-instructions -->
A malicious prompt may say: ignore previous instructions.
```

Use `promptlintel-allow *` only in small fixture files where every finding is intentional.

## Config

`promptlintel.config.json` can disable defaults, add local rules, or set the default fail threshold:

```json
{
  "failOn": "high",
  "includeDefaultRules": true,
  "disabledRules": ["provenance-missing"]
}
```

Run with:

```bash
promptlintel scan prompts --config promptlintel.config.json
```

## Reports

Markdown reports are meant for humans and PR comments. JSON reports are stable enough for CI tooling and simple policy scripts. Each finding includes severity, rule id, file, line, column, snippet, and remediation.

## Safety model

PromptLintel is a lintel, not a vault door. It reduces common mistakes before prompt files reach an agent, but it does not replace secret scanners, code review, permission boundaries, or runtime human-in-the-loop controls.

Project promises:

- no telemetry;
- no network access;
- no mutation of scanned files;
- no hidden writes;
- no reading outside requested paths.

## Examples

```bash
node dist/cli.js scan examples/fixtures/safe-agent.md --format markdown
node dist/cli.js scan examples/fixtures/risky-agent.md --format json --fail-on high
node dist/cli.js scan examples/fixtures/allowed-example.md --format json
```

## Development

```bash
npm test
npm run check
npm run build
npm run smoke
bash scripts/validate.sh
```

## Contributing

Contributions are welcome when they keep the tool deterministic, local-first, and easy to audit. Add fixtures and tests for every new rule. Avoid broad regexes that create noisy reports without clear remediation.

## Limitations

- V1 is rule-based and does not use an LLM.
- Secret detection is intentionally conservative and not a full credential scanner.
- Glob support is intentionally small and local to the current workspace.
- Findings should be reviewed by humans before turning them into policy.
