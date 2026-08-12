import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { getPrompt } from "@aep/prompts";
import { percentile, recallAtK, reciprocalRank, retrieveOffline } from "./retrieval-offline";
import { simulateAssessment } from "./simulate";
import type { GoldenSet, ModeScores, OfflineEvalReport } from "./types";

const REPO_FIXTURE = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../../fixtures/evals/golden-set.json",
);

export function loadGoldenSet(path = REPO_FIXTURE): GoldenSet {
  return JSON.parse(readFileSync(path, "utf8")) as GoldenSet;
}

function avgModeScores(scores: Array<{ recallAt5: number; mrr: number }>): ModeScores {
  if (scores.length === 0) return { recallAt5: 0, mrr: 0 };
  const recallAt5 = scores.reduce((s, x) => s + x.recallAt5, 0) / scores.length;
  const mrr = scores.reduce((s, x) => s + x.mrr, 0) / scores.length;
  return { recallAt5, mrr };
}

export function runOfflineEval(golden: GoldenSet = loadGoldenSet()): OfflineEvalReport {
  const prompt = getPrompt(golden.promptId, golden.promptVersion);
  const latencies: number[] = [];
  const caseRows: OfflineEvalReport["cases"] = [];

  const lexicalScores: Array<{ recallAt5: number; mrr: number }> = [];
  const vectorScores: Array<{ recallAt5: number; mrr: number }> = [];
  const hybridScores: Array<{ recallAt5: number; mrr: number }> = [];

  let citationValid = 0;
  let citationSupported = 0;
  let schemaFirst = 0;
  let schemaFinal = 0;
  let abstentionCorrect = 0;
  let abstentionCases = 0;
  let unsupportedCases = 0;
  let humanReview = 0;
  let retries = 0;
  let inputTokens = 0;
  let outputTokens = 0;

  for (const c of golden.cases) {
    const lex = retrieveOffline(golden.corpus, c.query, "lexical", 5);
    const vec = retrieveOffline(golden.corpus, c.query, "vector", 5);
    const hyb = retrieveOffline(golden.corpus, c.query, "hybrid", 5);

    const lexIds = lex.map((h) => h.evidenceId);
    const vecIds = vec.map((h) => h.evidenceId);
    const hybIds = hyb.map((h) => h.evidenceId);

    lexicalScores.push({
      recallAt5: recallAtK(lexIds, c.relevantEvidenceIds, 5),
      mrr: reciprocalRank(lexIds, c.relevantEvidenceIds),
    });
    vectorScores.push({
      recallAt5: recallAtK(vecIds, c.relevantEvidenceIds, 5),
      mrr: reciprocalRank(vecIds, c.relevantEvidenceIds),
    });
    hybridScores.push({
      recallAt5: recallAtK(hybIds, c.relevantEvidenceIds, 5),
      mrr: reciprocalRank(hybIds, c.relevantEvidenceIds),
    });

    const sim = simulateAssessment({ case: c, retrievedIds: hybIds });
    latencies.push(sim.latencyMs);
    inputTokens += sim.inputTokens;
    outputTokens += sim.outputTokens;
    if (sim.retried) retries += 1;
    if (sim.schemaFirstPassValid) schemaFirst += 1;
    if (sim.schemaFinalValid) schemaFinal += 1;
    if (sim.assessment.requiresHumanReview) humanReview += 1;
    if (sim.assessment.unsupportedClaims.length > 0) unsupportedCases += 1;

    const citedOk =
      sim.assessment.evidenceIds.every((id) => c.allowlistedEvidenceIds.includes(id)) &&
      sim.assessment.unsupportedClaims.length === 0;
    if (citedOk) citationValid += 1;
    if (
      sim.assessment.evidenceIds.length === 0 ||
      sim.assessment.evidenceIds.every((id) => c.allowlistedEvidenceIds.includes(id))
    ) {
      citationSupported += 1;
    }

    const shouldAbstain =
      c.modelBehavior === "abstain" ||
      c.modelBehavior === "refuse" ||
      c.modelBehavior === "timeout" ||
      c.modelBehavior === "malformed" ||
      c.expectHumanReview;
    if (shouldAbstain) {
      abstentionCases += 1;
      if (sim.assessment.status === c.expectedAssessmentStatus) abstentionCorrect += 1;
    }

    caseRows.push({
      id: c.id,
      category: c.category,
      hybridRecallAt5: recallAtK(hybIds, c.relevantEvidenceIds, 5),
      hybridReciprocalRank: reciprocalRank(hybIds, c.relevantEvidenceIds),
      citationValid: citedOk,
      schemaValid: sim.schemaFinalValid,
      humanReview: sim.assessment.requiresHumanReview,
      unsupportedClaims: sim.assessment.unsupportedClaims.length,
      latencyMs: sim.latencyMs,
    });
  }

  const n = golden.cases.length;
  return {
    generatedAt: new Date().toISOString(),
    environment: "offline-fake-provider",
    disclaimer:
      "Harness metrics from the deterministic fake provider and in-memory hybrid retrieval. Not a live-model quality benchmark.",
    promptId: prompt.id,
    promptVersion: prompt.version,
    promptChecksum: prompt.checksum,
    provider: golden.provider,
    caseCount: n,
    retrieval: {
      lexical: avgModeScores(lexicalScores),
      vector: avgModeScores(vectorScores),
      hybrid: avgModeScores(hybridScores),
    },
    citationValidityRate: citationValid / n,
    citationSupportRate: citationSupported / n,
    schemaFirstPassValidity: schemaFirst / n,
    schemaFinalValidity: schemaFinal / n,
    abstentionCorrectness: abstentionCases === 0 ? 1 : abstentionCorrect / abstentionCases,
    unsupportedClaimRate: unsupportedCases / n,
    humanReviewRate: humanReview / n,
    retryFallbackRate: retries / n,
    latencyMs: { p50: percentile(latencies, 50), p95: percentile(latencies, 95) },
    tokens: {
      inputAvg: inputTokens / n,
      outputAvg: outputTokens / n,
    },
    estimatedCostUsdPerRun: 0,
    cases: caseRows,
  };
}
