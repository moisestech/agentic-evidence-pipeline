import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { type AepPrismaClient, createPrismaClient } from "../src/client";
import { listEvidenceForTenant } from "../src/tenant";
import { ensurePgvectorExtension } from "../src/vector";

const databaseUrl = process.env.DATABASE_URL;
const runIntegration = Boolean(databaseUrl) && process.env.AEP_INTEGRATION === "1";
const describeDb = runIntegration ? describe : describe.skip;

describeDb("tenant isolation (integration)", () => {
  let db: AepPrismaClient;
  let tenantA: string;
  let tenantB: string;

  beforeAll(async () => {
    db = createPrismaClient(databaseUrl);
    await ensurePgvectorExtension(db);

    const a = await db.tenant.create({
      data: { slug: `tenant-a-${Date.now()}`, name: "Tenant A" },
    });
    const b = await db.tenant.create({
      data: { slug: `tenant-b-${Date.now()}`, name: "Tenant B" },
    });
    tenantA = a.id;
    tenantB = b.id;

    const sourceA = await db.source.create({
      data: {
        tenantId: tenantA,
        kind: "csv",
        locator: "fixtures://a.csv",
        visibility: "public",
        revision: "1",
        contentHash: "hash-a",
        retrievedAt: new Date(),
        status: "ready",
      },
    });
    const sourceB = await db.source.create({
      data: {
        tenantId: tenantB,
        kind: "csv",
        locator: "fixtures://b.csv",
        visibility: "public",
        revision: "1",
        contentHash: "hash-b",
        retrievedAt: new Date(),
        status: "ready",
      },
    });

    await db.evidenceItem.create({
      data: {
        tenantId: tenantA,
        sourceId: sourceA.id,
        text: "Tenant A public evidence",
        contentHash: "ev-a",
        visibility: "public",
        sourceRevision: "1",
      },
    });
    await db.evidenceItem.create({
      data: {
        tenantId: tenantB,
        sourceId: sourceB.id,
        text: "Tenant B secret evidence",
        contentHash: "ev-b",
        visibility: "public",
        sourceRevision: "1",
      },
    });
  });

  afterAll(async () => {
    await db.tenant.deleteMany({
      where: { id: { in: [tenantA, tenantB] } },
    });
    await db.$disconnect();
  });

  test("listEvidenceForTenant never returns another tenant's rows", async () => {
    const rows = await listEvidenceForTenant(db, tenantA, ["public", "staff"]);
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((row) => row.tenantId === tenantA)).toBe(true);
    expect(rows.some((row) => row.tenantId === tenantB)).toBe(false);
    expect(rows.some((row) => row.text.includes("Tenant B"))).toBe(false);
  });
});
