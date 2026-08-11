# Evidence ledger

Every public claim must link to code, test, report, screenshot, or demo. Until those artifacts exist, claims remain **planned**.

| Claim | Status | Evidence |
| --- | --- | --- |
| Stateful agent with human interrupt/resume | planned | `packages/agent` + restart/resume test |
| Hybrid FTS + pgvector retrieval | planned | `packages/retrieval` + offline eval report |
| Citation allowlist fails closed | planned | invalid-citation fixture + gate tests |
| Append-only audit trail | planned | approve/edit/reject E2E + event hash tests |
| Idempotent durable jobs | planned | duplicate-trigger + replay tests |
| Offline demo without provider credentials | planned | `bun run demo` + `eval:offline` |
| Production customer deployment | **prohibited** | — |
| SOC 2 / security certification | **prohibited** | — |
| Live-model quality from offline report | **prohibited** | offline reports prove harness only |

## Prohibited language until verified

- “production-ready”
- fabricated latency, cost, or accuracy improvements
- employer product clones or private institutional data
