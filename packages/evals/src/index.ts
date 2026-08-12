export {
  percentile,
  recallAtK,
  reciprocalRank,
  retrieveOffline,
} from "./retrieval-offline";
export { loadGoldenSet, runOfflineEval } from "./runner";
export { simulateAssessment } from "./simulate";
export type {
  EvalCorpusItem,
  GoldenCase,
  GoldenSet,
  ModelBehavior,
  ModeScores,
  OfflineEvalReport,
} from "./types";

export const PACKAGE_STATUS = "evals-v0.0.1" as const;
