import { embedTextOffline, RRF_K, reciprocalRankFusion } from "@aep/retrieval";
import type { EvalCorpusItem } from "./types";

export type OfflineHit = {
  evidenceId: string;
  sourceRevision: string;
  tenantId: string;
  visibility: string;
  text: string;
  lexicalScore: number | null;
  vectorScore: number | null;
  lexicalRank: number | null;
  vectorRank: number | null;
};

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 1);
}

function lexicalScore(query: string, text: string): number {
  const q = new Set(tokenize(query));
  if (q.size === 0) return 0;
  const tokens = tokenize(text);
  let hits = 0;
  for (const t of tokens) {
    if (q.has(t)) hits += 1;
  }
  return hits / q.size;
}

function cosine(a: number[], b: number[]): number {
  let dot = 0;
  for (let i = 0; i < a.length; i += 1) {
    dot += (a[i] ?? 0) * (b[i] ?? 0);
  }
  return dot;
}

/**
 * In-memory lexical / vector / hybrid retrieval for offline evals (no Postgres).
 * Uses the same RRF helper as production retrieval.
 */
export function retrieveOffline(
  corpus: readonly EvalCorpusItem[],
  query: string,
  mode: "lexical" | "vector" | "hybrid",
  limit = 5,
): Array<{ evidenceId: string; rank: number; fusedScore: number }> {
  const visible = corpus.filter((c) => c.visibility === "public" || c.visibility === "staff");
  const qVec = embedTextOffline(query);

  const lexicalRanked: OfflineHit[] = visible
    .map((item) => ({
      evidenceId: item.evidenceId,
      sourceRevision: item.sourceRevision,
      tenantId: "eval",
      visibility: item.visibility,
      text: item.text,
      lexicalScore: lexicalScore(query, item.text),
      vectorScore: null,
      lexicalRank: null as number | null,
      vectorRank: null as number | null,
    }))
    .filter((h) => (h.lexicalScore ?? 0) > 0)
    .sort(
      (a, b) =>
        (b.lexicalScore ?? 0) - (a.lexicalScore ?? 0) || a.evidenceId.localeCompare(b.evidenceId),
    )
    .map((h, i) => ({ ...h, lexicalRank: i + 1 }));

  const vectorRanked: OfflineHit[] = visible
    .map((item) => ({
      evidenceId: item.evidenceId,
      sourceRevision: item.sourceRevision,
      tenantId: "eval",
      visibility: item.visibility,
      text: item.text,
      lexicalScore: null,
      vectorScore: cosine(qVec, embedTextOffline(item.text)),
      lexicalRank: null as number | null,
      vectorRank: null as number | null,
    }))
    .sort(
      (a, b) =>
        (b.vectorScore ?? 0) - (a.vectorScore ?? 0) || a.evidenceId.localeCompare(b.evidenceId),
    )
    .map((h, i) => ({ ...h, vectorRank: i + 1 }));

  if (mode === "lexical") {
    return lexicalRanked.slice(0, limit).map((h, i) => ({
      evidenceId: h.evidenceId,
      rank: i + 1,
      fusedScore: 1 / (RRF_K + (h.lexicalRank ?? 999)),
    }));
  }
  if (mode === "vector") {
    return vectorRanked.slice(0, limit).map((h, i) => ({
      evidenceId: h.evidenceId,
      rank: i + 1,
      fusedScore: 1 / (RRF_K + (h.vectorRank ?? 999)),
    }));
  }

  const fused = reciprocalRankFusion(lexicalRanked, vectorRanked, limit);
  return fused.map((h) => ({
    evidenceId: h.evidenceId,
    rank: h.rank,
    fusedScore: h.fusedScore,
  }));
}

export function recallAtK(
  hitIds: readonly string[],
  relevant: readonly string[],
  k: number,
): number {
  if (relevant.length === 0) return 1;
  const top = new Set(hitIds.slice(0, k));
  let found = 0;
  for (const id of relevant) {
    if (top.has(id)) found += 1;
  }
  return found / relevant.length;
}

export function reciprocalRank(hitIds: readonly string[], relevant: readonly string[]): number {
  if (relevant.length === 0) return 1;
  const relevantSet = new Set(relevant);
  for (let i = 0; i < hitIds.length; i += 1) {
    const id = hitIds[i];
    if (id && relevantSet.has(id)) return 1 / (i + 1);
  }
  return 0;
}

export function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
  return sorted[idx] ?? 0;
}
