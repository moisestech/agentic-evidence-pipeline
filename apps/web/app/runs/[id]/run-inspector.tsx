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

const ACTOR_LABEL: Record<string, string> = {
  system: "SYS",
  model: "AI",
  human: "H",
  worker: "JOB",
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

  useEffect(() => { void params.then((p) => setRunId(p.id)); }, [params]);

  const load = useCallback(async () => {
    if (!runId) return;
    const res = await fetch(`/api/runs/${runId}`);
    const json = (await res.json()) as RunPayload & { error?: string };
    if (!res.ok) { setError(json.error ?? "load_failed"); return; }
    setData(json);
    setEditedSummary(json.assessment?.summary ?? "");
    setError(null);
  }, [runId]);

  useEffect(() => { void load(); }, [load]);

  async function decide(decision: "approve" | "edit" | "reject") {
    if (!runId || !tenantId) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/runs/${runId}/decide`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ tenantId, decision, comment, editedSummary: decision === "edit" ? editedSummary : undefined }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "decide_failed");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "decide_failed");
    } finally { setBusy(false); }
  }

  if (!data) return <main className="shell"><p className="mono quiet">{error ?? "Loading run…"}</p></main>;

  const unsupported = new Set(data.assessment?.unsupportedClaims ?? []);
  const approvalBlocked = !data.assessment || data.assessment.status === "insufficient_evidence" || data.assessment.evidenceIds.length === 0 || unsupported.size > 0;
  const cited = new Set(data.assessment?.evidenceIds ?? []);
  const confidence = data.assessment?.confidence ?? 0;

  return (
    <main className="shell inspector-shell">
      <header className="inspector-header">
        <div>
          <p className="eyebrow mono">Evidence control plane</p>
          <h1>Run inspector</h1>
          <p className="mono quiet meta">run {data.runId} · prompt={data.promptVersion} · model={data.model}</p>
        </div>
        <span className={`status-pill status-${data.status}`}>{data.status.replaceAll("_", " ")}</span>
      </header>

      <section className="signal-grid" aria-label="Run health">
        <Signal label="Confidence" value={`${Math.round(confidence * 100)}%`} />
        <Signal label="Evidence" value={`${data.assessment?.evidenceIds.length ?? 0}/${data.evidence.length}`} />
        <Signal label="Unsupported" value={String(unsupported.size)} danger={unsupported.size > 0} />
        <Signal label="Review" value={data.assessment?.requiresHumanReview ? "required" : "clear"} warning={Boolean(data.assessment?.requiresHumanReview)} />
      </section>

      <section className="pipeline-strip" aria-label="Decision pipeline">
        {["Sources", "Retrieve", "Assess", "Citation gate", "Human review", "Audit"].map((stage, index) => (
          <div className={`pipeline-stage ${index === 3 && unsupported.size > 0 ? "blocked" : ""}`} key={stage}>
            <span className="mono stage-index">{String(index + 1).padStart(2, "0")}</span>
            <strong>{stage}</strong>
          </div>
        ))}
      </section>

      <div className="inspector-grid">
        <section className="block panel assessment-panel">
          <p className="eyebrow mono">Decision artifact</p>
          <h2>Assessment</h2>
          {data.assessment ? (
            <>
              <div className="assessment-meta mono quiet">
                <span>{data.assessment.controlId}</span><span>{data.assessment.status}</span><span>confidence {data.assessment.confidence.toFixed(2)}</span>
              </div>
              <p className="body assessment-copy">{data.assessment.summary}</p>
              <div className="chips evidence-chips">
                {data.assessment.evidenceIds.map((id) => {
                  const bad = unsupported.has(id);
                  return <code key={id} className={bad ? "chip coral" : "chip cyan"}>{bad ? "! " : "E "}{id.slice(0, 8)}…</code>;
                })}
              </div>
              {unsupported.size > 0 ? (
                <div className="gate-blocked"><strong>Citation gate blocked</strong><span className="mono">{Array.from(unsupported).join(", ")}</span><p>Unsupported evidence cannot be approved or repaired by reviewer prose.</p></div>
              ) : (
                <div className="gate-clear"><strong>Citation gate clear</strong><p>Referenced evidence IDs resolve inside the retrieved evidence set.</p></div>
              )}
            </>
          ) : <p>No assessment yet.</p>}
        </section>

        {data.status === "needs_review" ? (
          <aside className="block panel review-panel">
            <p className="eyebrow mono">Human-in-the-loop</p>
            <h2>Review boundary</h2>
            {approvalBlocked ? (
              <div className="review-rule blocked"><span className="actor-token human">H</span><div><strong>Approval disabled</strong><p>Reject or investigate. Human review cannot override unresolved evidence.</p></div></div>
            ) : (
              <label className="editor-label">Revised summary
                <textarea value={editedSummary} onChange={(e) => setEditedSummary(e.target.value)} rows={4} className="comment" />
              </label>
            )}
            <textarea aria-label="Reviewer comment" value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Reviewer comment" rows={3} className="comment" />
            <div className="actions review-actions">
              <button type="button" className="mint" disabled={busy || approvalBlocked || !tenantId} onClick={() => void decide("approve")}>Approve</button>
              <button type="button" className="cyan-btn" disabled={busy || approvalBlocked || !tenantId || !editedSummary.trim()} onClick={() => void decide("edit")}>Edit + approve</button>
              <button type="button" className="coral-btn" disabled={busy || !tenantId} onClick={() => void decide("reject")}>Reject</button>
            </div>
          </aside>
        ) : null}
      </div>

      <section className="block panel">
        <div className="section-heading"><div><p className="eyebrow mono">Lineage</p><h2>Retrieved evidence</h2></div><span className="mono quiet">source revision → evidence → assessment</span></div>
        <div className="evidence-grid">
          {data.evidence.map((ev) => {
            const isCited = cited.has(ev.id);
            const isUnsupported = unsupported.has(ev.id);
            return (
              <article key={ev.id} className={`evidence-card ${isCited ? "is-cited" : ""} ${isUnsupported ? "is-unsupported" : ""}`}>
                <div className="evidence-card-top"><span className={`evidence-token ${isUnsupported ? "bad" : isCited ? "used" : ""}`}>E</span><div className="mono quiet"><strong>{ev.id.slice(0, 8)}…</strong><span>{ev.sourceRevision}</span><span>{ev.visibility}</span></div></div>
                <p className="body tight">{ev.text}</p>
                <span className="evidence-state mono">{isUnsupported ? "unsupported" : isCited ? "cited" : "retrieved"}</span>
              </article>
            );
          })}
        </div>
      </section>

      <section className="block panel">
        <div className="section-heading"><div><p className="eyebrow mono">Observability</p><h2>Event timeline</h2></div><span className="mono quiet">append-only decision history</span></div>
        <ol className="event-timeline">
          {data.events.map((ev, index) => (
            <li key={ev.id}>
              <span className={`actor-token ${ev.actorType}`}>{ACTOR_LABEL[ev.actorType] ?? ev.actorType.slice(0, 3).toUpperCase()}</span>
              <span className="event-line" />
              <div className="event-body"><div><span className="mono event-index">{String(index + 1).padStart(2, "0")}</span><strong>{ev.eventType.replaceAll("_", " ")}</strong></div><p className="mono quiet">{ev.createdAt} · {ev.actorType} · hash {ev.eventHash.slice(0, 12)}…</p></div>
            </li>
          ))}
        </ol>
      </section>
      {error ? <p className="mono error">{error}</p> : null}
    </main>
  );
}

function Signal({ label, value, danger, warning }: { label: string; value: string; danger?: boolean; warning?: boolean }) {
  return <div className={`signal ${danger ? "danger" : warning ? "warning" : ""}`}><span className="mono">{label}</span><strong>{value}</strong></div>;
}
