import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { type AepPrismaClient, createPrismaClient } from "@aep/db";
import { seedDemoEvidence } from "@aep/retrieval";
import { decideReview, resumeRun, runAssessment } from "../src/index";

const databaseUrl = process.env.DATABASE_URL;
const runIntegration = Boolean(databaseUrl) && process.env.AEP_INTEGRATION === "1";
const describeDb = runIntegration ? describe : describe.skip;

describeDb("persisted assessment interrupt/resume (integration)", () => {
  let db: AepPrismaClient;
  let tenantId: string;

  beforeAll(async () => {
    db = createPrismaClient(databaseUrl);
    const seeded = await seedDemoEvidence(db, {
      tenantSlug: `agent-${Date.now()}`,
      tenantName: "Agent Tenant",
    });
    tenantId = seeded.tenantId;
  });

  afterAll(async () => {
    await db.tenant.deleteMany({ where: { id: tenantId } });
    await db.$disconnect();
  });

  test("fabricated citation lands in needs_review and survives resume", async () => {
    const key = `idem-${Date.now()}`;
    const first = await runAssessment(db, {
      tenantId,
      idempotencyKey: key,
      fabricateInvalidCitation: true,
    });
    expect(first.status).toBe("needs_review");
    expect(first.unsupportedClaims.length).toBeGreaterThan(0);

    const resumed = await resumeRun(db, first.runId);
    expect(resumed.status).toBe("needs_review");
    expect(resumed.runId).toBe(first.runId);
    expect(resumed.unsupportedClaims).toEqual(first.unsupportedClaims);

    const dup = await runAssessment(db, {
      tenantId,
      idempotencyKey: key,
      fabricateInvalidCitation: true,
    });
    expect(dup.runId).toBe(first.runId);

    const decided = await decideReview(db, {
      runId: first.runId,
      tenantId,
      decision: "approve",
      reviewerId: "reviewer-1",
      comment: "Accepted after checking sources",
    });
    expect(decided.status).toBe("finalized");
  });
});
