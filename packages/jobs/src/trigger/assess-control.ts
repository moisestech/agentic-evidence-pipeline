import { createPrismaClient } from "@aep/db";
import {
  ASSESS_CONTROL_JOB,
  type AssessControlPayload,
  createAssessControlHandler,
} from "../assess-job";
import { PrismaJobStore } from "../prisma-store";
import { DurableRunner } from "../runner";

export type AssessControlTaskResult = Record<string, unknown>;

/**
 * Core assess-control job body shared by offline DurableRunner and Trigger.dev.
 * Trigger.dev wiring: wrap with `task({ id: ASSESS_CONTROL_JOB, retry: {...}, run: runAssessControlJob })`
 * when `@trigger.dev/sdk` is installed (optional peer; not required for CI).
 */
export async function runAssessControlJob(
  payload: AssessControlPayload,
): Promise<AssessControlTaskResult> {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is required for assess-control");
  const db = createPrismaClient(url);
  try {
    const runner = new DurableRunner({
      store: new PrismaJobStore(db),
      handlers: {
        [ASSESS_CONTROL_JOB]: createAssessControlHandler(db),
      },
    });
    const { job } = await runner.enqueue({
      tenantId: payload.tenantId,
      name: ASSESS_CONTROL_JOB,
      idempotencyKey: payload.idempotencyKey,
      payload,
      maxAttempts: 3,
    });
    let current = job;
    for (let i = 0; i < 8; i += 1) {
      const next = await runner.processNext();
      if (!next) break;
      current = next;
      if (current.status === "succeeded" || current.status === "dead_letter") break;
    }
    if (current.status === "dead_letter") {
      throw new Error(current.lastError ?? "assess_control_dead_letter");
    }
    return current.result ?? { jobId: current.id, status: current.status };
  } finally {
    await db.$disconnect();
  }
}

/** Documented Trigger.dev retry policy for assess-control. */
export const ASSESS_CONTROL_RETRY = {
  maxAttempts: 3,
  factor: 1.8,
  minTimeoutInMs: 500,
  maxTimeoutInMs: 30_000,
  randomize: false,
} as const;
