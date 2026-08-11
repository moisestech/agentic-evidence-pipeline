# ADR 0005: Private-data redaction

## Status

Proposed

## Context

Logs, screenshots, and fixtures must never become a second leak surface.

## Decision

- Fixtures are public or synthetic only.
- Structured logs omit source text dumps, emails, phones, tokens, and secret URLs by default.
- Telemetry records token/cost/latency and failure class, not raw prompts, unless an explicit local debug flag is set and never committed.

## Consequences

Slightly less convenient debugging; much safer public repo and demo artifacts.
