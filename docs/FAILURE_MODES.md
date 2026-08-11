# Failure modes

Target failure taxonomy for `v0.1`. Behavior is specified here before fixtures exist.

| Failure | Classification | Expected behavior |
| --- | --- | --- |
| Provider timeout / 429 | Transient | Capped retry with jitter; preserve `runId` / `traceId` |
| Malformed provider JSON | Non-retryable after bounded repair | Reviewable error record |
| Unsupported citation | Policy failure | Block finalization; surface unsupported claim |
| Prompt injection in source | Policy / grounding | Citation and schema rules still apply; no instruction override |
| Cross-tenant citation | Authorization | Fail closed before prompt construction |
| Duplicate trigger | Idempotent | Reuse existing run |
| Worker restart mid-review | Recoverable | Resume persisted interrupt |
| Database interruption | Transient / fatal by stage | Explicit failure class; safe replay when eligible |

See also [SECURITY.md](./SECURITY.md) and [OPERATIONS.md](./OPERATIONS.md).
