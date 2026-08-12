import type { AepPrismaClient } from "@aep/db";
import { embedTextOffline } from "./embed";
import { lexicalSearch, reciprocalRankFusion, vectorSearch } from "./search";
import { DEFAULT_VISIBILITY, type RetrievalHit, type RetrieveInput } from "./types";

export async function retrieve(db: AepPrismaClient, input: RetrieveInput): Promise<RetrievalHit[]> {
  const limit = input.limit ?? 5;
  const visibility = input.visibility ?? DEFAULT_VISIBILITY;
  const mode = input.mode ?? "hybrid";

  const lexical =
    mode === "vector"
      ? []
      : await lexicalSearch(db, {
          tenantId: input.tenantId,
          query: input.query,
          visibility,
          limit: limit * 3,
        });

  let vector: Awaited<ReturnType<typeof vectorSearch>> = [];
  if (mode !== "lexical") {
    const embedding = embedTextOffline(input.query);
    vector = await vectorSearch(db, {
      tenantId: input.tenantId,
      embedding,
      visibility,
      limit: limit * 3,
    });
  }

  if (mode === "lexical") {
    return reciprocalRankFusion(lexical, [], limit).map((hit) => ({
      ...hit,
      reason: hit.reason.includes("lexical") ? hit.reason : "lexical_only",
    }));
  }

  if (mode === "vector") {
    if (vector.length === 0) {
      // Degradation path used by hybrid when vectors missing; vector-only returns empty.
      return [];
    }
    return reciprocalRankFusion([], vector, limit);
  }

  // hybrid: if vectors unavailable, degrade to lexical-only
  if (vector.length === 0 && lexical.length > 0) {
    return reciprocalRankFusion(lexical, [], limit).map((hit, index) => ({
      ...hit,
      rank: index + 1,
      reason: `${hit.reason}+degraded_lexical_only`,
    }));
  }

  return reciprocalRankFusion(lexical, vector, limit);
}
