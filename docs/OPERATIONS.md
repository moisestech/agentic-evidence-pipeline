# Operations

## Planned commands

```bash
bun run bootstrap
bun run doctor
bun run demo
bun run verify
bun run eval:offline
bun run eval:live   # explicit opt-in; never required for CI
```

## Local dependencies (planned)

- Bun (pinned via `packageManager`)
- Docker Compose for PostgreSQL + pgvector
- No paid API for offline demo / CI

## Operator checklist (v0.1 target)

1. Fresh clone installs with frozen lockfile.
2. `doctor` exits nonzero with actionable messages on missing deps.
3. `demo` completes one review flow with the fake provider.
4. Duplicate demo trigger does not create a second run.
5. Run inspector shows stage, retries, cost/latency placeholders, and failure class.

## Rollback

Until durable jobs and migrations ship, there is nothing to roll back beyond deleting the local Docker volume. Document migration rollback when Prisma migrations land.
