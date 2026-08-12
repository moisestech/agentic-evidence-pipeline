import type { AepPrismaClient } from "@aep/db";
import type { AssessmentRunStatus, ControlAssessment } from "@aep/contracts";
import { retrieve } from "@aep/retrieval";
import {
  applyCitationGate,
  assertTransition,
  fakeAssessControl,
  hashAuditPayload,
  PROMPT_VERSION,
} from "./policy";

export type RunAssessmentInput = {
  tenantId: string;
  controlId?: string;
  query?: string;
  idempotencyKey: string;
  fabricateInvalidCitation?: boolean;
  visibility?: readonly string[];
};

export type RunAssessmentResult = {
  runId: string;
  status: AssessmentRunStatus;
  assessment: ControlAssessment | null;
  allowlistedEvidenceIds: string[];
  unsupportedClaims: string[];
};

async function setStatus(
  db: AepPrismaClient,
  runId: string,
  from: AssessmentRunStatus,
  to: AssessmentRunStatus,
): Promise<void> {
  assertTransition(from, to);
  await db.assessmentRun.update({
    where: { id: runId },
    data: { status: to },
  });
}

async function appendAudit(
  db: AepPrismaClient,
  input: {
    runId: string;
    tenantId: string;
    traceId: string;
    eventType: string;
    actorType: string;
    payload: Record<string, unknown>;
    previousEventHash: string | null;
  },
): Promise<string> {
  const eventHash = hashAuditPayload({
    ...input.payload,
    previousEventHash: input.previousEventHash,
    eventType: input.eventType,
  });
  await db.auditEvent.create({
    data: {
      runId: input.runId,
      tenantId: input.tenantId,
      traceId: input.traceId,
      eventType: input.eventType,
      actorType: input.actorType,
      redactedPayload: input.payload,
      previousEventHash: input.previousEventHash,
      eventHash,
    },
  });
  return eventHash;
}

/**
 * Persisted assessment workflow with optional fabricated-citation failure.
 * Interrupt semantics: stops at needs_review when citation gate blocks.
 */
export async function runAssessment(
  db: AepPrismaClient,
  input: RunAssessmentInput,
): Promise<RunAssessmentResult> {
  const controlId = input.controlId ?? "ctrl-digital-presence";
  const query = input.query ?? "HTTPS accessibility digital readiness inventory";
  const visibility = input.visibility ?? ["public", "staff"];
  const traceId = `trace-${input.idempotencyKey}`;

  const existing = await db.assessmentRun.findUnique({
    where: {
      tenantId_idempotencyKey: {
        tenantId: input.tenantId,
        idempotencyKey: input.idempotencyKey,
      },
    },
    include: { controlAssessments: true },
  });

  if (existing) {
    const assessment = existing.controlAssessments[0] ?? null;
    return {
      runId: existing.id,
      status: existing.status as AssessmentRunStatus,
      assessment: assessment
        ? {
            controlId: assessment.controlId,
            status: assessment.status as ControlAssessment["status"],
            confidence: assessment.confidence,
            summary: assessment.summary,
            evidenceIds: assessment.evidenceIds,
            unsupportedClaims: assessment.unsupportedClaims,
            requiresHumanReview: assessment.requiresHumanReview,
          }
        : null,
      allowlistedEvidenceIds: assessment?.evidenceIds ?? [],
      unsupportedClaims: assessment?.unsupportedClaims ?? [],
    };
  }

  const run = await db.assessmentRun.create({
    data: {
      tenantId: input.tenantId,
      rubricVersion: "readiness-v1",
      promptVersion: PROMPT_VERSION,
      model: "aep-fake-model-v1",
      status: "queued",
      idempotencyKey: input.idempotencyKey,
      traceId,
    },
  });

  let status: AssessmentRunStatus = "queued";
  let prevHash: string | null = null;

  await setStatus(db, run.id, status, "collecting");
  status = "collecting";
  prevHash = await appendAudit(db, {
    runId: run.id,
    tenantId: input.tenantId,
    traceId,
    eventType: "collecting_started",
    actorType: "system",
    payload: { query },
    previousEventHash: prevHash,
  });

  await setStatus(db, run.id, status, "normalizing");
  status = "normalizing";

  await setStatus(db, run.id, status, "retrieving_controls");
  status = "retrieving_controls";
  const hits = await retrieve(db, {
    tenantId: input.tenantId,
    query,
    visibility,
    mode: "hybrid",
    limit: 5,
  });
  const allowlisted = hits.map((h) => h.evidenceId);
  prevHash = await appendAudit(db, {
    runId: run.id,
    tenantId: input.tenantId,
    traceId,
    eventType: "retrieval_completed",
    actorType: "system",
    payload: { hitCount: hits.length, evidenceIds: allowlisted },
    previousEventHash: prevHash,
  });

  await setStatus(db, run.id, status, "assessing");
  status = "assessing";
  const raw = fakeAssessControl({
    controlId,
    allowlistedEvidenceIds: allowlisted,
    fabricateInvalidCitation: input.fabricateInvalidCitation ?? true,
  });

  await setStatus(db, run.id, status, "validating");
  status = "validating";
  const gated = applyCitationGate(raw, new Set(allowlisted));

  const saved = await db.controlAssessment.create({
    data: {
      runId: run.id,
      controlId: gated.assessment.controlId,
      status: gated.assessment.status,
      confidence: gated.assessment.confidence,
      summary: gated.assessment.summary,
      evidenceIds: gated.assessment.evidenceIds,
      unsupportedClaims: gated.assessment.unsupportedClaims,
      requiresHumanReview: gated.assessment.requiresHumanReview,
    },
  });

  if (gated.blocked) {
    await setStatus(db, run.id, status, "needs_review");
    status = "needs_review";
    prevHash = await appendAudit(db, {
      runId: run.id,
      tenantId: input.tenantId,
      traceId,
      eventType: "citation_gate_blocked",
      actorType: "system",
      payload: {
        assessmentId: saved.id,
        unsupportedClaims: gated.assessment.unsupportedClaims,
      },
      previousEventHash: prevHash,
    });
  } else {
    await setStatus(db, run.id, status, "needs_review");
    status = "needs_review";
    prevHash = await appendAudit(db, {
      runId: run.id,
      tenantId: input.tenantId,
      traceId,
      eventType: "awaiting_human_review",
      actorType: "system",
      payload: { assessmentId: saved.id },
      previousEventHash: prevHash,
    });
  }

  return {
    runId: run.id,
    status,
    assessment: gated.assessment,
    allowlistedEvidenceIds: allowlisted,
    unsupportedClaims: gated.assessment.unsupportedClaims,
  };
}

