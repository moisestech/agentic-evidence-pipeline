# Portable evidence and execution contracts (proposal)

**Status:** interoperability design, not implemented runtime code. Intended to let Python, TypeScript, Streamlit, Next.js and asynchronous workers describe the same facts without importing AEP's entire stack.

## What should be reusable

```text
Application-specific input and identity
    -> authorized domain action / deterministic computation
    -> source/evidence/derivation receipts
    -> claim-level verification and policy decision
    -> typed execution and approval events
    -> user progress view + developer trace
```

The AEP library is **not** the central database or mandatory orchestrator for Deloitte, DCC, BFI or AI24. A small versioned schema is the reusable artifact; each app owns authentication and state. Adopt one contract at a time.

## 1. Evidence and claim schema

**Illustrative v0 proposal** (turn into Zod + JSON Schema only after a review of edge cases; do not call this shipped API):

```ts
type EvidenceRefV1 = {
  schemaVersion: "aep.evidence.v1";
  evidenceId: string;            // application-scoped opaque ID
  tenantId: string;              // server-derived scope
  sourceKind: "document" | "database_row" | "tool_result" | "derived";
  sourceId: string;
  revision: string;              // immutable source version or snapshot
  contentSha256: string;         // hash of normalized source/record representation
  locator?: { page?: number; rowId?: string; field?: string; start?: number; end?: number };
  collectedAt: string;          // ISO 8601 UTC
  classification: "public" | "internal" | "restricted";
};

type ClaimV1 = {
  schemaVersion: "aep.claim.v1";
  claimId: string;
  runId: string;
  kind: "factual" | "numeric" | "interpretive";
  text: string;
  evidenceIds: string[];
  derivation?: { operation: string; inputEvidenceIds: string[]; result: string; unit?: string };
};

type ClaimVerificationV1 = {
  schemaVersion: "aep.verification.v1";
  claimId: string;
  result: "verified_deterministic" | "cited_not_verified" | "needs_review" | "unsupported";
  reasons: string[];
  verifier: "rule" | "human" | "model_assisted";
  checkedAt: string;
};
```

**Invariants:**

- Each cited `evidenceId` resolves inside the authorized request scope **and** to an immutable source revision/hash. Database constraints and runtime guards should enforce this.
- References must be independently resolvable; a copied URL, a generated claim, or a model assertion alone is not evidence.
- A numeric claim labeled `verified_deterministic` needs an executable calculation receipt with validated inputs; never confer this status using the model's own judgment.
- A cited reference by itself proves *identity*, not *entailment*. Interpretive claims retain `cited_not_verified` or `needs_review` unless independently judged.
- Conflicts, missing evidence, authorization failure, and stale source versions must be surfaced explicitly.
- Access-controlled source text stays server-side. UI clients get only fields permitted by their session/role and classification.
- Source hashes identify changes but do not establish factual truth. Hash chains need independent verification and tamper protections.

## 2. User-visible events vs engineering traces

Distinguish three different artifacts:

| Artifact | Purpose | Persistence |
| --- | --- | --- |
| **Execution event** | Actual operation state for user interface | Sequence/replay or reconstructible snapshot |
| **Telemetry span** | Developer/debugger latency, retries, costs and errors | OTel-compatible backend, redacted |
| **Audit record** | Review and authorization decision history | Transactionally stored and integrity-checked |

A model's private chain-of-thought is none of these. Do not synthesize tool calls or expose hidden prompts/secrets in an effort to imitate ChatGPT/Claude.

Illustrative event envelope:

```ts
type RunEventV1 = {
  schemaVersion: "aep.event.v1";
  eventId: string;
  runId: string;
  traceId: string;
  sequence: number;       // strictly increasing per run
  occurredAt: string;     // UTC, not inferred on the browser
  actor: "system" | "model" | "tool" | "human" | "worker";
  visibility: "user" | "developer" | "auditor";
  kind:
    | "run.started" | "step.started" | "step.completed" | "step.failed"
    | "tool.started" | "tool.completed" | "tool.failed"
    | "approval.requested" | "approval.decided"
    | "evidence.checked" | "run.completed" | "run.failed";
  stepId?: string;
  parentStepId?: string;
  operation?: string;
  evidenceIds?: string[];
  summary: string;        // redacted, factual; never private model reasoning
  status: "started" | "completed" | "blocked" | "failed";
  durationMs?: number;    // only measured; omit otherwise
  errorCode?: string;     // bounded enum, no raw sensitive error
};
```

**Event production:** Generate event transitions in real code immediately before/after the operation. Persist ordering/identity before publishing, or make client resynchronization safe after interrupted delivery. A UI must tolerate duplicate, delayed and out-of-order events; use `eventId` deduplication and `sequence` validation. Report unfinished work as unfinished, not `completed`.

**Frontend pattern:** Render a short progress summary by default; expand verified steps, source references, bounded tool inputs/outputs and error classification. Developers can open correlated spans. Users can inspect permission/approval boundaries but should not receive secrets or restricted evidence.

AG-UI events may be adopted as an external transport format; do not falsely label this custom envelope as AG-UI compliant without a tested adapter.

## 3. Action and human-approval receipt

An external side effect should require a server-side authorization decision with: `tenantId`, authenticated `actorId`, `actionType`, `resourceId`, `normalizedArgumentsHash`, `idempotencyKey`, `approvalId` (when required), `expiresAt`, and `resultReceiptId` after completion.

Approval is not a chat message saying "yes". It must be linked to an exact proposed action and its arguments; a changed action requires renewed authorization. Rejections must not execute the tool. Concurrent approvals and retries must not duplicate side effects.

## 4. Schema evolution and verification

1. Specify Zod/JSON Schema with a checked-in schema version and canonical examples.
2. Export a language-neutral JSON fixtures pack for Python/TypeScript; keep all examples synthetic.
3. Test positive parse, missing fields, invalid state transitions, unknown versions, unauthorized evidence, replay ordering and redaction.
4. Maintain backward-compatible adapters or clearly reject incompatible major versions.
5. Document what was measured, what was inferred, and what remains unknown.
6. Trace metadata should align to pinned OpenTelemetry GenAI semantic convention versions; those conventions evolve.

## 5. Thin integration rather than framework lock-in

For the first pilot, add a small application adapter:

```text
existing application runtime
  -> EvidenceRef and Claim receipts
  -> verifier (local deterministic rules)
  -> RunEvent stream/snapshot
  -> existing UI component
```

No new model, vector database, cloud queue, or repository dependency is required to test this boundary. Extraction into a separately versioned package should happen only after two applications prove a common requirement.

## Acceptance demo

A reviewer triggers an authorized operation; the UI shows a real running status; a deterministic result includes source revision and derivation; a fabricated citation blocks finalization; a different tenant cannot fetch or approve the run; restarting/reconnecting does not invent or lose state; the developer can follow the trace ID to redacted operation spans. The demo clearly labels synthetic and live behavior.
