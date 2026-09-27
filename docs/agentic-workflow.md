# Agentic Workflow Log

How I build with coding agents, one ticket at a time. Every entry is written at the
time of the work. Entries are never backfilled or reconstructed.

This file lives at `docs/agentic-workflow.md` in agentic-evidence-pipeline.
moises.tech parses it at build time — keep the format exact.

## Format (copy for each ticket)

```
### TICKET-XX — <title>
- Date: YYYY-MM-DD
- Implementer: <tool> / <model>
- Reviewer: <tool or person>
- First-pass result: PASS | FAIL
- What went wrong: <one sentence, or "nothing">
- How it was caught: <test | eval | CI | review | me>
- What I changed: <rule, prompt, test, or process change — one sentence>
- Time: <hours, approximate>
```

## Entries

### TICKET-02 — STL and OBJ parser
- Date: 2026-09-27
- Implementer: Cursor / Claude
- Reviewer: me
- First-pass result: PASS
- What went wrong: nothing
- How it was caught: test
- What I changed: Added fail-closed STL/OBJ parse plus envelope check that waits when machines are not configured.
- Time: 1 hour

### TICKET-01 — Fabrication contracts and DCC org draft
- Date: 2026-09-27
- Implementer: Cursor / Claude
- Reviewer: me
- First-pass result: PASS
- What went wrong: nothing
- How it was caught: test
- What I changed: Added typed intake, OrgConfig, and a DCC draft that names formats only — no inferred machine specs or pricing.
- Time: 1 hour

### TICKET-00 — Public-release safety gate
- Date: 2026-09-27
- Implementer: Cursor / Claude
- Reviewer: ChatGPT
- First-pass result: PASS
- What went wrong: nothing
- How it was caught: review
- What I changed: Recorded that live model calls are not wired — the graph uses the fake provider; added env placeholders, fixture PII scan, and this log.
- Time: 2 hours
