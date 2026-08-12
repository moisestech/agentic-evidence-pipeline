import { describe, expect, test } from "bun:test";
import { loadGoldenSet, recallAtK, reciprocalRank, runOfflineEval } from "../src";

describe("offline eval", () => {
  test("golden set has at least 30 cases across required categories", () => {
    const golden = loadGoldenSet();
    expect(golden.cases.length).toBeGreaterThanOrEqual(30);
    const cats = new Set(golden.cases.map((c) => c.category));
    for (const required of [
      "clearly_met",
      "clearly_unmet",
      "conflicting",
      "missing_evidence",
      "stale_revision",
      "prompt_injection",
      "cross_tenant",
      "malformed_output",
      "model_refusal",
      "timeout_rate_limit",
    ]) {
      expect(cats.has(required)).toBe(true);
    }
  });

  test("runOfflineEval produces retrieval and citation metrics", () => {
    const report = runOfflineEval();
    expect(report.caseCount).toBeGreaterThanOrEqual(30);
    expect(report.environment).toBe("offline-fake-provider");
    expect(report.promptId).toBe("assess-control");
    expect(report.retrieval.hybrid.recallAt5).toBeGreaterThan(0);
    expect(report.schemaFinalValidity).toBe(1);
    expect(report.disclaimer).toContain("Not a live-model");
  });

  test("recall and MRR helpers", () => {
    expect(recallAtK(["a", "b", "c"], ["b"], 5)).toBe(1);
    expect(recallAtK(["a", "b"], ["c"], 5)).toBe(0);
    expect(reciprocalRank(["a", "b", "c"], ["b"])).toBe(0.5);
  });
});
