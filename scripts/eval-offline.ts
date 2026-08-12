#!/usr/bin/env bun
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { runOfflineEval } from "@aep/evals";

const report = runOfflineEval();
const dir = join(import.meta.dir, "../reports/offline");
mkdirSync(dir, { recursive: true });
const stamp = report.generatedAt.slice(0, 10);
const outPath = join(dir, `${stamp}-fake-provider.json`);
writeFileSync(outPath, `${JSON.stringify(report, null, 2)}\n`);

console.log(`offline eval report → ${outPath}`);
console.log(
  JSON.stringify(
    {
      caseCount: report.caseCount,
      hybridRecallAt5: Number(report.retrieval.hybrid.recallAt5.toFixed(3)),
      hybridMrr: Number(report.retrieval.hybrid.mrr.toFixed(3)),
      citationValidityRate: Number(report.citationValidityRate.toFixed(3)),
      humanReviewRate: Number(report.humanReviewRate.toFixed(3)),
      disclaimer: report.disclaimer,
    },
    null,
    2,
  ),
);
