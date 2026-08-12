import { runAssessment } from "@aep/agent";
import { seedDemoEvidence } from "@aep/retrieval";
import { NextResponse } from "next/server";
import { requireDb } from "@/lib/db";

export async function POST() {
  try {
    const db = requireDb();
    const seeded = await seedDemoEvidence(db, {
      tenantSlug: `ui-${Date.now()}`,
      tenantName: "UI Demo Tenant",
    });
    const result = await runAssessment(db, {
      tenantId: seeded.tenantId,
      idempotencyKey: `ui-${Date.now()}`,
      fabricateInvalidCitation: true,
    });
    await db.$disconnect();
    return NextResponse.json({ tenantId: seeded.tenantId, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "demo_failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
