# Eval reports

| Path | Meaning |
| --- | --- |
| `offline/*-fake-provider.json` | Deterministic harness metrics from `bun run eval:offline`. Not a live-model quality benchmark. |
| `live/` | Optional provider-backed reports only. Never committed as product quality claims. |

Regenerate the sample offline report after golden-set or prompt-registry changes:

```bash
bun run eval:offline
```
