# ADR 0001: Orchestration boundary

## Status

Proposed

## Context

Assessment runs need durable retries and a genuine human-review interrupt. Mixing both concerns in one process obscures failure ownership.

## Decision

- **LangGraph JS** owns the assessment state graph, interrupt/resume, and typed node transitions.
- **Trigger.dev** owns job scheduling, retry budgets, and idempotent triggers into the graph.
- The web/API issue commands; they do not embed provider calls outside the graph.

## Consequences

Clear restart semantics and test surfaces. Requires careful shared contracts for run IDs and interrupt payloads.
