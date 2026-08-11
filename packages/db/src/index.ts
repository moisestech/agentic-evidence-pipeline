export { type AepPrismaClient, createPrismaClient } from "./client";
export {
  assertSameTenant,
  listEvidenceForTenant,
  TenantBoundaryError,
} from "./tenant";
export {
  ensurePgvectorExtension,
  similarEvidenceIds,
  upsertEvidenceEmbedding,
} from "./vector";

export const PACKAGE_STATUS = "db-v0.0.2" as const;
