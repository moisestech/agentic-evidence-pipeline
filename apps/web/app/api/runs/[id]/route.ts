import { resumeRun } from "@aep/agent";
import { NextResponse } from "next/server";
import { requireDb } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const db = requireDb();
    const run = await db.assessmentRun.findUniqueOrThrow({
      where: { id },
      include: {
        controlAssessments: true,
        auditEvents: { orderBy: { createdAt: "asc" } },
        reviewDecisions: true,
      },
    });
    const resumed = await resumeRun(db, id);
    const hits = await db.evidenceItem.findMany({
      where: {
        tenantId: run.tenantId,
        visibility: { in: ["public", "staff"] },
      },
      take: 8,
      orderBy: { createdAt: "asc" },
    });
    await db.$disconnect();
    return NextResponse.json({
      ...resumed,
      promptVersion: run.promptVersion,
      model: run.model,
      traceId: run.traceId,
      evidence: hits.map((h) => ({
        id: h.id,
        text: h.text,
        sourceRevision: h.sourceRevision,
        visibility: h.visibility,
      })),
      events: run.auditEvents.map((e) => ({
        id: e.id,
        eventType: e.eventType,
        actorType: e.actorType,
        createdAt: e.createdAt,
        eventHash: e.eventHash,
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "run_not_found";
    return NextResponse.json({ error: message }, { status: 404 });
  }
}
