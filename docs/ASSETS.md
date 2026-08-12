# Visual assets & diagrams checklist

Use this list when packaging the public README. **Do not invent screenshots or metrics.** Record demos only after the corresponding behavior and tests exist.

Shared palette: paper `#F0EEE5`, ink `#10110F`, quiet gray `#8D9088`, evidence cyan `#86D7E2`, exception coral `#E58B72`, soft mint `#B6E2BA`.

## Already in repo

| Asset | Path | Status |
| --- | --- | --- |
| Mark (citation brackets → approval) | [`docs/assets/aep-mark.svg`](./assets/aep-mark.svg) | done |
| Lockup (mark + wordmark) | [`docs/assets/aep-lockup.svg`](./assets/aep-lockup.svg) | done |
| Overview architecture Mermaid | README `#architecture` | done (code diagram) |
| Invalid-citation sequence Mermaid | README `#what-happens-when-the-model-is-wrong` | done (code diagram) |
| Run lifecycle state Mermaid | README `#run-lifecycle` | done (code diagram) |

## Still needed (README / social)

| # | Asset | Spec | When to create | Blocks |
| ---: | --- | --- | --- | --- |
| 1 | **Social preview** `docs/assets/social-preview.png` | 1280×640 PNG; paper background; lockup left; short promise + tiny architecture fragment; no fake metrics | Now (static design) | GitHub unfurl / LinkedIn |
| 2 | **Container architecture SVG** `docs/assets/architecture-containers.svg` | Export of Mermaid: web → API → agent → retrieval → Postgres / Trigger | After AEP-05/07 names stabilize | README depth + ARCHITECTURE.md |
| 3 | **Evidence lineage SVG** `docs/assets/evidence-lineage.svg` | source revision → evidence → retrieval → citation → review → audit event | After AEP-06/07 | Interview walkthrough |
| 4 | **Demo loop recording** `docs/assets/demo-review-flow.webp` | 18–25s real app capture: collect → retrieve → needs_review → approve → timeline | After AEP-07 + offline demo | README hero visual |
| 5 | **Invalid citation failure** `docs/assets/demo-invalid-citation.webp` | Provider returns fluent text + fake evidence ID; gate blocks; routes to review | After AEP-06 gate + UI | “What happens when the model is wrong?” |
| 6 | **Run inspector screenshot** `docs/assets/run-inspector.png` | Seeded fixture: status, prompt version, citations, latency/cost placeholders, event hashes | After AEP-10 | Evidence map |
| 7 | **Eval comparison screenshot** `docs/assets/eval-offline-report.png` | Lexical vs vector vs hybrid table from `eval:offline` | After AEP-09 | Evaluation section |
| 8 | **OpenGraph lockup variant** (optional) | Same as social preview with darker quiet-gray rule | Packaging week | Profile polish |

## Diagrams that stay Mermaid (source of truth)

Keep these as Mermaid in markdown; export SVG only when GitHub social/image presentation needs a static file.

1. Overview pipeline (README)
2. Invalid-citation sequence (README)
3. Run state machine (README)
4. Container view ([ARCHITECTURE.md](./ARCHITECTURE.md))
5. Evidence lineage ([ARCHITECTURE.md](./ARCHITECTURE.md))
6. Failure/replay sequence ([ARCHITECTURE.md](./ARCHITECTURE.md))

## Capture rules

- Seeded fixtures only; scrub tokens, emails, names, private URLs, browser chrome.
- Prefer animated WebP/GIF under ~5 MB for README loops.
- Every image needs meaningful alt text.
- README may reference an asset **only after the file exists** (no broken links).
- Social preview and SVGs may ship before demos; demos may not ship before tests.

## Suggested production order

1. Social preview PNG (can do anytime)
2. Keep Mermaid diagrams accurate as packages land
3. Invalid-citation WebP (AEP-06+)
4. Full review-flow WebP (AEP-07+)
5. Run inspector + eval screenshots (AEP-09/10)
6. Optional exported architecture/lineage SVGs for talks
