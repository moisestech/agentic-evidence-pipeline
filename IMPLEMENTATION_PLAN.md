# Implementation plan — Agentic Evidence Pipeline

Mapped from Miami Applied AI / FDE repo specs. Implement one numbered task at a time; commit after each green `verify` when possible.

| ID | Status | Task | Verification |
| --- | --- | --- | --- |
| AEP-01 | done | Bun/Turborepo workspace + CI | `bun install --frozen-lockfile && bun run verify` |
| AEP-02 | done | Postgres/pgvector, Prisma, tenant tests | migration + isolation tests |
| AEP-03 | pending | Fixture connectors + normalize/hash | connector contract tests |
| AEP-04 | pending | Lexical/vector retrieval + fusion | retrieval baseline report |
| AEP-05 | pending | LangGraph + interrupt/resume | restart/resume integration test |
| AEP-06 | pending | Typed output, repair, citation gate | malformed/citation failure tests |
| AEP-07 | pending | Review UI + audit events | approve/edit/reject E2E |
| AEP-08 | pending | Trigger.dev, idempotency, DLQ/replay | duplicate + failure-injection tests |
| AEP-09 | pending | Prompt registry + offline/live eval | versioned offline report |
| AEP-10 | pending | Traces, cost/latency, run inspector | aggregation tests |
| AEP-11 | pending | Full bootstrap/doctor/demo + ops | fresh-clone record |
| AEP-12 | pending | Demo recording + evidence ledger + `v0.1.0` | release tag |

## AEP-01 notes

- Shared contracts live in `@aep/contracts` (Zod + citation allowlist helper).
- Remaining packages are typed placeholders so turbo has a real graph.
- `demo` / `eval:*` exit nonzero until later tasks implement them.
- Offline CI requires no provider credentials.
