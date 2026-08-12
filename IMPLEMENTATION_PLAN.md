# Implementation plan — Agentic Evidence Pipeline

Mapped from Miami Applied AI / FDE repo specs. Implement one numbered task at a time; commit after each green `verify` when possible.

| ID | Status | Task | Verification |
| --- | --- | --- | --- |
| AEP-01 | done | Bun/Turborepo workspace + CI | `bun install --frozen-lockfile && bun run verify` |
| AEP-02 | done | Postgres/pgvector, Prisma, tenant tests | migration + isolation tests |
| AEP-03 | done | Fixture connectors + normalize/hash | connector contract tests |
| AEP-04 | done | Lexical/vector retrieval + fusion | retrieval unit + CI integration |
| AEP-05 | done | Persisted state graph + interrupt/resume | restart/resume integration test |
| AEP-06 | done | Typed output, citation gate, fake invalid citation | malformed/citation failure tests |
| AEP-07 | pending | Review UI + audit events | approve/edit/reject E2E |
| AEP-08 | pending | Trigger.dev, idempotency, DLQ/replay | duplicate + failure-injection tests |
| AEP-09 | pending | Prompt registry + offline/live eval | versioned offline report |
| AEP-10 | pending | Traces, cost/latency, run inspector | aggregation tests |
| AEP-11 | pending | Full bootstrap/doctor/demo + ops | fresh-clone record |
| AEP-12 | pending | Demo recording + evidence ledger + `v0.1.0` | release tag |

## AEP-01–AEP-03 notes

- Shared contracts live in `@aep/contracts` (Zod + citation allowlist + content hash helpers).
- `@aep/connectors` normalizes GitHub / HTTP Markdown / CSV fixtures into versioned sources + evidence.
- `@aep/db` owns Prisma + isolated pgvector SQL; remaining packages are typed placeholders.
- `demo` / `eval:*` exit nonzero until later tasks implement them.
- Offline CI requires no provider credentials; Postgres is provided as a CI service for migrations/integration tests.
- Visual packaging checklist: `docs/ASSETS.md`.
