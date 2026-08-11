import type { AepPrismaClient } from "./client";

export class TenantBoundaryError extends Error {
  readonly code = "TENANT_BOUNDARY_VIOLATION";

  constructor(message: string) {
    super(message);
    this.name = "TenantBoundaryError";
  }
}

export function assertSameTenant(expectedTenantId: string, actualTenantId: string): void {
  if (expectedTenantId !== actualTenantId) {
    throw new TenantBoundaryError(
      `Cross-tenant access blocked (expected ${expectedTenantId}, got ${actualTenantId})`,
    );
  }
}

/**
 * Tenant-scoped evidence listing. Always filters by tenantId before returning rows.
 */
export async function listEvidenceForTenant(
  db: AepPrismaClient,
  tenantId: string,
  visibility: readonly string[] = ["public", "staff"],
) {
  return db.evidenceItem.findMany({
    where: {
      tenantId,
      visibility: { in: [...visibility] },
    },
    select: {
      id: true,
      tenantId: true,
      sourceId: true,
      visibility: true,
      contentHash: true,
      text: true,
    },
    orderBy: { createdAt: "asc" },
  });
}
