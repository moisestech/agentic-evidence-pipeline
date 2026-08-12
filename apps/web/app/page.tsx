"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function HomePage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function startDemo() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/demo", { method: "POST" });
      const data = (await res.json()) as {
        runId?: string;
        tenantId?: string;
        error?: string;
      };
      if (!res.ok || !data.runId || !data.tenantId) {
        throw new Error(data.error ?? "Failed to start demo");
      }
      router.push(`/runs/${data.runId}?tenantId=${encodeURIComponent(data.tenantId)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "demo_failed");
      setLoading(false);
    }
  }

  return (
    <main className="shell">
      <p className="mono quiet brand">Agentic Evidence Pipeline</p>
      <h1>Run inspector</h1>
      <p className="lede">
        Start a seeded partner-readiness assessment. The offline model deliberately cites a
        nonexistent evidence ID so you can see the citation gate fail closed and route to human
        review.
      </p>
      <button type="button" className="primary" onClick={startDemo} disabled={loading}>
        {loading ? "Starting…" : "Start invalid-citation demo"}
      </button>
      {error ? (
        <p className="mono error">
          {error}
          <br />
          Requires DATABASE_URL and Postgres (`bun run db:up && bun run db:migrate`).
        </p>
      ) : null}
    </main>
  );
}
