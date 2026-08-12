export type RetrievalMode = "lexical" | "vector" | "hybrid";

export type RetrievalHit = {
  evidenceId: string;
  sourceRevision: string;
  tenantId: string;
  visibility: string;
  text: string;
  rank: number;
  lexicalScore: number | null;
  vectorScore: number | null;
  fusedScore: number;
  reason: string;
};

export type RetrieveInput = {
  tenantId: string;
  query: string;
  visibility?: readonly string[];
  limit?: number;
  mode?: RetrievalMode;
};

export const DEFAULT_VISIBILITY = ["public", "staff"] as const;
export const EMBEDDING_DIMS = 32;
export const RRF_K = 60;
