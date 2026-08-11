# ADR 0004: Audit event hashing

## Status

Proposed

## Context

Review decisions need an append-only trail that can explain approve/edit/reject without trusting a single UI session.

## Decision

Each audit event stores `eventId`, `runId`, `traceId`, actor type, redacted payload, timestamp, previous-event hash, and event hash. Edits record before/after content hashes.

## Consequences

Reviewable history for interviews and operators. Hash chain is integrity evidence for the reference implementation, not a cryptographic compliance claim.
