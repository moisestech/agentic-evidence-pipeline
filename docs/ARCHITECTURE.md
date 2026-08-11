# Architecture

**Status:** target architecture for `v0.1`. Components named below are planned package boundaries; treat unimplemented paths as design, not shipped code.

## Overview

```mermaid
flowchart TD
    A["Public / synthetic sources"] --> B["Normalize + version evidence"]
    B --> C["Postgres FTS + pgvector"]
    C --> D["Typed LangGraph assessment"]
    D --> E["Citation + policy gate"]
    E --> F["Human review"]
    F --> G["Append-only audit trail"]
```

## Container view (planned)

```mermaid
flowchart LR
    Web["apps/web<br/>review + run inspector"] --> API["apps/api<br/>NestJS REST"]
    API --> Agent["packages/agent<br/>LangGraph"]
    API --> Retrieval["packages/retrieval"]
    Jobs["trigger/<br/>durable jobs"] --> Agent
    Jobs --> Connectors["packages/connectors"]
    Agent --> Contracts["packages/contracts"]
    Retrieval --> DB["packages/db<br/>Postgres + pgvector"]
    Connectors --> DB
    Agent --> Telemetry["packages/telemetry"]
    Jobs --> Telemetry
```

## Run state machine

Explicit states:

1. `queued`
2. `collecting`
3. `normalizing`
4. `retrieving_controls`
5. `assessing`
6. `validating`
7. `needs_review`
8. `approved` | `rejected`
9. `finalized` | `failed`

```mermaid
stateDiagram-v2
    [*] --> queued
    queued --> collecting
    collecting --> normalizing
    normalizing --> retrieving_controls
    retrieving_controls --> assessing
    assessing --> validating
    validating --> needs_review: uncertain / adverse / approval required
    validating --> failed: invalid and unrecoverable
    needs_review --> approved
    needs_review --> rejected
    approved --> finalized
    rejected --> finalized
    failed --> [*]
    finalized --> [*]
```

Invalid transitions fail with a typed domain error. Restarting the API or worker must not lose a pending review.

## Evidence lineage

```mermaid
flowchart LR
    S["Source revision"] --> E["EvidenceItem"]
    E --> R["Retrieval result"]
    R --> C["Sentence citation"]
    C --> D["Review decision"]
    D --> A["Audit event"]
```

## Failure and replay (planned)

```mermaid
sequenceDiagram
    participant Job as Trigger job
    participant Gate as Citation gate
    participant Review as Review queue
    participant Ledger as Audit ledger
    Job->>Gate: Assessment payload
    Gate-->>Job: Unsupported citation
    Job->>Review: Route needs_review
    Review->>Ledger: Append failure + resume command
```

Memorable fixture: fluent model output with a nonexistent evidence ID. The citation gate blocks finalization and routes to human review.

## Deterministic vs model-driven nodes

| Deterministic | Model-driven |
| --- | --- |
| Fetch fixtures, normalize, hash | Map evidence to rubric control |
| Retrieve with filters | Write bounded assessment summary |
| Validate schema, verify citations | Bounded repair attempt on schema failure |
| Persist audit events | — |
| Approve / edit / reject commands | — |

## Stack targets

- Bun + Turborepo monorepo
- Next.js App Router review UI
- NestJS REST API with committed OpenAPI
- PostgreSQL + pgvector; Prisma migrations; isolated SQL for vector ops if required
- LangGraph JS with persisted interrupt/resume
- Trigger.dev for durable collection/assessment jobs
- Zod contracts shared across boundaries
- OpenTelemetry-compatible traces; privacy-safe structured logs
- Docker Compose for local Postgres/pgvector

## Related docs

- [EVIDENCE_LEDGER.md](./EVIDENCE_LEDGER.md)
- [FAILURE_MODES.md](./FAILURE_MODES.md)
- [OPERATIONS.md](./OPERATIONS.md)
- [SECURITY.md](./SECURITY.md)
- [DEMO_SCRIPT.md](./DEMO_SCRIPT.md)
- [adr/](./adr/)
