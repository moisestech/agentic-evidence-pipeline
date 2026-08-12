import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { type AepPrismaClient, createPrismaClient } from "@aep/db";
import { retrieve, seedDemoEvidence } from "../src/index";

const databaseUrl = process.env.DATABASE_URL;
const runIntegration = Boolean(databaseUrl) && process.env.AEP_INTEGRATION === "1";
const describeDb = runIntegration ? describe : describe.skip;

describeDb("hybrid retrieval (integration)", () => {
  let db: AepPrismaClient;
  let tenantId: string;
  let otherTenantId: string;

  beforeAll(async () => {
    db = createPrismaClient(databaseUrl);
    const seeded = await seedDemoEvidence(db, {
      tenantSlug: `retrieve-a-${Date.now()}`,
      tenantName: "Retrieve A",
    });
    tenantId = seeded.tenantId;

    const other = await seedDemoEvidence(db, {
      tenantSlug: `retrieve-b-${Date.now()}`,
      tenantName: "Retrieve B",
    });
    otherTenantId = other.tenantId;

    // Mark one row excluded on tenant A for visibility filtering
    const any = await db.evidenceItem.findFirst({ where: { tenantId } });
    if (any) {
      await db.evidenceItem.update({
        where: { id: any.id },
        data: { visibility: "excluded" },
      });
    }
  });

  afterAll(async () => {
    await db.tenant.deleteMany({
      where: { id: { in: [tenantId, otherTenantId] } },
    });
    await db.$disconnect();
  });

  test("hybrid ranking returns typed hits with fused scores", async () => {
    const hits = await retrieve(db, {
      tenantId,
      query: "HTTPS accessibility digital readiness inventory",
      mode: "hybrid",
      limit: 5,
      visibility: ["public", "staff"],
    });
    expect(hits.length).toBeGreaterThan(0);
    expect(hits[0]?.rank).toBe(1);
    expect(hits[0]?.evidenceId).toMatch(/^[0-9a-f-]{36}$/i);
    expect(hits[0]?.fusedScore).toBeGreaterThan(0);
    expect(hits.every((h) => h.tenantId === tenantId)).toBe(true);
  });

  test("cross-tenant exclusion", async () => {
    const hits = await retrieve(db, {
      tenantId,
      query: "HTTPS website inventory",
      mode: "hybrid",
      visibility: ["public", "staff"],
    });
    expect(hits.every((h) => h.tenantId !== otherTenantId)).toBe(true);
  });

  test("excluded visibility filtering", async () => {
    const hits = await retrieve(db, {
      tenantId,
      query: "HTTPS accessibility inventory readiness",
      mode: "hybrid",
      visibility: ["public", "staff"],
    });
    expect(hits.every((h) => h.visibility !== "excluded")).toBe(true);
  });

  test("stable tie ordering by evidenceId", async () => {
    const a = await retrieve(db, {
      tenantId,
      query: "digital readiness",
      mode: "lexical",
      limit: 10,
    });
    const b = await retrieve(db, {
      tenantId,
      query: "digital readiness",
      mode: "lexical",
      limit: 10,
    });
    expect(a.map((h) => h.evidenceId)).toEqual(b.map((h) => h.evidenceId));
  });

  test("lexical-only degradation when vectors unavailable", async () => {
    // Clear embeddings for tenant A
    await db.$executeRawUnsafe(
      `UPDATE "EvidenceItem" SET embedding = NULL WHERE "tenantId" = $1::uuid`,
      tenantId,
    );
    const hits = await retrieve(db, {
      tenantId,
      query: "HTTPS digital readiness",
      mode: "hybrid",
      visibility: ["public", "staff"],
    });
    expect(hits.length).toBeGreaterThan(0);
    expect(hits.every((h) => h.reason.includes("lexical"))).toBe(true);
  });
});
