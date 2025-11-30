Title: JSON and JSONC policy

Summary
- Enforce consistent, correct handling of JSON and JSONC across the repository.

Classification
- JSONC (JSON with comments):
  - tsconfig*.json, jsconfig.json
  - Other files explicitly known to support comments by their tools
- Strict JSON: All other .json files

Formatting
- Use 2-space indentation.
- Stable key ordering via Prettier where applicable.
- No trailing commas in strict JSON files. Trailing commas allowed where parsers support JSONC.

Validation
- JSON: Validate using JSON.parse (Node) or jq.
- JSONC: Skip strict validation or parse using a JSONC-aware parser if wired into tooling.

Generated artifacts
- Exclude generated/report directories from manual review and strict validation (examples):
  - backend/target
  - frontend/coverage/.tmp
  - playwright-report
  - Any build/cache directories

Change control
- Treat configuration changes as code; review and test where they influence builds or runtime behavior.
- Keep environment-specific values in env files or environment variables; avoid hardcoding secrets.
