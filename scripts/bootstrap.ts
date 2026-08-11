#!/usr/bin/env bun
/**
 * Validates local toolchain for AEP development.
 * Does not require provider credentials. Database is optional for AEP-01 unit gates.
 */
import { existsSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dir, "..");
const required = [
  "package.json",
  "bun.lock",
  "turbo.json",
  "packages/contracts/package.json",
  "packages/db/prisma/schema.prisma",
  "docker-compose.yml",
];

let failed = false;
for (const rel of required) {
  const path = join(root, rel);
  if (!existsSync(path)) {
    console.error(`bootstrap: missing ${rel}`);
    failed = true;
  } else {
    console.log(`bootstrap: ok ${rel}`);
  }
}

if (failed) {
  process.exit(1);
}

console.log("bootstrap: workspace + db schema are ready.");
console.log("Optional: bun run db:up && cp .env.example .env && bun run db:migrate");
console.log("Then: bun install && bun run verify");
