# Configuration

PromptLintel accepts a JSON config file via `--config`.

```json
{
  "failOn": "high",
  "includeDefaultRules": true,
  "disabledRules": ["provenance-missing"]
}
```

## Fields

- `failOn`: default threshold when the CLI omits `--fail-on`.
- `includeDefaultRules`: set to `false` for a local-only rule set.
- `disabledRules`: list of default or custom rule ids to skip.
- `rules`: experimental custom rule objects matching the exported `Rule` type.

Custom rule regex patterns are loaded with the `i` flag for case-insensitive matching.
