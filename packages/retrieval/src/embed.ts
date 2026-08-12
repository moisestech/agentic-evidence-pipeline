import { createHash } from "node:crypto";
import { EMBEDDING_DIMS } from "./types";

/**
 * Deterministic offline embedding for fixtures/tests.
 * No network, no provider keys — hash tokens into a fixed-dimension unit vector.
 */
export function embedTextOffline(text: string, dims = EMBEDDING_DIMS): number[] {
  const tokens = text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);

  const vec = new Array<number>(dims).fill(0);
  if (tokens.length === 0) {
    vec[0] = 1;
    return vec;
  }

  for (const token of tokens) {
    const digest = createHash("sha256").update(token).digest();
    for (let i = 0; i < dims; i++) {
      const byte = digest[i % digest.length] ?? 0;
      vec[i] = (vec[i] ?? 0) + (byte / 255) * 2 - 1;
    }
  }

  let norm = 0;
  for (const v of vec) norm += v * v;
  norm = Math.sqrt(norm) || 1;
  return vec.map((v) => v / norm);
}

export const EMBEDDING_MODEL = "aep-offline-hash-v1";
