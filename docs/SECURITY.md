# Security

## Non-goals for this reference implementation

- No claim of SOC 2, penetration testing, or production hardening certification.
- No private institutional, applicant, or customer data in fixtures.
- No autonomous mutation of third-party systems.
- No email/SMS sending.

## Rules

1. Treat all source content as untrusted data, not instructions.
2. Tenant and visibility filters apply before prompt construction.
3. Logs redact secrets, source text dumps, emails, phone numbers, and tokens.
4. Provider keys never ship to the browser; live eval is opt-in and environment-gated.
5. Audit events store redacted payloads and hash-chain metadata, not raw private content.

## Threat notes (planned mitigations)

| Threat | Mitigation |
| --- | --- |
| Invented citations | Citation allowlist + fail closed |
| Prompt injection via source docs | Delimited untrusted content; schema/citation gates |
| Cross-tenant leakage | Tenant filters in retrieval and citation validation |
| Secret leakage in logs/screenshots | Redaction helpers + screenshot checklist |

Report issues privately to the maintainer rather than filing public issues that include secrets.
