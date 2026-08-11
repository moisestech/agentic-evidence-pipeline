# ADR 0002: Vector SQL boundary

## Status

Accepted (AEP-02)

## Context

Prisma does not cover every pgvector operation equally well. Hybrid retrieval needs FTS + vector fusion with tenant/visibility filters.

## Decision

- Prisma owns relational models and migrations for supported tables, including an `Unsupported("vector")` embedding column on `EvidenceItem`.
- Vector similarity queries and extension setup live in `packages/db/src/vector.ts`.
- Lexical and vector paths must share the same visibility filters before fusion (AEP-04).

## Consequences

Slightly more SQL surface, but retrieval behavior stays inspectable and testable without leaking raw SQL into the agent package.
