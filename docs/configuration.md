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

The config must be a JSON object containing only these fields. `failOn` must be a documented severity, `includeDefaultRules` must be boolean, and `disabledRules` must be an array of non-empty strings.

Custom rules require non-empty `id`, `title`, `description`, and `remediation` strings plus a supported `category`, a documented `severity`, and either `patterns` or `requiredAny`. `patterns` and `requiredAny` must contain non-empty strings; whole-file rules require `requiredAny`. Regex patterns are validated and loaded with the `i` flag for case-insensitive matching.

PromptLintel validates the complete configuration before scanning. Malformed JSON, unknown fields, invalid types, incomplete rules, and invalid regular expressions produce a clear diagnostic and exit status 2.
