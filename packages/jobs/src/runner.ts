import { randomUUID } from "node:crypto";
import type { JobStore } from "./store";
import {
  backoffMs,
  classifyError,
  type DurableJobRecord,
  type EnqueueInput,
  type JobHandler,
} from "./types";

export type DurableRunnerOptions = {
  store: JobStore;
  handlers: Record<string, JobHandler>;
  now?: () => Date;
  sleep?: (ms: number) => Promise<void>;
};

/**
 * Offline durable runner mirroring Trigger.dev retry + idempotency + DLQ semantics.
 * CI and `bun run verify` use this path; Trigger.dev wraps the same handlers in cloud.
 */
export class DurableRunner {
  private readonly store: JobStore;
  private readonly handlers: Record<string, JobHandler>;
  private readonly now: () => Date;
  private readonly sleep: (ms: number) => Promise<void>;

  constructor(options: DurableRunnerOptions) {
    this.store = options.store;
    this.handlers = options.handlers;
    this.now = options.now ?? (() => new Date());
    this.sleep = options.sleep ?? (async () => undefined);
  }

  async enqueue(input: EnqueueInput): Promise<{ job: DurableJobRecord; created: boolean }> {
    const existing = await this.store.findByIdempotency(
      input.tenantId,
      input.name,
      input.idempotencyKey,
    );
    if (existing) {
      return { job: existing, created: false };
    }
    const job = await this.store.create({
      ...input,
      id: randomUUID(),
      status: "queued",
      nextAttemptAt: this.now(),
    });
    return { job, created: true };
  }

  async processNext(): Promise<DurableJobRecord | null> {
    const claimed = await this.store.claimNext(this.now());
    if (!claimed) return null;

    const handler = this.handlers[claimed.name];
    if (!handler) {
      return this.store.update(claimed.id, {
        status: "dead_letter",
        failureClass: "terminal",
        lastError: `unknown_handler:${claimed.name}`,
        attemptCount: claimed.attemptCount + 1,
        nextAttemptAt: null,
      });
    }

    const attemptCount = claimed.attemptCount + 1;
    try {
      const result = await handler(claimed);
      return this.store.update(claimed.id, {
        status: "succeeded",
        attemptCount,
        result,
        lastError: null,
        failureClass: null,
        nextAttemptAt: null,
      });
    } catch (error) {
      const failureClass = classifyError(error);
      const message = error instanceof Error ? error.message : "job_failed";
      if (failureClass === "terminal" || attemptCount >= claimed.maxAttempts) {
        return this.store.update(claimed.id, {
          status: "dead_letter",
          attemptCount,
          lastError: message,
          failureClass,
          nextAttemptAt: null,
        });
      }
      const delay = backoffMs(attemptCount);
      await this.sleep(delay);
      return this.store.update(claimed.id, {
        status: "failed",
        attemptCount,
        lastError: message,
        failureClass,
        nextAttemptAt: new Date(this.now().getTime() + delay),
      });
    }
  }

  async drain(maxSteps = 50): Promise<DurableJobRecord[]> {
    const finished: DurableJobRecord[] = [];
    for (let i = 0; i < maxSteps; i += 1) {
      const job = await this.processNext();
      if (!job) break;
      finished.push(job);
      if (job.status === "failed") {
      }
    }
    return finished;
  }

  async replayDeadLetter(jobId: string): Promise<DurableJobRecord> {
    const job = await this.store.get(jobId);
    if (!job) throw new Error(`job_not_found:${jobId}`);
    if (job.status !== "dead_letter") {
      throw new Error(`invalid_replay_status:${job.status}`);
    }
    return this.store.update(jobId, {
      status: "queued",
      attemptCount: 0,
      lastError: null,
      failureClass: null,
      result: null,
      nextAttemptAt: this.now(),
    });
  }

  listDeadLetters(tenantId?: string): Promise<DurableJobRecord[]> {
    return this.store.listDeadLetters(tenantId);
  }
}
