#!/usr/bin/env bun
/**
 * TICKET-00 — fail if public fixtures look like private PII.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = join(import.meta.dir, "..");
const FIXTURES = join(ROOT, "fixtures");

const PATTERNS: Array<{ name: string; re: RegExp }> = [
  { name: "email", re: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i },
  { name: "phone", re: /\b(?:\+1[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)\d{3}[-.\s]?\d{4}\b/ },
  { name: "ssn-like", re: /\b\d{3}-\d{2}-\d{4}\b/ },
];

function walk(dir: string, acc: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, acc);
    else acc.push(full);
  }
  return acc;
}

const hits: string[] = [];
for (const file of walk(FIXTURES)) {
  if (file.endsWith(".png") || file.endsWith(".webp") || file.endsWith(".jpg")) continue;
  const text = readFileSync(file, "utf8");
  for (const pattern of PATTERNS) {
    if (pattern.re.test(text)) {
      hits.push(`${relative(ROOT, file)}:${pattern.name}`);
    }
  }
}

if (hits.length) {
  console.error(`Fixture PII scan failed:\n${hits.map((h) => `  ${h}`).join("\n")}`);
  process.exit(1);
}

console.log("Fixture PII scan: ok.");
