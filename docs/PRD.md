# PromptLintel PRD

Status: in-progress

## Summary

A local prompt-file linter that catches prompt-injection footguns, accidental secrets, unsafe tool wording, and missing provenance before agents consume Markdown instructions. Think of it as a lintel over the doorway where prompts enter your repo. 🧱

## Source attribution

Created during the twice-daily OSS factory run on 2026-05-11. Web search for current developer-tool signals was attempted but the configured provider returned rate-limit/plan errors. Follow-up web fetches reviewed public guidance from GitHub Actions secure-use docs around least privilege and log redaction, and MCP tool docs around human-in-the-loop tool safety. The idea is reframed for local prompt/instruction files and is also informed by recurring OpenClaw/agentic workflow safety needs.

## Target users

- Developers maintaining `AGENTS.md`, skill docs, system prompt snippets, or MCP/tool descriptions.
- Agent operators who want deterministic local checks before handing repo context to an AI.
- OSS maintainers accepting prompt/documentation contributions.

## Problem

Prompt and agent instruction files are code-adjacent but rarely linted. A contributor can accidentally include secrets, instruction-conflict phrases, hidden-tool escalation wording, or ambiguous safety boundaries. Agents then ingest those files with too much trust.

## Goals

- Provide a useful offline CLI for scanning prompt-like Markdown/text files.
- Ship deterministic rules for risky phrases, secret-like values, unresolved safety placeholders, and missing attribution/frontmatter.
- Produce human-readable Markdown and machine-readable JSON reports.
- Support allowlist comments/config so teams can tune findings without hiding them.
- Include fixtures and tests that demonstrate safe, risky, and intentionally allowed prompts.

## Non-goals

- LLM-based prompt judging in V1.
- Replacing secret scanners or policy engines.
- Mutating source files by default.
- Network calls, telemetry, or hosted dashboards.

## V1 CLI

```bash
promptlintel scan AGENTS.md skills/**/*.md --out promptlintel-report.md
promptlintel scan prompts/ --format json --fail-on high
promptlintel rules --format markdown
```

## Functional requirements

1. Accept files, directories, and globs.
2. Detect prompt-injection-like instructions, secret/token patterns, unsafe external-action language, and missing safety/provenance sections.
3. Emit stable Markdown and JSON with severity, file, line, rule id, snippet, and remediation.
4. Support `--fail-on <severity>`, `--config`, `--no-default-rules`, and inline allow comments.
5. Include example fixtures under `examples/` and tests under `tests/`.
6. Avoid telemetry, network access, hidden file writes, or reading outside requested paths.

## Acceptance criteria

- `npm test`, `npm run check`, `npm run build`, and `npm run smoke` pass.
- `bash scripts/validate.sh` passes when present.
- At least one real CLI smoke scans checked-in prompt fixtures and fails/passes as documented.
- README includes quick start, examples, rule philosophy, safety model, limitations, and config docs.
- Public GitHub repo `rogerchappel/promptlintel` has useful description and topics.

## Suggested implementation waves

1. Scaffold TypeScript CLI with StackForge and planning docs.
2. Implement file discovery with path safety.
3. Implement rules engine and default rule set.
4. Add reporters, CLI flags, fixtures, and tests.
5. Add smoke scripts, validation, README polish, package metadata, topics, branch protection.
