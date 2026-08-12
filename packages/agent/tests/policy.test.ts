import { describe, expect, test } from "bun:test";
import {
  applyCitationGate,
  assertTransition,
  FABRICATED_EVIDENCE_ID,
  fakeAssessControl,
} from "../src/index";

describe("citation gate + fake model", () => {
  test("fabricated citation is blocked", () => {
    const allowlisted = new Set(["11111111-1111-4111-8111-111111111111"]);
    const raw = fakeAssessControl({
      controlId: "ctrl-digital-presence",
      allowlistedEvidenceIds: [...allowlisted],
      fabricateInvalidCitation: true,
    });
    expect(raw.evidenceIds).toContain(FABRICATED_EVIDENCE_ID);
    const gated = applyCitationGate(raw, allowlisted);
    expect(gated.blocked).toBe(true);
    expect(gated.assessment.status).toBe("insufficient_evidence");
    expect(gated.assessment.requiresHumanReview).toBe(true);
    expect(gated.assessment.unsupportedClaims.length).toBeGreaterThan(0);
  });

  test("valid citations pass", () => {
    const id = "11111111-1111-4111-8111-111111111111";
    const raw = fakeAssessControl({
      controlId: "ctrl-digital-presence",
      allowlistedEvidenceIds: [id],
      fabricateInvalidCitation: false,
    });
    const gated = applyCitationGate(raw, new Set([id]));
    expect(gated.blocked).toBe(false);
    expect(gated.assessment.status).toBe("met");
  });
});

describe("assertTransition", () => {
  test("allows validating to needs_review", () => {
    expect(() => assertTransition("validating", "needs_review")).not.toThrow();
  });

  test("rejects invalid jumps", () => {
    expect(() => assertTransition("queued", "finalized")).toThrow(/invalid_transition/);
  });
});
