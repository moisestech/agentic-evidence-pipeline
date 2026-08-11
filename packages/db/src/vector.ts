import type { AepPrismaClient } from "./client";

/**
 * Isolated SQL boundary for pgvector (ADR 0002).
 * Keep vector DDL/DML here — not in agent or retrieval business logic.
 */

export async function ensurePgvectorExtension(db: AepPrismaClient): Promise<void> {
  await db.$executeRawUnsafe("CREATE EXTENSION IF NOT EXISTS vector");
}

export async function upsertEvidenceEmbedding(
  db: AepPrismaClient,
  input: {
    evidenceId: string;
    tenantId: string;
    embedding: number[];
    embeddingModel: string;
  },
): Promise<void> {
  const vectorLiteral = `[${input.embedding.join(",")}]`;
  await db.$executeRawUnsafe(
    `
    UPDATE "EvidenceItem"
    SET embedding = $1::vector,
        "embeddingModel" = $2
    WHERE id = $3::uuid
      AND "tenantId" = $4::uuid
    `,
    vectorLiteral,
    input.embeddingModel,
    input.evidenceId,
    input.tenantId,
  );
}

/**
 * Returns evidence IDs nearest to the query vector within one tenant + visibility set.
 * Tenant filter is applied in SQL before results leave the database.
 */
export async function similarEvidenceIds(
  db: AepPrismaClient,
  input: {
    tenantId: string;
    visibility: readonly string[];
    embedding: number[];
    limit?: number;
  },
): Promise<string[]> {
  const limit = input.limit ?? 5;
  const vectorLiteral = `[${input.embedding.join(",")}]`;
  const rows = await db.$queryRawUnsafe<Array<{ id: string }>>(
    `
    SELECT id::text AS id
    FROM "EvidenceItem"
    WHERE "tenantId" = $1::uuid
      AND visibility = ANY($2::text[])
      AND embedding IS NOT NULL
    ORDER BY embedding <=> $3::vector
    LIMIT $4
    `,
    input.tenantId,
    [...input.visibility],
    vectorLiteral,
    limit,
  );
  return rows.map((row) => row.id);
}
