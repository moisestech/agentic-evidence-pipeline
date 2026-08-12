import type { RunAssessmentInput, RunAssessmentResult } from "@aep/agent";
import { runAssessment } from "@aep/agent";
import type { AepPrismaClient } from "@aep/db";
import { type DurableJobRecord, JobError, type JobHandler } from "./types";

export const ASSESS_CONTROL_JOB = "assess-control" as const;

export type AssessControlPayload = {
  tenantId: string;
  idempotencyKey: string;
  fabricateInvalidCitation?: boolean;
  controlId?: string;
  query?: string;
  /** Test hook: throw before assessment. */
  injectFailure?: "retryable" | "terminal";
  injectFailTimes?: number;
};

export function createAssessControlHandler(
  db: AepPrismaClient,
  options?: { attemptCounter?: Map<string, number> },
): JobHandler {
  const attempts = options?.attemptCounter ?? new Map<string, number>();
  return async (job: DurableJobRecord) => {
    const payload = job.payload as AssessControlPayload;
    if (payload.injectFailure) {
      const key = job.id;
      const seen = attempts.get(key) ?? 0;
      attempts.set(key, seen + 1);
      const failTimes = payload.injectFailTimes ?? 1;
      if (seen < failTimes) {
        throw new JobError(`injected_${payload.injectFailure}`, payload.injectFailure);
      }
    }

    const input: RunAssessmentInput = {
      tenantId: payload.tenantId,
      idempotencyKey: payload.idempotencyKey,
      ...(payload.fabricateInvalidCitation !== undefined
        ? { fabricateInvalidCitation: payload.fabricateInvalidCitation }
        : {}),
      ...(payload.controlId !== undefined ? { controlId: payload.controlId } : {}),
      ...(payload.query !== undefined ? { query: payload.query } : {}),
    };
    const result: RunAssessmentResult = await runAssessment(db, input);
    return {
      runId: result.runId,
      status: result.status,
      unsupportedClaims: result.unsupportedClaims,
    };
  };
}
