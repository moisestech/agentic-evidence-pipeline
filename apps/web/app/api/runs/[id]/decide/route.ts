import { decideReview } from "@aep/agent";
import { NextResponse } from "next/server";
import { requireDb } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const body = (await request.json()) as {
      tenantId: string;
      decision: "approve" | "edit" | "reject";
      comment?: string;
      editedSummary?: string;
    };
    const db = requireDb();
    const result = await decideReview(db, {
      runId: id,
      tenantId: body.tenantId,
      decision: body.decision,
      reviewerId: "ui-reviewer",
      ...(body.comment !== undefined ? { comment: body.comment } : {}),
      ...(body.editedSummary !== undefined ? { editedSummary: body.editedSummary } : {}),
    });
    await db.$disconnect();
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "decide_failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
