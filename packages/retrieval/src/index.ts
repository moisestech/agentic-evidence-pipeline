export { EMBEDDING_MODEL, embedTextOffline } from "./embed";
export { retrieve } from "./retrieve";
export { reciprocalRankFusion } from "./search";
export { type SeedResult, seedDemoEvidence } from "./seed";
export type { RetrievalHit, RetrievalMode, RetrieveInput } from "./types";
export { DEFAULT_VISIBILITY, EMBEDDING_DIMS, RRF_K } from "./types";

export const PACKAGE_STATUS = "retrieval-v0.0.1" as const;
