import type { DurableJobRecord, EnqueueInput, JobStatus } from "./types";

export type JobStore = {
  findByIdempotency(
    tenantId: string,
    name: string,
    idempotencyKey: string,
  ): Promise<DurableJobRecord | null>;
  create(
    input: EnqueueInput & { id: string; status: JobStatus; nextAttemptAt: Date },
  ): Promise<DurableJobRecord>;
  update(id: string, patch: Partial<DurableJobRecord>): Promise<DurableJobRecord>;
  get(id: string): Promise<DurableJobRecord | null>;
  listDeadLetters(tenantId?: string): Promise<DurableJobRecord[]>;
  claimNext(now: Date): Promise<DurableJobRecord | null>;
};

function clone(job: DurableJobRecord): DurableJobRecord {
  return {
    ...job,
    payload: { ...job.payload },
    result: job.result ? { ...job.result } : null,
    nextAttemptAt: job.nextAttemptAt ? new Date(job.nextAttemptAt) : null,
    createdAt: new Date(job.createdAt),
    updatedAt: new Date(job.updatedAt),
  };
}

export class MemoryJobStore implements JobStore {
  private readonly jobs = new Map<string, DurableJobRecord>();

  async findByIdempotency(
    tenantId: string,
    name: string,
    idempotencyKey: string,
  ): Promise<DurableJobRecord | null> {
    for (const job of this.jobs.values()) {
      if (job.tenantId === tenantId && job.name === name && job.idempotencyKey === idempotencyKey) {
        return clone(job);
      }
    }
    return null;
  }

  async create(
    input: EnqueueInput & { id: string; status: JobStatus; nextAttemptAt: Date },
  ): Promise<DurableJobRecord> {
    const now = input.nextAttemptAt;
    const job: DurableJobRecord = {
      id: input.id,
      tenantId: input.tenantId,
      name: input.name,
      idempotencyKey: input.idempotencyKey,
      status: input.status,
      attemptCount: 0,
      maxAttempts: input.maxAttempts ?? 3,
      payload: { ...input.payload },
      result: null,
      lastError: null,
      failureClass: null,
      nextAttemptAt: now,
      createdAt: now,
      updatedAt: now,
    };
    this.jobs.set(job.id, job);
    return clone(job);
  }

  async update(id: string, patch: Partial<DurableJobRecord>): Promise<DurableJobRecord> {
    const existing = this.jobs.get(id);
    if (!existing) throw new Error(`job_not_found:${id}`);
    const next: DurableJobRecord = {
      ...existing,
      ...patch,
      payload: patch.payload ? { ...patch.payload } : existing.payload,
      result:
        patch.result === undefined ? existing.result : patch.result ? { ...patch.result } : null,
      updatedAt: new Date(),
    };
    this.jobs.set(id, next);
    return clone(next);
  }

  async get(id: string): Promise<DurableJobRecord | null> {
    const job = this.jobs.get(id);
    return job ? clone(job) : null;
  }

  async listDeadLetters(tenantId?: string): Promise<DurableJobRecord[]> {
    return [...this.jobs.values()]
      .filter((j) => j.status === "dead_letter" && (!tenantId || j.tenantId === tenantId))
      .map(clone);
  }

  async claimNext(now: Date): Promise<DurableJobRecord | null> {
    const candidates = [...this.jobs.values()]
      .filter(
        (j) =>
          (j.status === "queued" || j.status === "failed") &&
          j.nextAttemptAt !== null &&
          j.nextAttemptAt.getTime() <= now.getTime(),
      )
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    const next = candidates[0];
    if (!next) return null;
    next.status = "running";
    next.updatedAt = new Date();
    this.jobs.set(next.id, next);
    return clone(next);
  }
}
