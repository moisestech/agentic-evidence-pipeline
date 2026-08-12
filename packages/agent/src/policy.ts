import { createHash } from "node:crypto";
import {
  type AssessmentRunStatus,
  type ControlAssessment,
  findUnsupportedCitations,
} from "@aep/contracts";

export const FABRICATED_EVIDENCE_ID = "ffffffff-ffff-4fff-8fff-ffffffffffff";

export type FakeModelInput = {
  controlId: string;
  allowlistedEvidenceIds: readonly string[];
  /** When true, emit one nonexistent evidence ID (memorable failure fixture). */
  fabricateInvalidCitation?: boolean;
};

export function fakeAssessControl(input: FakeModelInput): ControlAssessment {
  const realIds = [...input.allowlistedEvidenceIds];
  const evidenceIds =
    input.fabricateInvalidCitation && realIds[0]
      ? [realIds[0], FABRICATED_EVIDENCE_ID]
      : realIds.slice(0, Math.max(1, realIds.length));

  return {
    controlId: input.controlId,
    status: "met",
    confidence: 0.91,
    summary: "The partner documents HTTPS enforcement and a public digital-readiness inventory.",
    evidenceIds,
    unsupportedClaims: [],
    requiresHumanReview: false,
  };
}

export function applyCitationGate(
  assessment: ControlAssessment,
  allowlistedEvidenceIds: ReadonlySet<string>,
): { assessment: ControlAssessment; blocked: boolean } {
  const unsupported = findUnsupportedCitations(assessment, allowlistedEvidenceIds);
  if (unsupported.length === 0) {
    return { assessment, blocked: false };
  }
  return {
    blocked: true,
    assessment: {
      ...assessment,
      status: "insufficient_evidence",
      requiresHumanReview: true,
      unsupportedClaims: unsupported,
      confidence: Math.min(assessment.confidence, 0.4),
    },
  };
}

const ALLOWED: Record<AssessmentRunStatus, AssessmentRunStatus[]> = {
  queued: ["collecting", "failed"],
  collecting: ["normalizing", "failed"],
  normalizing: ["retrieving_controls", "failed"],
  retrieving_controls: ["assessing", "failed"],
  assessing: ["validating", "failed"],
  validating: ["needs_review", "approved", "failed"],
  needs_review: ["approved", "rejected", "failed"],
  approved: ["finalized"],
  rejected: ["finalized"],
  finalized: [],
  failed: [],
};

export function assertTransition(from: AssessmentRunStatus, to: AssessmentRunStatus): void {
  const allowed = ALLOWED[from] ?? [];
  if (!allowed.includes(to)) {
    throw new Error(`invalid_transition:${from}->${to}`);
  }
}

export function hashAuditPayload(payload: unknown): string {
  return createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

export const PROMPT_VERSION = "partner-readiness-v1";
