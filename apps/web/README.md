# Agentic Evidence Pipeline

Status: **building toward v0.1.0**. This repository is a public reference implementation shell. Runtime packages, CI gates, and offline demos are planned; do not treat placeholders as shipped behavior.

## Planned layout

```text
apps/
  web/                  # review UI, run inspector, eval dashboard
  api/                  # NestJS REST/OpenAPI service
packages/
  agent/                # LangGraph state, nodes, transitions, interrupts
  connectors/           # GitHub, HTTP/Markdown, CSV fixture connectors
  contracts/            # Zod DTOs and domain contracts
  db/                   # Prisma client, migrations, vector SQL boundary
  retrieval/            # FTS, vector, fusion, visibility filters
  prompts/              # versioned prompt registry
  evals/                # golden set, metrics, comparison runner
  telemetry/            # traces, token/cost/latency, redaction
  testkit/              # fakes, failure injection, deterministic clocks
trigger/                # durable job definitions
fixtures/               # public/synthetic evidence and golden examples
```

## Commands (planned)

| Command | Purpose |
| --- | --- |
| `bun run bootstrap` | Validate dependencies and prepare local config |
| `bun run doctor` | Check runtime, database, fake provider, worker, API |
| `bun run demo` | Seeded offline review flow |
| `bun run verify` | Format, lint, typecheck, tests |
| `bun run eval:offline` | Deterministic eval with fake provider |
| `bun run eval:live` | Explicit opt-in live-provider eval |

See [ARCHITECTURE.md](./ARCHITECTURE.md) for the target system design.
