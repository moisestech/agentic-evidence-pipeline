-- CreateTable
CREATE TABLE "DurableJob" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "payload" JSONB NOT NULL,
    "result" JSONB,
    "lastError" TEXT,
    "failureClass" TEXT,
    "nextAttemptAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DurableJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DurableJob_status_nextAttemptAt_idx" ON "DurableJob"("status", "nextAttemptAt");

-- CreateIndex
CREATE INDEX "DurableJob_tenantId_status_idx" ON "DurableJob"("tenantId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "DurableJob_tenantId_name_idempotencyKey_key" ON "DurableJob"("tenantId", "name", "idempotencyKey");

-- AddForeignKey
ALTER TABLE "DurableJob" ADD CONSTRAINT "DurableJob_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
