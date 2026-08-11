#!/usr/bin/env bun
/**
 * Validates local toolchain for AEP development.
 * Does not require provider credentials or a running database yet.
 */
import { existsSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dir, "..");
const required = ["package.json", "bun.lock", "turbo.json", "packages/contracts/package.json"];

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

console.log("bootstrap: workspace skeleton is ready (AEP-01).");
console.log("Next: bun install && bun run verify");
