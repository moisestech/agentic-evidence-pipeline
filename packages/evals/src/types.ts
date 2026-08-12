export type EvalCorpusItem = {
  evidenceId: string;
  sourceRevision: string;
  visibility: string;
  text: string;
};

export type ModelBehavior =
  | "valid"
  | "abstain"
  | "fabricate_citation"
  | "malformed"
  | "refuse"
  | "timeout";

export type GoldenCase = {
  id: string;
  category: string;
  query: string;
  relevantEvidenceIds: string[];
  allowlistedEvidenceIds: string[];
  modelBehavior: ModelBehavior;
  fabricateInvalidCitation: boolean;
  expectedAssessmentStatus: string;
  expectHumanReview: boolean;
  expectUnsupportedClaims: boolean;
};

export type GoldenSet = {
  version: string;
  promptId: string;
  promptVersion: string;
  provider: string;
  note: string;
  corpus: EvalCorpusItem[];
  cases: GoldenCase[];
};

export type ModeScores = {
  recallAt5: number;
  mrr: number;
};

export type OfflineEvalReport = {
  generatedAt: string;
  environment: "offline-fake-provider";
  disclaimer: string;
  promptId: string;
  promptVersion: string;
  promptChecksum: string;
  provider: string;
  caseCount: number;
  retrieval: {
    lexical: ModeScores;
    vector: ModeScores;
    hybrid: ModeScores;
  };
  citationValidityRate: number;
  citationSupportRate: number;
  schemaFirstPassValidity: number;
  schemaFinalValidity: number;
  abstentionCorrectness: number;
  unsupportedClaimRate: number;
  humanReviewRate: number;
  retryFallbackRate: number;
  latencyMs: { p50: number; p95: number };
  tokens: { inputAvg: number; outputAvg: number };
  estimatedCostUsdPerRun: number;
  cases: Array<{
    id: string;
    category: string;
    hybridRecallAt5: number;
    hybridReciprocalRank: number;
    citationValid: boolean;
    schemaValid: boolean;
    humanReview: boolean;
    unsupportedClaims: number;
    latencyMs: number;
  }>;
};
