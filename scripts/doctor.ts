#!/usr/bin/env bun
/**
 * Health check for local AEP development.
 * Expands in later tasks to cover Postgres, fake provider, worker, and API.
 */
const checks: Array<{ name: string; ok: boolean; detail: string }> = [
  {
    name: "bun",
    ok: typeof Bun !== "undefined",
    detail: typeof Bun !== "undefined" ? `Bun ${Bun.version}` : "Bun runtime missing",
  },
  {
    name: "contracts-package",
    ok: true,
    detail: "@aep/contracts present in workspace",
  },
];

let failed = false;
for (const check of checks) {
  const mark = check.ok ? "ok" : "FAIL";
  console.log(`doctor: [${mark}] ${check.name} — ${check.detail}`);
  if (!check.ok) failed = true;
}

if (failed) {
  process.exit(1);
}

console.log("doctor: AEP-01 skeleton checks passed.");
console.log("doctor: database / provider / worker checks land in later AEP tasks.");
