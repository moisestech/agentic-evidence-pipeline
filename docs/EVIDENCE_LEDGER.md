# Evidence ledger

Every public claim must link to code, test, report, screenshot, or demo. Until those artifacts exist, claims remain **planned**.

| Claim | Status | Evidence |
| --- | --- | --- |
| Stateful agent with human interrupt/resume | verified | `@aep/agent` runAssessment/resumeRun + CI integration |
| Citation allowlist fails closed | verified | fake model fabricated ID + applyCitationGate + audit event |
| Append-only audit trail | partial | AuditEvent writes on retrieval/gate/review; hash chain on create |
| Idempotent durable jobs | planned | duplicate-trigger + replay tests |
| Offline demo without provider credentials | planned | `bun run demo` (AEP-03–AEP-07) |
| Workspace verify without credentials | verified | `bun run verify` + GitHub Actions `verify` workflow |
| Production customer deployment | **prohibited** | — |
| SOC 2 / security certification | **prohibited** | — |
| Live-model quality from offline report | **prohibited** | offline reports prove harness only |

## Prohibited language until verified

- “production-ready”
- fabricated latency, cost, or accuracy improvements
- employer product clones or private institutional data
