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

    const eventsBefore = await db.auditEvent.count({ where: { runId: first.runId } });
    for (const decision of ["approve", "edit"] as const) {
      await expect(
        decideReview(db, {
          runId: first.runId,
          tenantId,
          decision,
          reviewerId: "reviewer-1",
          editedSummary: "A text edit does not resolve a fabricated evidence reference.",
        }),
      ).rejects.toThrow("unresolved_evidence");
    }
    expect(await resumeRun(db, first.runId)).toEqual(resumed);
    expect(await db.reviewDecision.count({ where: { runId: first.runId } })).toBe(0);
    expect(await db.auditEvent.count({ where: { runId: first.runId } })).toBe(eventsBefore);

    const decided = await decideReview(db, {
      runId: first.runId,
      tenantId,
      decision: "reject",
      reviewerId: "reviewer-1",
      comment: "Rejected because the citation is unsupported",
    });
    expect(decided.status).toBe("finalized");
    expect(decided.unsupportedClaims).toEqual(first.unsupportedClaims);
    expect(await db.reviewDecision.findFirst({ where: { runId: first.runId } })).toMatchObject({
      decision: "reject",
      tenantId,
    });
  });

  test("valid assessment supports approve and edit", async () => {
    for (const decision of ["approve", "edit"] as const) {
      const run = await runAssessment(db, {
        tenantId,
        idempotencyKey: `valid-${decision}-${Date.now()}`,
        fabricateInvalidCitation: false,
      });
      const result = await decideReview(db, {
        runId: run.runId,
        tenantId,
        decision,
        reviewerId: "reviewer-1",
        editedSummary: "Reviewer-authored summary after checking the evidence.",
      });
      expect(result.status).toBe("finalized");
      if (decision === "edit") {
        expect(result.assessment?.summary).toBe(
          "Reviewer-authored summary after checking the evidence.",
        );
      }
    }
  });

  test("wrong tenant cannot mutate a review", async () => {
    const run = await runAssessment(db, {
      tenantId,
      idempotencyKey: `tenant-${Date.now()}`,
      fabricateInvalidCitation: false,
    });
    const before = await resumeRun(db, run.runId);
    await expect(
      decideReview(db, {
        runId: run.runId,
        tenantId: "ffffffff-ffff-4fff-8fff-ffffffffffff",
        decision: "approve",
        reviewerId: "wrong-tenant-reviewer",
      }),
    ).rejects.toThrow("tenant_mismatch");
    expect(await resumeRun(db, run.runId)).toEqual(before);
    expect(await db.reviewDecision.count({ where: { runId: run.runId } })).toBe(0);
  });
});
