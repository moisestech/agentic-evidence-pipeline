# Evidence ledger

Every public claim must link to code, test, report, screenshot, or demo. Until those artifacts exist, claims remain **planned**.

| Claim | Status | Evidence |
| --- | --- | --- |
| Stateful agent with human interrupt/resume | verified | `@aep/agent` runAssessment/resumeRun + CI integration |
| Citation allowlist fails closed | verified | fake model fabricated ID + applyCitationGate + audit event |
| Append-only audit trail | partial | AuditEvent writes on retrieval/gate/review; hash chain on create |
| Idempotent durable jobs | verified | `@aep/jobs` DurableRunner: duplicate enqueue + retry/DLQ/replay tests |
| Offline eval harness metrics | verified | `bun run eval:offline` + `reports/offline/2026-08-12-fake-provider.json` (fake provider only) |
| Offline demo without provider credentials | partial | `bun run web:dev` + `eval:offline`; CLI `demo` still AEP-11 |
| Run inspector approve/edit/reject | verified | `apps/web` API + UI wired to `decideReview` |
| Live-model quality from offline report | **prohibited** | offline reports prove harness only |
| Workspace verify without credentials | verified | `bun run verify` + GitHub Actions `verify` workflow |
| Production customer deployment | **prohibited** | — |
| SOC 2 / security certification | **prohibited** | — |

## Prohibited language until verified

- “production-ready”
- fabricated latency, cost, or accuracy improvements
- employer product clones or private institutional data
