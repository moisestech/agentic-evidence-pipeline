# AEP visual language

The Agentic Evidence Pipeline should look like an **evidence and decision control plane**, not a generic AI dashboard. The visual system exists to make provenance, uncertainty, control boundaries, and failures inspectable.

## Semantic roles

| Role | Token | Meaning | Default treatment |
| --- | --- | --- | --- |
| Evidence | `E` | Retrieved/versioned evidence | cyan when cited, neutral when only retrieved |
| Unsupported evidence | `!E` | Reference that cannot be resolved | coral + explicit blocked label |
| Model | `AI` | Probabilistic interpretation | blue-violet actor token |
| System | `SYS` | Deterministic policy/state transition | neutral actor token |
| Human | `H` | Reviewer judgment | teal actor token |
| Worker/job | `JOB` | Durable background execution | violet actor token |

Color must never carry status alone. Pair it with text, token, border, and state.

## Primary views

### 1. Evidence lineage

Always make this relationship visible:

`source revision → normalized evidence → retrieved evidence → cited evidence → assessment claim`

The operator should be able to distinguish **retrieved** from **actually cited** evidence immediately.

### 2. Citation gate

Treat the citation gate as a visible product boundary, not an implementation detail.

- clear: evidence IDs resolve and may proceed to review
- blocked: unresolved/unsupported evidence prevents approval/edit
- human comments cannot override the deterministic gate

### 3. Human review

The review UI should communicate **why a button is enabled or disabled**. Human-in-the-loop is not three colorful buttons; it is a state transition governed by evidence and policy.

### 4. Event timeline

Audit events should show actor, event type, time, and hash in a visual chronology. The visual goal is to answer: “Who or what changed state, and in what order?”

## Diagram rules

1. Deterministic functions and gates use hard-edged rectangles.
2. Model interpretation is visibly separated from deterministic validation.
3. Evidence objects use the `E` token consistently across UI and docs.
4. A blocked path ends visibly; do not draw a faint arrow implying execution continues.
5. Human review sits after validation and before finalization.
6. Background jobs, retries, and DLQ/replay use a separate execution lane.
7. Every architecture diagram should mark persisted state and durable boundaries.

## FDE concepts the visuals should teach

- hybrid retrieval / reciprocal-rank fusion
- provenance and source revisioning
- structured outputs / typed assessment contracts
- citation validation / fail-closed behavior
- human-in-the-loop / persisted interrupts
- idempotency / retry / dead-letter queues
- prompt versioning
- evals / golden sets / regression gates
- tenant boundaries
- traces / audit events / observability
- deterministic vs probabilistic responsibilities

## Next visual artifacts

1. **Evidence lineage inspector** — one run with source revision, retrieved set, cited subset, and unsupported reference.
2. **Invalid citation failure anatomy** — model emits bad ID → citation gate → blocked approval → audit event.
3. **Hybrid retrieval explainer** — lexical rank + vector rank → RRF fusion → final evidence set.
4. **Durable job lifecycle** — enqueue → attempt → retry → DLQ → replay, with idempotency key.
5. **Eval report visual** — citation precision, unsupported-reference rate, review rate, latency, cost.
6. **State machine + persistence boundary** — clearly show what survives process restart.
7. **Prompt lineage card** — prompt version/checksum + model + source revisions attached to a run.

Prefer diagrams generated from real types/state or screenshots of real runs. Decorative neural-network imagery should not appear unless it communicates a concrete implementation fact.
