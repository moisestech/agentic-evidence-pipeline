import { randomUUID } from "node:crypto";

/** Deterministic-looking UUID helper for fixtures (random per call). */
export function fixtureId(): string {
  return randomUUID();
}

/** Fixed clock for tests that need stable timestamps. */
export function createFrozenClock(iso = "2026-08-11T12:00:00.000Z"): () => Date {
  const frozen = new Date(iso);
  return () => frozen;
}

export const PACKAGE_STATUS = "testkit-v0.0.1" as const;
