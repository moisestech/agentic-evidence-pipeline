# Ticket gates after TICKET-00

## Ready

- TICKET-01: Fabrication contracts + DCC org draft (`packages/contracts/src/fabrication.ts`).
- TICKET-02: STL / OBJ parser + constraint check (`packages/connectors/src/fabrication-parse.ts`). Unsupported types fail closed. Machine envelope is `needs_review` until specs are supplied.

## Blocked (fail-closed stubs exist)

- **TICKET-03** — Airtable upsert. `stageAirtableUpsert` refuses when base, table, or field map is empty. Waiting on those names. Claude review when unblocked.
- **TICKET-06-thin** — First real DCC job. `assertFirstJobConsent` throws without a written record. No derived eval case and no public case study before that.
- **TICKET-01 config complete** — Machine and material numbers are not inferred. Waiting on where those specs live today.

## Later, in order

04 (consent + provenance) → 05 OTel → 04b second provider → 07 metrics → **08 second org (essential; DCC volume is low)** → 09 WhatsApp → 10 case study.
