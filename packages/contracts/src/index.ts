import { createHash } from "node:crypto";
import { z } from "zod";

/** Run lifecycle states from docs/ARCHITECTURE.md */
export const assessmentRunStatusSchema = z.enum([
  "queued",
  "collecting",
  "normalizing",
  "retrieving_controls",
  "assessing",
  "validating",
  "needs_review",
  "approved",
  "rejected",
  "finalized",
  "failed",
]);

export type AssessmentRunStatus = z.infer<typeof assessmentRunStatusSchema>;

export const controlAssessmentStatusSchema = z.enum([
  "met",
  "partial",
  "unmet",
  "insufficient_evidence",
]);

export type ControlAssessmentStatus = z.infer<typeof controlAssessmentStatusSchema>;

export const reviewDecisionSchema = z.enum(["approve", "edit", "reject"]);

export type ReviewDecisionKind = z.infer<typeof reviewDecisionSchema>;

export const visibilitySchema = z.enum(["public", "staff", "excluded"]);

export type Visibility = z.infer<typeof visibilitySchema>;

export const sourceKindSchema = z.enum(["github", "http_markdown", "csv"]);

export type SourceKind = z.infer<typeof sourceKindSchema>;

export const sourceSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  kind: sourceKindSchema,
  locator: z.string().min(1),
  visibility: visibilitySchema,
  revision: z.string().min(1),
  contentHash: z.string().min(1),
  retrievedAt: z.string().datetime(),
  status: z.enum(["ready", "failed", "stale"]),
  lastErrorCode: z.string().nullable(),
});

export type Source = z.infer<typeof sourceSchema>;

export const evidenceItemSchema = z.object({
  id: z.string().uuid(),
  sourceId: z.string().uuid(),
  tenantId: z.string().uuid(),
  text: z.string().min(1),
  contentHash: z.string().min(1),
  visibility: visibilitySchema,
  sourceRevision: z.string().min(1),
  createdAt: z.string().datetime(),
});

export type EvidenceItem = z.infer<typeof evidenceItemSchema>;

export const controlAssessmentSchema = z.object({
  controlId: z.string().min(1),
  status: controlAssessmentStatusSchema,
  confidence: z.number().min(0).max(1),
  summary: z.string().min(1),
  evidenceIds: z.array(z.string().uuid()),
  unsupportedClaims: z.array(z.string()).default([]),
  requiresHumanReview: z.boolean(),
});

export type ControlAssessment = z.infer<typeof controlAssessmentSchema>;

/**
 * Stable content hash for evidence/source bodies.
 * Uses sha256 hex so fixtures and DB checksums stay comparable.
 */
export function hashContent(input: string): string {
  return createHash("sha256").update(input, "utf8").digest("hex");
}

/**
 * Normalize whitespace and line endings before hashing so fixture drift is intentional.
 */
export function normalizeEvidenceText(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .trim();
}

/**
 * Citation gate: every evidence ID must be in the run allowlist.
 * Returns unsupported claim messages for IDs outside the allowlist.
 */
export function findUnsupportedCitations(
  assessment: ControlAssessment,
  allowlistedEvidenceIds: ReadonlySet<string>,
): string[] {
  const unsupported: string[] = [];
  for (const evidenceId of assessment.evidenceIds) {
    if (!allowlistedEvidenceIds.has(evidenceId)) {
      unsupported.push(`citation_not_in_allowlist:${evidenceId}`);
    }
  }
  return unsupported;
}

export const PACKAGE_STATUS = "contracts-v0.0.2" as const;
