import { Suspense } from "react";
import { RunInspector } from "./run-inspector";

export default function RunInspectorPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense
      fallback={
        <main className="shell">
          <p className="mono quiet">Loading run…</p>
        </main>
      }
    >
      <RunInspector params={params} />
    </Suspense>
  );
}
