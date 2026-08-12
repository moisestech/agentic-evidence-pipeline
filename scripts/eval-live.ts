#!/usr/bin/env bun
/**
 * Opt-in live eval. Requires explicit credentials and AEP_LIVE_EVAL=1.
 * Never treat live output as the committed offline harness report.
 */
const enabled = process.env.AEP_LIVE_EVAL === "1";
const key = process.env.OPENAI_API_KEY;

if (!enabled || !key) {
  console.error(
    "eval:live: refused. Set AEP_LIVE_EVAL=1 and OPENAI_API_KEY to run the opt-in live harness.",
  );
  console.error(
    "Offline harness (no credentials): bun run eval:offline — reports/offline/*-fake-provider.json",
  );
  process.exit(1);
}

console.error(
  "eval:live: provider adapter not wired yet beyond the gate. Use bun run eval:offline for committed harness metrics.",
);
process.exit(2);
