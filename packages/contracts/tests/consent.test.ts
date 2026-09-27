import { describe, expect, test } from "bun:test";
import { assertFirstJobConsent } from "../src/consent";

describe("first-job consent", () => {
  test("throws without a written record", () => {
    expect(() => assertFirstJobConsent(null)).toThrow(/TICKET-06-thin blocked/);
  });

  test("returns a complete record", () => {
    const consent = assertFirstJobConsent({
      text: "DCC client authorizes this single intake for the pipeline.",
      recordedAt: "2026-09-27T16:00:00.000Z",
    });
    expect(consent.text.length).toBeGreaterThan(0);
  });
});