export async function resumeRun(db: AepPrismaClient, runId: string): Promise<RunAssessmentResult> {
  const existing = await db.assessmentRun.findUniqueOrThrow({
    where: { id: runId },
    include: { controlAssessments: true },
  });
  const assessment = existing.controlAssessments[0] ?? null;
  return {
    runId: existing.id,
    status: existing.status as AssessmentRunStatus,
    assessment: assessment
      ? {
          controlId: assessment.controlId,
          status: assessment.status as ControlAssessment["status"],
          confidence: assessment.confidence,
          summary: assessment.summary,
          evidenceIds: assessment.evidenceIds,
          unsupportedClaims: assessment.unsupportedClaims,
          requiresHumanReview: assessment.requiresHumanReview,
        }
      : null,
    allowlistedEvidenceIds: assessment?.evidenceIds ?? [],
    unsupportedClaims: assessment?.unsupportedClaims ?? [],
  };
}

export async function decideReview(
  db: AepPrismaClient,
  input: {
    runId: string;
    tenantId: string;
    decision: "approve" | "edit" | "reject";
    reviewerId: string;
    comment?: string;
    editedSummary?: string;
  },
): Promise<RunAssessmentResult> {
  const run = await db.assessmentRun.findUniqueOrThrow({
    where: { id: input.runId },
    include: { controlAssessments: true },
  });
  if (run.status !== "needs_review") {
    throw new Error(`invalid_transition:${run.status}->review_decision`);
  }
  const assessment = run.controlAssessments[0];
  if (!assessment) {
    throw new Error("missing_assessment");
  }

  const beforeHash = hashAuditPayload(assessment);
  let afterSummary = assessment.summary;
  if (input.decision === "edit" && input.editedSummary) {
    afterSummary = input.editedSummary;
    await db.controlAssessment.update({
      where: { id: assessment.id },
      data: { summary: afterSummary },
    });
  }
  const afterHash = hashAuditPayload({ ...assessment, summary: afterSummary });

  await db.reviewDecision.create({
    data: {
      runId: run.id,
      tenantId: input.tenantId,
      assessmentId: assessment.id,
      reviewerId: input.reviewerId,
      decision: input.decision,
      beforeHash,
      afterHash,
      comment: input.comment ?? null,
    },
  });

  const next: AssessmentRunStatus = input.decision === "reject" ? "rejected" : "approved";
  assertTransition("needs_review", next);
  await db.assessmentRun.update({
    where: { id: run.id },
    data: { status: next, completedAt: new Date() },
  });
  assertTransition(next, "finalized");
  await db.assessmentRun.update({
    where: { id: run.id },
    data: { status: "finalized" },
  });

  await appendAudit(db, {
    runId: run.id,
    tenantId: input.tenantId,
    traceId: run.traceId,
    eventType: `review_${input.decision}`,
    actorType: "human",
    payload: {
      reviewerId: input.reviewerId,
      decision: input.decision,
    },
    previousEventHash: null,
  });

  return resumeRun(db, run.id);
}
