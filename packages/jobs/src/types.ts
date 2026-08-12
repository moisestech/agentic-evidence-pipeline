export type JobStatus = "queued" | "running" | "succeeded" | "failed" | "dead_letter";

export type FailureClass = "retryable" | "terminal" | "injected";

export type DurableJobRecord = {
  id: string;
  tenantId: string;
  name: string;
  idempotencyKey: string;
  status: JobStatus;
  attemptCount: number;
  maxAttempts: number;
  payload: Record<string, unknown>;
  result: Record<string, unknown> | null;
  lastError: string | null;
  failureClass: FailureClass | null;
  nextAttemptAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type EnqueueInput = {
  tenantId: string;
  name: string;
  idempotencyKey: string;
  payload: Record<string, unknown>;
  maxAttempts?: number;
};

export type JobHandler = (job: DurableJobRecord) => Promise<Record<string, unknown>>;

export class JobError extends Error {
  readonly failureClass: FailureClass;

  constructor(message: string, failureClass: FailureClass = "retryable") {
    super(message);
    this.name = "JobError";
    this.failureClass = failureClass;
  }
}

export function classifyError(error: unknown): FailureClass {
  if (error instanceof JobError) return error.failureClass;
  return "retryable";
}

export function backoffMs(attemptCount: number, baseMs = 50): number {
  return Math.min(baseMs * 2 ** Math.max(0, attemptCount - 1), 5_000);
}
