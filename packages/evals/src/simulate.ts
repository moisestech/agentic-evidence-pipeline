import { applyCitationGate, FABRICATED_EVIDENCE_ID, fakeAssessControl } from "@aep/agent";
import type { ControlAssessment } from "@aep/contracts";
import type { GoldenCase, ModelBehavior } from "./types";

export type SimulatedAssessment = {
  assessment: ControlAssessment;
  schemaFirstPassValid: boolean;
  schemaFinalValid: boolean;
  retried: boolean;
  latencyMs: number;
  inputTokens: number;
  outputTokens: number;
};

function abstainAssessment(controlId: string): ControlAssessment {
  return {
    controlId,
    status: "insufficient_evidence",
    confidence: 0.2,
    summary: "Evidence is insufficient or conflicting; abstaining pending human review.",
    evidenceIds: [],
    unsupportedClaims: [],
    requiresHumanReview: true,
  };
}

function baseLatency(behavior: ModelBehavior): number {
  switch (behavior) {
    case "timeout":
      return 240;
    case "malformed":
      return 95;
    case "refuse":
      return 70;
    default:
      return 45;
  }
}

/**
 * Deterministic fake-provider simulation for offline evals.
 * Not a live-model quality benchmark.
 */
export function simulateAssessment(input: {
  case: GoldenCase;
  retrievedIds: readonly string[];
}): SimulatedAssessment {
  const controlId = "ctrl-digital-presence";
  const allowlisted = new Set(input.case.allowlistedEvidenceIds);
  const latencyMs = baseLatency(input.case.modelBehavior);
  const inputTokens = 180 + input.case.query.length;
  let schemaFirstPassValid = true;
  let schemaFinalValid = true;
  let retried = false;
  let assessment: ControlAssessment;

  switch (input.case.modelBehavior) {
    case "malformed": {
      schemaFirstPassValid = false;
      retried = true;
      // Bounded repair: fall back to abstention after one repair budget.
      assessment = abstainAssessment(controlId);
      schemaFinalValid = true;
      break;
    }
    case "refuse":
    case "timeout":
    case "abstain": {
      assessment = abstainAssessment(controlId);
      break;
    }
    case "fabricate_citation": {
      const raw = fakeAssessControl({
        controlId,
        allowlistedEvidenceIds: input.retrievedIds.length
          ? input.retrievedIds
          : [FABRICATED_EVIDENCE_ID],
        fabricateInvalidCitation: true,
      });
      const gated = applyCitationGate(raw, allowlisted);
      assessment = gated.assessment;
      break;
    }
    default: {
      const ids = input.retrievedIds.filter((id) => allowlisted.has(id));
      const raw = fakeAssessControl({
        controlId,
        allowlistedEvidenceIds: ids.length ? ids : [...allowlisted].slice(0, 1),
        fabricateInvalidCitation: input.case.fabricateInvalidCitation,
      });
      const gated = applyCitationGate(raw, allowlisted);
      assessment = gated.assessment;
      break;
    }
  }

  const outputTokens = Math.max(32, Math.round(assessment.summary.length / 4));
  return {
    assessment,
    schemaFirstPassValid,
    schemaFinalValid,
    retried,
    latencyMs,
    inputTokens,
    outputTokens,
  };
}
