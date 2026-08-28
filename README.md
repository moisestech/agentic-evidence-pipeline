<!-- README: case-study shell. Storyboard WebPs shipped with AEP-07; live captures replace later — see docs/ASSETS.md. -->

<div align="center">
  <img src="docs/assets/aep-mark.svg" alt="Agentic Evidence Pipeline mark: cited evidence nodes resolving into an approved decision" width="88" />

# Agentic Evidence Pipeline

### Evidence in. Reviewable decisions out.

A TypeScript reference implementation for retrieving synthetic evidence, producing a typed assessment with a deterministic fake model, and persisting a human review decision.

[30-second](#the-30-second-version) ·
[Status](#what-works-today-vs-planned) ·
[Architecture](#architecture) ·
[When the model is wrong](#what-happens-when-the-model-is-wrong) ·
[Run locally](#run-it-locally) ·
[Lifecycle](#run-lifecycle) ·
[Evidence map](#evidence-map) ·
[Assets](#visual-assets-needed) ·
[Limits](#status-and-limitations)

![Status](https://img.shields.io/badge/status-building_v0.1-8D9088)
![CI](https://github.com/moisestech/agentic-evidence-pipeline/actions/workflows/verify.yml/badge.svg)
![Offline demo](https://img.shields.io/badge/demo-run_inspector-B6E2BA)

Review-flow recordings are pending. Earlier storyboard assets show an approval policy that has been superseded; they are not runtime evidence.

</div>

## The 30-second version

| | |
| --- | --- |
| **Input** | Versioned public/synthetic evidence (GitHub, HTTP/Markdown, CSV fixtures) |
| **Work** | Postgres hybrid retrieval + a persisted TypeScript state machine; no LangGraph dependency |
| **Review policy** | Unresolved or absent evidence blocks approve and edit; reject remains available |
| **Output** | Review disposition and stored events; edit means edit-and-approve for eligible assessments |
| **Inspectability** | Source revisions, prompt version, citation IDs, run status, stored events; cost/latency instrumentation remains planned |

Not a chatbot. No autonomous third-party writes. Public reference implementation with **public/synthetic fixtures only**.

## What works today vs planned

| Area | Status | Proof |
| --- | --- | --- |
| Monorepo + `bun run verify` + CI | **done** | GitHub Actions `verify` |
| Prisma schema, pgvector column, tenant helpers | **done** | `@aep/db` + migrations |
| Fixture connectors + normalize/hash | **done** | `@aep/contracts` / `@aep/connectors` tests |
| Hybrid retrieval (FTS + vector fusion) | **done** | `@aep/retrieval` + `bun run demo:retrieve` |
| Persisted TypeScript workflow + pending review readback | **implemented** | `@aep/agent`; same-process resume test, not process-crash verification |
| Citation gate in the run path + review UI | **done** | citation_gate_blocked audit + `apps/web` run inspector |
| Durable jobs (idempotency, retry, DLQ/replay) | **done** | `@aep/jobs` DurableRunner + Trigger.dev adapter docs |
| Prompt registry + offline eval harness | **done** | `bun run eval:offline` → `reports/offline/*-fake-provider.json` |
| Trigger.dev cloud deploy + offline demo CLI | partial / planned | optional peer `@trigger.dev/sdk`; CLI demo AEP-11 |
| README review-flow demo | **pending recapture** | Existing storyboards predate the stricter approval policy |

## Why this exists

Most agent demos stop when the model sounds plausible. The hard questions come after:

- Which source revision supported each sentence?
- What happens when the model invents a citation?
- Can a person stop, edit, or reject the decision?
- Does a worker restart preserve pending review?
- Can an operator explain the run without a debugger?

This repo treats those as the product.

## Demo scenario

A program manager evaluates a partner organization against a published digital-readiness rubric:

1. collect public/synthetic evidence;
2. normalize, version, and hash it;
3. retrieve rubric controls + evidence (lexical + vector);
4. produce a bounded, typed assessment;
5. verify every evidence reference;
6. pause when human judgment is required;
7. record the review disposition and audit event in a transaction.

No private institutional, applicant, customer, or contact data.

## Architecture

```mermaid
flowchart TD
    A["Public / synthetic sources"] --> B["Normalize + version evidence"]
    B --> C["Postgres FTS + pgvector"]
    C --> D["Typed fake-model assessment"]
    D --> E["Citation + policy gate"]
    E --> F["Human review"]
    F --> G["Stored review + audit event"]
```

The current assessment adapter is deterministic. A real model would supply interpretation; it must not own permissions, approval policy, or persistence. Citation-ID membership checks do not establish semantic support for every sentence.

Deeper diagrams: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

Discovery, proposed acceptance gates, and handover exercise: [`docs/DELIVERY.md`](docs/DELIVERY.md).

## What happens when the model is wrong?

Memorable failure: fluent assessment + **nonexistent evidence ID**.

```mermaid
sequenceDiagram
    participant M as ModelAdapter
    participant V as CitationGate
    participant R as ReviewQueue
    participant L as AuditLedger
    M->>V: Typed assessment with invalid evidence ID
    V->>V: Validate schema and citation allowlist
    V-->>R: Block finalization and attach unsupported claim
    R->>L: Record reviewable failure event
```

The system does not repair unsupported claims with invented prose. Missing evidence or an invalid citation produces `insufficient_evidence` and `needs_review`. Ordinary approval and text-only editing are refused while that issue remains. A reviewer may reject the assessment; `finalized` means the review ended, not that the assessment was approved.

There is no privileged override or evidence-repair editor in this version. A valid assessment may be approved or edited-and-approved; semantic correctness of the edited prose remains a reviewer responsibility.

## Run it locally

**Requirements:** Bun 1.2+, Docker (for Postgres). No model-provider credential for offline unit tests.

```bash
git clone https://github.com/moisestech/agentic-evidence-pipeline.git
cd agentic-evidence-pipeline
bun install --frozen-lockfile
cp .env.example .env
bun run db:up          # Docker Desktop must be running
bun run db:migrate
bun run bootstrap
bun run doctor
bun run verify
```

Without a local database, `bun run verify` runs format/lint/typecheck/unit tests. DB integration tests require both `DATABASE_URL` and `AEP_INTEGRATION=1`; otherwise they skip. A green unit-only run does not verify persisted review behavior.

| Command | Meaning |
| --- | --- |
| `bun run verify` | Format, lint, typecheck, tests (CI gate) |
| `bun run demo:retrieve` | Seed fixtures and print lexical/vector/hybrid hits (needs Docker DB) |
| `bun run web:dev` | Run inspector UI on :3010 (needs Docker DB + migrate) |
| `bun run eval:offline` | Deterministic golden-set harness report (no provider credential) |
| `bun run eval:live` | Gated stub; not a working live-model evaluation |
| `bun run demo` | Full offline CLI review flow — **AEP-11** |

## Run lifecycle

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
    needs_review --> approved: eligible evidence only
    needs_review --> rejected
    approved --> finalized
    rejected --> finalized
    failed --> [*]
    finalized --> [*]
```

## Evidence map

| Capability | Implementation | Verification | Artifact |
| --- | --- | --- | --- |
| Workspace quality gate | root + turbo | `bun run verify` / CI | Actions badge |
| Tenant-scoped DB | `packages/db` | tenant unit + integration tests | migrations |
| Fixture connectors + hash | `packages/connectors` | connector contract tests | `fixtures/` |
| Citation allowlist helper | `packages/contracts` | citation-gate unit tests | [`demo-invalid-citation.webp`](docs/assets/demo-invalid-citation.webp) |
| Persisted workflow + HITL | `packages/agent` | DB readback, blocked-decision and valid-review integration tests | run inspector timeline |
| Hybrid retrieval | `packages/retrieval` | RRF unit tests + CI integration | `demo:retrieve` |
| Run inspector UI | `apps/web` | policy-aware controls; runtime visual verification separate | `bun run web:dev` |
| Durable jobs + DLQ/replay | `packages/jobs` | duplicate + failure-injection unit tests | ADR 0006 |
| Prompt registry | `packages/prompts` | version + checksum registry tests | `assess-control@1.0.0` |
| Offline eval harness | `packages/evals` | 30-case golden set + metrics tests | [`reports/offline/2026-08-12-fake-provider.json`](reports/offline/2026-08-12-fake-provider.json) |

Full claim index: [`docs/EVIDENCE_LEDGER.md`](docs/EVIDENCE_LEDGER.md).

## Visual assets needed

README packaging checklist (what exists vs what to capture next):

| Need | File | Status |
| --- | --- | --- |
| Mark / lockup | `docs/assets/aep-mark.svg`, `aep-lockup.svg` | **done** |
| Social preview | `docs/assets/social-preview.png` | **done** |
| Architecture Mermaid | in README / ARCHITECTURE | **done** |
| Demo review loop | `docs/assets/demo-review-flow.webp` | **superseded storyboard**; recapture new policy |
| Invalid-citation clip | `docs/assets/demo-invalid-citation.webp` | storyboard, not a recording |
| Run inspector shot | `docs/assets/run-inspector.png` | after AEP-10 |
| Eval report shot | `docs/assets/eval-offline-report.png` | JSON report committed; PNG optional |

Details, capture rules, and production order: **[`docs/ASSETS.md`](docs/ASSETS.md)**.

## Design decisions

- One explicit graph, not multi-agent theater.
- Postgres for lexical + vector retrieval (fewer ops surfaces).
- Deterministic fake provider is first-class for CI.
- Human review is persisted state, not a browser modal.
- Every public claim needs linked evidence.

ADRs: [`docs/adr/`](docs/adr/).

## Status and limitations

**Status:** building toward `v0.1.0` (AEP-01–AEP-09 landed).

This is a public reference implementation—not customer production, SOC 2, or a security certification. No email/SMS, no autonomous final decisions, no private data in fixtures.

- **Local synthetic use only:** routes do not authenticate users. Comparing a supplied tenant ID with a run is not authorization; read endpoints are not a production tenant boundary.
- **Citation scope:** ID allowlisting is not semantic grounding. The offline report evaluates a fake-provider harness, not live model quality or production Postgres search relevance.
- **Review persistence:** decision writes share a transaction and claim a pending run conditionally. Independent process-crash and concurrency testing are still required before stronger operational claims.
- **Audit scope:** events are stored, but database immutability is not enforced and review events currently start a new hash chain.
- **Deployment scope:** live providers, telemetry, cloud operation, and the full offline CLI demo remain incomplete.

See [`docs/EVIDENCE_LEDGER.md`](docs/EVIDENCE_LEDGER.md) for prohibited claims.

## Origin

Extracted from patterns behind production generative storytelling, institutional memory/retrieval, governed approval workflows, and model cost/latency instrumentation—without publishing client or institutional data.

[Moises Sanabria](https://moises.tech) — full-stack AI systems builder and artist in Miami.

## License

[MIT](LICENSE)
