# ADR 0001: Orchestration boundary

## Status

Accepted (AEP-05)

## Context

Assessment runs need durable retries and a genuine human-review interrupt.

## Decision

For v0.1, `@aep/agent` implements an **explicit persisted state machine** with the same interrupt/resume semantics as a LangGraph human-in-the-loop graph:

- States match `docs/ARCHITECTURE.md`.
- Invalid transitions throw typed domain errors.
- Pending `needs_review` survives process restart via Postgres (`AssessmentRun` + `ControlAssessment` + `AuditEvent`).
- Idempotency keys prevent duplicate runs.

LangGraph JS remains a compatible future swap behind the same run/resume/decide API. Trigger.dev durable triggers land in AEP-08.

## Consequences

Faster path to a memorable citation-failure demo with full testability offline. Interview narrative: interrupt/resume and fail-closed citations are product invariants; the orchestrator library is replaceable.
