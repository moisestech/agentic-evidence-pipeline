# ADR 0006: Trigger.dev durable jobs

## Status

Accepted (AEP-08)

## Context

Assessment work must survive retries and duplicate triggers without paid cloud dependencies in CI.

## Decision

1. Persist durable jobs in Postgres (`DurableJob`) with tenant-scoped idempotency keys.
2. `@aep/jobs` `DurableRunner` implements enqueue → retry → dead-letter → replay offline (used by `bun run verify`).
3. Optional Trigger.dev task `assess-control` wraps the same handler + store when `TRIGGER_SECRET_KEY` is configured for deploy.

## Consequences

Duplicate and failure-injection tests run without Trigger cloud. Interview claim: Trigger.dev is the deploy adapter; idempotency/DLQ/replay semantics are product invariants tested offline.
