import type { AepPrismaClient } from "@aep/db";
import { type RetrievalHit, RRF_K } from "./types";

type Ranked = {
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

export function reciprocalRankFusion(
  lexical: Ranked[],
  vector: Ranked[],
  limit: number,
): RetrievalHit[] {
  const byId = new Map<string, Ranked>();

  for (const hit of lexical) {
    byId.set(hit.evidenceId, { ...hit });
  }
  for (const hit of vector) {
    const existing = byId.get(hit.evidenceId);
    if (existing) {
      existing.vectorScore = hit.vectorScore;
      existing.vectorRank = hit.vectorRank;
    } else {
      byId.set(hit.evidenceId, { ...hit });
    }
  }

  const fused = [...byId.values()].map((hit) => {
    let fusedScore = 0;
    const reasons: string[] = [];
    if (hit.lexicalRank != null) {
      fusedScore += 1 / (RRF_K + hit.lexicalRank);
      reasons.push(`lexical_rank=${hit.lexicalRank}`);
    }
    if (hit.vectorRank != null) {
      fusedScore += 1 / (RRF_K + hit.vectorRank);
      reasons.push(`vector_rank=${hit.vectorRank}`);
    }
    return {
      evidenceId: hit.evidenceId,
      sourceRevision: hit.sourceRevision,
      tenantId: hit.tenantId,
      visibility: hit.visibility,
      text: hit.text,
      lexicalScore: hit.lexicalScore,
      vectorScore: hit.vectorScore,
      fusedScore,
      reason: reasons.join("+") || "unranked",
    };
  });

  fused.sort((a, b) => {
    if (b.fusedScore !== a.fusedScore) return b.fusedScore - a.fusedScore;
    return a.evidenceId.localeCompare(b.evidenceId);
  });

  return fused.slice(0, limit).map((hit, index) => ({
    ...hit,
    rank: index + 1,
  }));
}

export async function lexicalSearch(
  db: AepPrismaClient,
  input: {
    tenantId: string;
    query: string;
    visibility: readonly string[];
    limit: number;
  },
): Promise<Ranked[]> {
  const rows = await db.$queryRawUnsafe<
    Array<{
      id: string;
      sourceRevision: string;
      tenantId: string;
      visibility: string;
      text: string;
      score: number;
    }>
  >(
    `
    SELECT
      id::text AS id,
      "sourceRevision",
      "tenantId"::text AS "tenantId",
      visibility,
      text,
      ts_rank(
        to_tsvector('english', text),
        plainto_tsquery('english', $3)
      )::float AS score
    FROM "EvidenceItem"
    WHERE "tenantId" = $1::uuid
      AND visibility = ANY($2::text[])
      AND to_tsvector('english', text) @@ plainto_tsquery('english', $3)
    ORDER BY score DESC, id ASC
    LIMIT $4
    `,
    input.tenantId,
    [...input.visibility],
    input.query,
    input.limit,
  );

  return rows.map((row, index) => ({
    evidenceId: row.id,
    sourceRevision: row.sourceRevision,
    tenantId: row.tenantId,
    visibility: row.visibility,
    text: row.text,
    lexicalScore: row.score,
    vectorScore: null,
    lexicalRank: index + 1,
    vectorRank: null,
  }));
}

export async function vectorSearch(
  db: AepPrismaClient,
  input: {
    tenantId: string;
    embedding: number[];
    visibility: readonly string[];
    limit: number;
  },
): Promise<Ranked[]> {
  const vectorLiteral = `[${input.embedding.join(",")}]`;
  const rows = await db.$queryRawUnsafe<
    Array<{
      id: string;
      sourceRevision: string;
      tenantId: string;
      visibility: string;
      text: string;
      distance: number;
    }>
  >(
    `
    SELECT
      id::text AS id,
      "sourceRevision",
      "tenantId"::text AS "tenantId",
      visibility,
      text,
      (embedding <=> $3::vector)::float AS distance
    FROM "EvidenceItem"
    WHERE "tenantId" = $1::uuid
      AND visibility = ANY($2::text[])
      AND embedding IS NOT NULL
    ORDER BY embedding <=> $3::vector, id ASC
    LIMIT $4
    `,
    input.tenantId,
    [...input.visibility],
    vectorLiteral,
    input.limit,
  );

  return rows.map((row, index) => ({
    evidenceId: row.id,
    sourceRevision: row.sourceRevision,
    tenantId: row.tenantId,
    visibility: row.visibility,
    text: row.text,
    lexicalScore: null,
    vectorScore: 1 / (1 + row.distance),
    lexicalRank: null,
    vectorRank: index + 1,
  }));
}
