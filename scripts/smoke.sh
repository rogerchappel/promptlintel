#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo_root"

npm run build >/dev/null

node dist/cli.js rules --format markdown >/tmp/promptlintel-rules.md
grep -q "injection-ignore-prior-instructions" /tmp/promptlintel-rules.md

node dist/cli.js scan examples/fixtures/safe-agent.md --format markdown --fail-on high >/tmp/promptlintel-safe.md
grep -q "Status: pass" /tmp/promptlintel-safe.md

if node dist/cli.js scan examples/fixtures/risky-agent.md --format json --fail-on high >/tmp/promptlintel-risky.json; then
  echo "risky fixture unexpectedly passed" >&2
  exit 1
fi
grep -q "secret-api-key" /tmp/promptlintel-risky.json

node dist/cli.js scan examples/fixtures/allowed-example.md --format json --fail-on high >/tmp/promptlintel-allowed.json
