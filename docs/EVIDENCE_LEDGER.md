# Evidence ledger

Every public claim must link to code, test, report, screenshot, or demo. Until those artifacts exist, claims remain **planned**.

| Claim | Status | Evidence |
| --- | --- | --- |
| Persisted TypeScript workflow with pending review readback | implemented | `@aep/agent`; existing test uses one process, not crash recovery |
| Unresolved/absent evidence blocks approval and edit | implemented; DB verification required | policy tests + expanded `run.integration.test.ts`; rejection remains available |
| Append-only audit trail | partial | AuditEvent writes on retrieval/gate/review; hash chain on create |
| Idempotent durable jobs | verified | `@aep/jobs` DurableRunner: duplicate enqueue + retry/DLQ/replay tests |
| Offline eval harness metrics | verified | `bun run eval:offline` + `reports/offline/2026-08-12-fake-provider.json` (fake provider only) |
| Offline demo without provider credentials | partial | `bun run web:dev` + `eval:offline`; CLI `demo` still AEP-11 |
| Run inspector approve/edit/reject | implemented | policy-aware UI + `decideReview`; edited prose is not automatically grounded |
| Wrong-tenant review refusal | implemented; DB verification required | integration test; client-supplied tenant matching is not authenticated authorization |
| Transactional review writes | implemented; DB verification required | `decideReview` transaction; process-crash and concurrent-decision guarantees not claimed |
| Production authentication / immutable audit chain | **not implemented** | routes lack auth; review events reset previousEventHash |
| Live providers / cost and latency instrumentation | **planned** | fake assessment adapter; live eval stub; telemetry placeholder |
| Live-model quality from offline report | **prohibited** | offline reports prove harness only |
| Workspace verify without credentials | verified | `bun run verify` + GitHub Actions `verify` workflow |
| Production customer deployment | **prohibited** | — |
| SOC 2 / security certification | **prohibited** | — |

## Prohibited language until verified

- “production-ready”
- fabricated latency, cost, or accuracy improvements
- employer product clones or private institutional data
