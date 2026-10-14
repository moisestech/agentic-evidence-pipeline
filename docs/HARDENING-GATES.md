# AEP reliability hardening gates

**Status:** proposed engineering gates, **not** implemented guarantees. Reviewed against `main` on 2026-10-14 (latest main commit observed: `ac3b0e260b6b4bfba63cac8bc95147bd14c5ba91`). No fresh local test execution was performed for this document.

**Product decision:** AEP is the reusable *evidence, policy, execution and inspection pattern* for AI24 consulting work. It is not a replacement runtime for other projects and is not a production-certified multitenant service.

## Current evidence and ordering

The current monorepo includes Postgres/pgvector retrieval, citations by ID, an offline fake assessment, persisted review records, durable-job abstractions, a Next.js inspector, and a fake-provider evaluation suite. `packages/telemetry` remains a placeholder. Live model quality, authenticated API access, a continuous tamper-evident audit chain, and process-crash recovery are not yet proven.

Two existing draft PRs must be accounted for **before** starting overlapping changes:

- [PR #1](https://github.com/moisestech/agentic-evidence-pipeline/pull/1) strengthens review authorization *policy*, decision atomicity, regression tests, and documentation. **Revalidate against current main and merge before adding more review features.** It does not implement user authentication.
- [PR #2](https://github.com/moisestech/agentic-evidence-pipeline/pull/2) adds an evidence control-plane UI, stacked on PR #1. Rebase/test against the accepted policy before merging; do not treat stage graphics as live telemetry.

Do not claim these branches are merged or passing on the current main until verified.

## P0 — protect correctness and access

| Gate | Implementation boundary | Acceptance evidence |
| --- | --- | --- |
| **P0-A Review decisions are fail-closed** | `packages/agent/src/run.ts`, `policy.ts`, review routes | Invalid/unresolved/zero evidence **cannot** be approved or edited-to-approve; rejection/pending remains possible. Database tests prove state transitions, tenant matching and concurrent decisions. Integrate PR #1 first. |
| **P0-B Identity and authorization** | `apps/web/app/api/**`, agent commands | Session/service identity and tenant scope come from trusted server context, **not** a client-supplied tenant ID or a fixed reviewer string. Every run read, evidence read, mutation and demo creation checks object-level authorization. Two-tenant negative tests return no other tenant's data. |
| **P0-C Public demo containment** | `apps/web/app/api/demo/route.ts`, deployment config | Anonymous tenant creation and review APIs are disabled outside an explicitly authorized synthetic demo environment; resource limits apply. No private/customer datasets. |
| **P0-D CI does not misrepresent coverage** | `.github/workflows/verify.yml`, Turbo settings | Required DB tests run with explicit test environment propagation; a skipped integration suite cannot be mistaken for full green acceptance. Pin the full verifier command and record exact counts. |
| **P0-E Side effects are permission-gated** | Domain adapter boundary | No external CRM, email, WhatsApp, payments, or machine action executes from generated prose. Explicit scoped authorization, actor, confirmation, idempotency key and receipt are required for the proposed action. |

**Release boundary:** Until P0-B/C are implemented and verified, run the inspector only with synthetic data in a locally controlled environment. This is not a production deployment recommendation.

## P1 — make execution and evidence provable

| Gate | Implementation boundary | Acceptance evidence |
| --- | --- | --- |
| **P1-A Claim-level grounding** | `packages/contracts`, `packages/agent` | Each material claim refers to source revision/hash plus row, quote span or deterministic derivation. Citation-ID membership is necessary but **not sufficient** for semantic support. Unsupported, missing or contradictory evidence abstains or requests review. |
| **P1-B Audit continuity** | `packages/agent/src/run.ts`, `AuditEvent` | Sequence and previous-hash link survive all lifecycle stages including human decisions; append and status transitions are transactional. An independent verifier detects missing/reordered/tampered records. DB edit/delete controls are documented and tested. |
| **P1-C Durable recovery** | `packages/jobs` | Lease/heartbeat expiration, worker restart, retry caps, dead-letter replay and same-idempotency concurrent enqueue are exercised under failure injection. Side effects cannot silently repeat. |
| **P1-D Real observability** | `packages/telemetry`, `apps/web` | Actual spans/events for retrieval, validation, tool invocation, review, retries and errors. Measured latency, model tokens and estimated cost display only when available; missing measurements are `unknown`, never zero. Trace correlation works across API/jobs. |
| **P1-E Evaluation is honest** | `packages/evals` | Fake-provider metrics remain labeled simulation. Add independently reviewed adversarial, cross-tenant, unsupported-claim and restart fixtures. A separately labeled live-provider evaluation is optional and opt-in; never blend results. |
| **P1-F Data and safety hardening** | connectors, embedding SQL, evidence stores | Validate resource limits and embedding dimensions/finiteness; add source trust boundaries, prompt-injection fixtures, data-retention rules and privacy-safe exports. Sensitive data is neither streamed to browser nor logged by default. |

## P2 — portability and shipping discipline

| Gate | Acceptance evidence |
| --- | --- |
| **P2-A Portable contracts** | Versioned schema for claims, evidence references, verification results and execution events; Python-compatible JSON fixtures; backward-compatibility tests. See [PORTABLE-CONTRACTS.md](./PORTABLE-CONTRACTS.md). |
| **P2-B Fresh-clone demo** | `bootstrap`, `doctor`, single command synthetic run; tested by an independent clean environment, not just a dev workstation. |
| **P2-C Trace UI** | Run inspector shows only persisted facts; pause/cancel/retry/error/reconnect are displayed correctly. Progressive disclosure and accessible status labels. No fabricated chain-of-thought. |
| **P2-D Release evidence** | Publish a dated evidence ledger with commit SHA, fixtures, verifier command, green CI and known limitations; tag only after agreed P0/P1 gates. |
| **P2-E Adoption pilot** | One limited, reversible implementation in another repository; no centralized data transfer required. See [PROJECT-ADOPTION.md](./PROJECT-ADOPTION.md). |

## Definition of done for every control

A control is **done** only when all five exist: (1) an executable enforcement point, (2) at least one positive and one negative regression, (3) evidence from CI or a reproducible test, (4) failure behavior visible in logs/trace/UI, and (5) documentation that names what remains unproven.

Documentation, an animation, an LLM self-evaluation, and a green test run with integrations silently skipped are **not** enforcement evidence.

## Cross-cutting engineering principles

1. **Deterministic core, probabilistic edges.** The model may interpret intent or summarize *provided* evidence, never supply authority for calculations, permissions, state transitions or actions.
2. **Trust boundaries precede prompts.** Authentication, source filters, tenant access, tool scopes, input validation and approval are code-level controls.
3. **Provenance survives transformations.** Source revision and content digest must remain traceable through retrieval, derived calculations, decision and inspection.
4. **Visible truth, not theater.** A progress step is emitted by a real operation; no fabricated token counts, latency, tool calls or private reasoning.
5. **Least coupling.** Each application owns authentication, data and business decisions. AEP supplies versioned contracts and reference enforcement patterns.
6. **Fail safely and explain the limit.** Record what was attempted, which gate blocked it, and what human or input is needed to proceed.
7. **No inflated claims.** A reference implementation, fake provider, and synthetic demo are not production readiness, semantic grounding guarantees, or compliance certification.

## Relevant standards (for implementation evaluation, not compliance claims)

- [OWASP API Security Top 10](https://api-security.owasp.org/editions/2023/en/0x11-t10/) — authorization at every object/action boundary.
- [OpenTelemetry GenAI span conventions](https://github.com/open-telemetry/semantic-conventions-genai/blob/main/docs/gen-ai/gen-ai-spans.md) — instrument model, agent, workflow and tool operations; conventions are still evolving and should be version-pinned.
- [AG-UI events](https://github.com/ag-ui-protocol/ag-ui/blob/main/docs/concepts/events.mdx) — reference for frontend lifecycle/tool/event interoperability, not a requirement to adopt the whole protocol.

## Next pull requests

1. Reconcile/accept PR #1 with current `main` and CI; inspect PR #2 afterward.
2. Implement P0-B/C as a small security-only PR with isolation tests, before any public deployment.
3. Implement P1-A with claim/evidence fixtures and abstention regressions.
4. Implement P1-B/C recovery and integrity tests.
5. Instrument P1-D, then wire the UI to real events.
6. Pilot the contracts in one app, measure reuse/friction, and only then extract shared packages.

No automatic merge or release is implied by this plan.
