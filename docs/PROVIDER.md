# Model provider (TICKET-00)

Verified 2026-09-27 against this repository.

## What model calls actually hit

The assessment graph uses `fakeAssessControl` (`aep-fake-model-v1`) in `@aep/agent`. Offline evals use the same deterministic fake provider (`bun run eval:offline`).

`bun run eval:live` is an opt-in gate only. It requires `AEP_LIVE_EVAL=1` and `OPENAI_API_KEY`, then exits: the live provider adapter is **not wired**.

There is no `MODEL_PROVIDER` switch and no Anthropic Messages client in the run path.

## Claims that are true

- Offline / CI assessments are produced by a deterministic fake provider.
- Human approval, citation fail-closed, and the audit trail do not depend on a live model.

## Claims that are not true

- "I deployed a system using Claude."
- Any live-model quality, latency, or cost number.

Cost stays `null` until a configured price table exists.
