# Fixtures

Public and synthetic evidence only. No private institutional, applicant, or customer data.

| Path | Connector kind | Used by |
| --- | --- | --- |
| `github/partner-org-readme.md` | github | demo fixture pack |
| `http/digital-readiness.md` | http_markdown | demo fixture pack |
| `csv/inventory.csv` | csv | demo fixture pack |
| `evals/golden-set.json` | offline eval | `@aep/evals` / `bun run eval:offline` |

Load connectors via `@aep/connectors` `collectDemoFixturePack` (AEP-03). Golden-set evals are synthetic harness cases only.
