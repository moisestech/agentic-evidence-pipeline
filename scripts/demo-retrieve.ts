#!/usr/bin/env bun
/**
 * Seed demo fixtures and print lexical / vector / hybrid retrieval for one query.
 * Requires DATABASE_URL and a running Postgres+pgvector (bun run db:up && bun run db:migrate).
 */
import { createPrismaClient } from "@aep/db";
import { retrieve, seedDemoEvidence } from "@aep/retrieval";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("demo:retrieve requires DATABASE_URL");
  process.exit(1);
}

const query =
  process.argv.slice(2).join(" ").trim() || "HTTPS accessibility digital readiness inventory";

const db = createPrismaClient(databaseUrl);

try {
  const seeded = await seedDemoEvidence(db, {
    tenantSlug: `demo-retrieve-${Date.now()}`,
    tenantName: "Demo Retrieve",
  });
  console.log(`seeded tenant=${seeded.tenantId} evidence=${seeded.evidenceCount}`);
  console.log(`query: ${query}\n`);

  for (const mode of ["lexical", "vector", "hybrid"] as const) {
    const hits = await retrieve(db, {
      tenantId: seeded.tenantId,
      query,
      mode,
      limit: 5,
      visibility: ["public", "staff"],
    });
    console.log(`== ${mode} ==`);
    if (hits.length === 0) {
      console.log("(no hits)\n");
      continue;
    }
    for (const hit of hits) {
      console.log(
        `#${hit.rank} fused=${hit.fusedScore.toFixed(4)} lex=${hit.lexicalScore ?? "-"} vec=${hit.vectorScore ?? "-"} rev=${hit.sourceRevision}`,
      );
      console.log(`  ${hit.text.slice(0, 120).replace(/\n/g, " ")}`);
      console.log(`  reason=${hit.reason}`);
    }
    console.log("");
  }

  await db.tenant.delete({ where: { id: seeded.tenantId } });
} finally {
  await db.$disconnect();
}
