import { collectDemoFixturePack } from "@aep/connectors";
import type { AepPrismaClient } from "@aep/db";
import { ensurePgvectorExtension, upsertEvidenceEmbedding } from "@aep/db";
import { EMBEDDING_MODEL, embedTextOffline } from "./embed";

export type SeedResult = {
  tenantId: string;
  evidenceCount: number;
  sourceCount: number;
};

/**
 * Persist the AEP-03 demo fixture pack for one tenant and attach offline embeddings.
 */
export async function seedDemoEvidence(
  db: AepPrismaClient,
  input: { tenantSlug?: string; tenantName?: string } = {},
): Promise<SeedResult> {
  await ensurePgvectorExtension(db);

  const slug = input.tenantSlug ?? `demo-${Date.now()}`;
  const tenant = await db.tenant.create({
    data: {
      slug,
      name: input.tenantName ?? "Demo Tenant",
    },
  });

  const pack = collectDemoFixturePack({
    tenantId: tenant.id,
    retrievedAt: "2026-08-12T12:00:00.000Z",
  });

  let evidenceCount = 0;
  for (const item of pack) {
    await db.source.create({
      data: {
        id: item.source.id,
        tenantId: tenant.id,
        kind: item.source.kind,
        locator: item.source.locator,
        visibility: item.source.visibility,
        revision: item.source.revision,
        contentHash: item.source.contentHash,
        retrievedAt: new Date(item.source.retrievedAt),
        status: item.source.status,
        lastErrorCode: item.source.lastErrorCode,
      },
    });

    for (const ev of item.evidence) {
      await db.evidenceItem.create({
        data: {
          id: ev.id,
          sourceId: item.source.id,
          tenantId: tenant.id,
          text: ev.text,
          contentHash: ev.contentHash,
          visibility: ev.visibility,
          sourceRevision: ev.sourceRevision,
          createdAt: new Date(ev.createdAt),
          embeddingModel: EMBEDDING_MODEL,
        },
      });
      await upsertEvidenceEmbedding(db, {
        evidenceId: ev.id,
        tenantId: tenant.id,
        embedding: embedTextOffline(ev.text),
        embeddingModel: EMBEDDING_MODEL,
      });
      evidenceCount += 1;
    }
  }

  return {
    tenantId: tenant.id,
    evidenceCount,
    sourceCount: pack.length,
  };
}
