"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

type RunPayload = {
  runId: string;
  status: string;
  promptVersion?: string;
  model?: string;
  traceId?: string;
  assessment: {
    controlId: string;
    status: string;
    confidence: number;
    summary: string;
    evidenceIds: string[];
    unsupportedClaims: string[];
    requiresHumanReview: boolean;
  } | null;
  evidence: Array<{
    id: string;
    text: string;
    sourceRevision: string;
    visibility: string;
  }>;
  events: Array<{
    id: string;
    eventType: string;
    actorType: string;
    createdAt: string;
    eventHash: string;
  }>;
};

export function RunInspector({ params }: { params: Promise<{ id: string }> }) {
  const search = useSearchParams();
  const tenantId = search.get("tenantId") ?? "";
  const [runId, setRunId] = useState<string>("");
  const [data, setData] = useState<RunPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [editedSummary, setEditedSummary] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void params.then((p) => setRunId(p.id));
  }, [params]);

  const load = useCallback(async () => {
    if (!runId) return;
    const res = await fetch(`/api/runs/${runId}`);
    const json = (await res.json()) as RunPayload & { error?: string };
    if (!res.ok) {
      setError(json.error ?? "load_failed");
      return;
    }
    setData(json);
    setEditedSummary(json.assessment?.summary ?? "");
    setError(null);
  }, [runId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function decide(decision: "approve" | "edit" | "reject") {
    if (!runId || !tenantId) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/runs/${runId}/decide`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          tenantId,
          decision,
          comment,
          editedSummary: decision === "edit" ? editedSummary : undefined,
        }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "decide_failed");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "decide_failed");
    } finally {
      setBusy(false);
    }
  }

  if (!data) {
    return (
      <main className="shell">
        <p className="mono quiet">{error ?? "Loading run…"}</p>
      </main>
    );
  }

  const unsupported = new Set(data.assessment?.unsupportedClaims ?? []);
  const approvalBlocked =
    !data.assessment ||
    data.assessment.status === "insufficient_evidence" ||
    data.assessment.evidenceIds.length === 0 ||
    unsupported.size > 0;

  return (
    <main className="shell">
      <p className="mono quiet">run {data.runId}</p>
      <h1>Run inspector</h1>
      <p className="mono quiet meta">
        status=<span className="ink">{data.status}</span> · prompt={data.promptVersion} · model=
        {data.model}
      </p>

      <section className="block">
        <h2>Assessment</h2>
        {data.assessment ? (
          <div className="rule">
            <p className="mono quiet">
              {data.assessment.controlId} · {data.assessment.status} · confidence{" "}
              {data.assessment.confidence.toFixed(2)}
            </p>
            <p className="body">{data.assessment.summary}</p>
            <div className="chips">
              {data.assessment.evidenceIds.map((id) => {
                const bad = unsupported.has(id);
                return (
                  <code key={id} className={bad ? "chip coral" : "chip cyan"}>
                    {id.slice(0, 8)}…
                  </code>
                );
              })}
            </div>
            {data.assessment.unsupportedClaims.length > 0 ? (
              <p className="mono coral-text">
                unsupported: {data.assessment.unsupportedClaims.join(", ")}
              </p>
            ) : null}
          </div>
        ) : (
          <p>No assessment yet.</p>
        )}
      </section>

      <section className="block">
        <h2>Retrieved evidence</h2>
        {data.evidence.map((ev) => (
          <article key={ev.id} className="evidence">
            <p className="mono quiet">
              {ev.sourceRevision} · {ev.visibility} · {ev.id.slice(0, 8)}…
            </p>
            <p className="body tight">{ev.text}</p>
          </article>
        ))}
      </section>

      {data.status === "needs_review" ? (
        <section className="block">
          <h2>Human review</h2>
          {approvalBlocked ? (
            <p className="coral-text" role="status">
              Unresolved evidence blocks approval and editing. Reject this assessment, or leave it
              pending while the evidence is investigated. A comment cannot override the citation
              gate.
            </p>
          ) : (
            <label>
              Revised summary (for Edit and approve)
              <textarea
                value={editedSummary}
                onChange={(e) => setEditedSummary(e.target.value)}
                rows={3}
                className="comment"
              />
            </label>
          )}
          <textarea
            aria-label="Reviewer comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Reviewer comment"
            rows={3}
            className="comment"
          />
          <div className="actions">
            <button
              type="button"
              className="mint"
              disabled={busy || approvalBlocked || !tenantId}
              onClick={() => void decide("approve")}
            >
              Approve
            </button>
            <button
              type="button"
              className="cyan-btn"
              disabled={busy || approvalBlocked || !tenantId || !editedSummary.trim()}
              onClick={() => void decide("edit")}
            >
              Edit and approve
            </button>
            <button
              type="button"
              className="coral-btn"
              disabled={busy || !tenantId}
              onClick={() => void decide("reject")}
            >
              Reject
            </button>
          </div>
        </section>
      ) : null}

      <section className="block">
        <h2>Event timeline</h2>
        <ul className="timeline">
          {data.events.map((ev) => (
            <li key={ev.id} className="mono quiet">
              {ev.createdAt} · {ev.actorType} · {ev.eventType} · {ev.eventHash.slice(0, 12)}…
            </li>
          ))}
        </ul>
      </section>
      {error ? <p className="mono error">{error}</p> : null}
    </main>
  );
}
