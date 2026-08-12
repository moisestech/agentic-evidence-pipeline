# ADR 0003: Idempotency keys

## Status

Accepted (AEP-08)

## Context

Duplicate triggers and retries must not create duplicate assessment runs or review queues.

## Decision

Derive a stable idempotency key from tenant, rubric version, source revisions, and requested operation. Persist the key with the run **and** with `DurableJob` (`tenantId` + job name + key). Duplicate submissions reuse the existing run/job.

## Consequences

Safe demo/replay. Requires careful revision hashing when sources update. Offline `DurableRunner` tests cover duplicate enqueue without Trigger cloud.
