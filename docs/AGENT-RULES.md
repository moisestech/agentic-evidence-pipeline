# Agent rules

Hard constraints for coding agents in this repository.

- Do not commit secrets, `.env` files, or client PII.
- Do not invent DCC job counts, time saved, or cost.
- Do not claim a live Claude or OpenAI deploy until `MODEL_PROVIDER` is wired and verified.
- v1 fabrication parsers accept STL and OBJ only. Other types fail closed.
- Machine and material numbers come from `OrgConfig` only. Never infer them.
- Airtable writes stay staged until TICKET-03 fields are named and a human approves.
- A real DCC job (TICKET-06-thin) requires one-line written client consent.
- Do not rewrite git history. Do not write client-facing copy without review.
