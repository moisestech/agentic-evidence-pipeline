import { describe, expect, test } from "bun:test";
import {
  applyCitationGate,
  assertTransition,
  FABRICATED_EVIDENCE_ID,
  fakeAssessControl,
} from "../src/index";
import { assertReviewDecision } from "../src/policy";

describe("review decision policy", () => {
  const valid = fakeAssessControl({
    controlId: "ctrl-digital-presence",
    allowlistedEvidenceIds: ["11111111-1111-4111-8111-111111111111"],
  });

  test("valid assessment permits approve and edit", () => {
    expect(() => assertReviewDecision("approve", valid)).not.toThrow();
    expect(() => assertReviewDecision("edit", valid)).not.toThrow();
  });

  test("unresolved citations block approve and edit, but permit reject", () => {
    const blocked = { ...valid, unsupportedClaims: [FABRICATED_EVIDENCE_ID] };
    expect(() => assertReviewDecision("approve", blocked)).toThrow("unresolved_evidence");
    expect(() => assertReviewDecision("edit", blocked)).toThrow("unresolved_evidence");
    expect(() => assertReviewDecision("reject", blocked)).not.toThrow();
  });

  test("insufficient or absent evidence cannot be approved", () => {
    expect(() =>
      assertReviewDecision("approve", { ...valid, status: "insufficient_evidence" }),
    ).toThrow("unresolved_evidence");
    expect(() => assertReviewDecision("approve", { ...valid, evidenceIds: [] })).toThrow(
      "unresolved_evidence",
    );
  });

  test("untrusted decision values cannot fall through to approval", () => {
    for (const decision of ["override", "", null, undefined, {}]) {
      expect(() => assertReviewDecision(decision, valid)).toThrow("invalid_review_decision");
    }
  });
});

describe("citation gate + fake model", () => {
  test("no retrieved evidence routes to review instead of passing the gate", () => {
    const raw = fakeAssessControl({
      controlId: "ctrl-digital-presence",
      allowlistedEvidenceIds: [],
    });
    const gated = applyCitationGate(raw, new Set());
    expect(gated.blocked).toBe(true);
    expect(gated.assessment.status).toBe("insufficient_evidence");
    expect(() => assertReviewDecision("approve", gated.assessment)).toThrow("unresolved_evidence");
  });

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
