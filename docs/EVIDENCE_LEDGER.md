# Evidence ledger

Every public claim must link to code, test, report, screenshot, or demo. Until those artifacts exist, claims remain **planned**.

| Claim | Status | Evidence |
| --- | --- | --- |
| Stateful agent with human interrupt/resume | planned | `packages/agent` + restart/resume test |
| Hybrid FTS + pgvector retrieval | verified | `@aep/retrieval` RRF + offline embedder; CI integration with `AEP_INTEGRATION=1` |
| Tenant isolation at query boundary | partial | `listEvidenceForTenant` + unit/integration tests |
| Fixture connectors + normalize/hash | verified | `@aep/connectors` + `fixtures/` + contract tests |
| Citation allowlist fails closed | partial | `@aep/contracts` helper + unit tests; full gate + fixture demo still planned |
| Append-only audit trail | planned | approve/edit/reject E2E + event hash tests |
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
