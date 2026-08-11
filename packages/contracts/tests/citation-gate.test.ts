import { describe, expect, test } from "bun:test";
import {
  assessmentRunStatusSchema,
  controlAssessmentSchema,
  findUnsupportedCitations,
} from "../src/index";

describe("assessmentRunStatusSchema", () => {
  test("accepts documented lifecycle states", () => {
    expect(assessmentRunStatusSchema.parse("needs_review")).toBe("needs_review");
    expect(assessmentRunStatusSchema.parse("finalized")).toBe("finalized");
  });

  test("rejects unknown states", () => {
    expect(() => assessmentRunStatusSchema.parse("chatting")).toThrow();
  });
});

describe("findUnsupportedCitations", () => {
  const allowlistedId = "11111111-1111-4111-8111-111111111111";
  const fabricatedId = "22222222-2222-4222-9222-222222222222";
  const allowlisted = new Set([allowlistedId]);

  test("passes when all citations are allowlisted", () => {
    const assessment = controlAssessmentSchema.parse({
      controlId: "ctrl-digital-presence",
      status: "met",
      confidence: 0.9,
      summary: "Public site documents HTTPS.",
      evidenceIds: [allowlistedId],
      unsupportedClaims: [],
      requiresHumanReview: false,
    });

    expect(findUnsupportedCitations(assessment, allowlisted)).toEqual([]);
  });

  test("flags fabricated evidence IDs", () => {
    const assessment = controlAssessmentSchema.parse({
      controlId: "ctrl-digital-presence",
      status: "met",
      confidence: 0.95,
      summary: "Claims evidence that does not exist.",
      evidenceIds: [fabricatedId],
      unsupportedClaims: [],
      requiresHumanReview: false,
    });

    expect(findUnsupportedCitations(assessment, allowlisted)).toEqual([
      `citation_not_in_allowlist:${fabricatedId}`,
    ]);
  });
});
