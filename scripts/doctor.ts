#!/usr/bin/env bun
/**
 * Health check for local AEP development.
 */
import { existsSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dir, "..");

const checks: Array<{ name: string; ok: boolean; detail: string }> = [
  {
    name: "bun",
    ok: typeof Bun !== "undefined",
    detail: typeof Bun !== "undefined" ? `Bun ${Bun.version}` : "Bun runtime missing",
  },
  {
    name: "contracts-package",
    ok: existsSync(join(root, "packages/contracts/package.json")),
    detail: "@aep/contracts present in workspace",
  },
  {
    name: "prisma-schema",
    ok: existsSync(join(root, "packages/db/prisma/schema.prisma")),
    detail: "packages/db/prisma/schema.prisma",
  },
  {
    name: "docker-compose",
    ok: existsSync(join(root, "docker-compose.yml")),
    detail: "docker-compose.yml for local Postgres/pgvector",
  },
  {
    name: "database-url",
    ok: true,
    detail: process.env.DATABASE_URL
      ? "DATABASE_URL set (integration tests enabled)"
      : "DATABASE_URL unset (unit tests only; run db:up for integration)",
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

console.log("doctor: AEP-02 checks passed.");
console.log("doctor: provider / worker / API readiness land in later AEP tasks.");
