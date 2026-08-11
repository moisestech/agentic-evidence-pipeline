# ADR 0003: Idempotency keys

## Status

Proposed

## Context

Duplicate triggers and retries must not create duplicate assessment runs or review queues.

## Decision

Derive a stable idempotency key from tenant, rubric version, source revisions, and requested operation. Persist the key with the run; duplicate submissions reuse the existing run.

## Consequences

Safe demo/replay. Requires careful revision hashing when sources update.
