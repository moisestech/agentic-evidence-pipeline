# ADR 0002: Vector SQL boundary

## Status

Proposed

## Context

Prisma does not cover every pgvector operation equally well. Hybrid retrieval needs FTS + vector fusion with tenant/visibility filters.

## Decision

- Prisma owns relational models and migrations for supported tables.
- Vector similarity queries live behind an isolated, documented SQL module in `packages/db`.
- Lexical and vector paths share the same visibility filters before fusion.

## Consequences

Slightly more SQL surface, but retrieval behavior stays inspectable and testable without leaking raw SQL into the agent package.
