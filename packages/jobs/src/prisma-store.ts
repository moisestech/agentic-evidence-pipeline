import type { AepPrismaClient } from "@aep/db";
import { Prisma } from "@prisma/client";
import type { JobStore } from "./store";
import type { DurableJobRecord, EnqueueInput, FailureClass, JobStatus } from "./types";

function mapRow(row: {
  id: string;
  tenantId: string;
  name: string;
  idempotencyKey: string;
  status: string;
  attemptCount: number;
  maxAttempts: number;
  payload: Prisma.JsonValue;
  result: Prisma.JsonValue | null;
  lastError: string | null;
  failureClass: string | null;
  nextAttemptAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): DurableJobRecord {
  return {
    id: row.id,
    tenantId: row.tenantId,
    name: row.name,
    idempotencyKey: row.idempotencyKey,
    status: row.status as JobStatus,
    attemptCount: row.attemptCount,
    maxAttempts: row.maxAttempts,
    payload: (row.payload ?? {}) as Record<string, unknown>,
    result: (row.result as Record<string, unknown> | null) ?? null,
    lastError: row.lastError,
    failureClass: (row.failureClass as FailureClass | null) ?? null,
    nextAttemptAt: row.nextAttemptAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class PrismaJobStore implements JobStore {
  constructor(private readonly db: AepPrismaClient) {}

  async findByIdempotency(
    tenantId: string,
    name: string,
    idempotencyKey: string,
  ): Promise<DurableJobRecord | null> {
    const row = await this.db.durableJob.findUnique({
      where: {
        tenantId_name_idempotencyKey: { tenantId, name, idempotencyKey },
      },
    });
    return row ? mapRow(row) : null;
  }

  async create(
    input: EnqueueInput & { id: string; status: JobStatus; nextAttemptAt: Date },
  ): Promise<DurableJobRecord> {
    const row = await this.db.durableJob.create({
      data: {
        id: input.id,
        tenantId: input.tenantId,
        name: input.name,
        idempotencyKey: input.idempotencyKey,
        status: input.status,
        maxAttempts: input.maxAttempts ?? 3,
        payload: input.payload as Prisma.InputJsonValue,
        nextAttemptAt: input.nextAttemptAt,
      },
    });
    return mapRow(row);
  }

  async update(id: string, patch: Partial<DurableJobRecord>): Promise<DurableJobRecord> {
    const data: Prisma.DurableJobUpdateInput = {};
    if (patch.status !== undefined) data.status = patch.status;
    if (patch.attemptCount !== undefined) data.attemptCount = patch.attemptCount;
    if (patch.maxAttempts !== undefined) data.maxAttempts = patch.maxAttempts;
    if (patch.payload !== undefined) data.payload = patch.payload as Prisma.InputJsonValue;
    if (patch.result !== undefined) {
      data.result =
        patch.result === null ? Prisma.JsonNull : (patch.result as Prisma.InputJsonValue);
    }
    if (patch.lastError !== undefined) data.lastError = patch.lastError;
    if (patch.failureClass !== undefined) data.failureClass = patch.failureClass;
    if (patch.nextAttemptAt !== undefined) data.nextAttemptAt = patch.nextAttemptAt;
    const row = await this.db.durableJob.update({
      where: { id },
      data,
    });
    return mapRow(row);
  }

  async get(id: string): Promise<DurableJobRecord | null> {
    const row = await this.db.durableJob.findUnique({ where: { id } });
    return row ? mapRow(row) : null;
  }

  async listDeadLetters(tenantId?: string): Promise<DurableJobRecord[]> {
    const rows = await this.db.durableJob.findMany({
      where: {
        status: "dead_letter",
        ...(tenantId ? { tenantId } : {}),
      },
      orderBy: { createdAt: "asc" },
    });
    return rows.map(mapRow);
  }

  async claimNext(now: Date): Promise<DurableJobRecord | null> {
    const candidate = await this.db.durableJob.findFirst({
      where: {
        status: { in: ["queued", "failed"] },
        nextAttemptAt: { lte: now },
      },
      orderBy: { createdAt: "asc" },
    });
    if (!candidate) return null;
    const updated = await this.db.durableJob.updateMany({
      where: {
        id: candidate.id,
        status: { in: ["queued", "failed"] },
      },
      data: { status: "running" },
    });
    if (updated.count === 0) return null;
    const row = await this.db.durableJob.findUniqueOrThrow({ where: { id: candidate.id } });
    return mapRow(row);
  }
}
