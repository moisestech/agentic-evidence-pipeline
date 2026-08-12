import { describe, expect, test } from "bun:test";
import { embedTextOffline } from "../src/embed";
import { reciprocalRankFusion } from "../src/search";

describe("embedTextOffline", () => {
  test("is deterministic and unit-length", () => {
    const a = embedTextOffline("HTTPS is enforced");
    const b = embedTextOffline("HTTPS is enforced");
    expect(a).toEqual(b);
    const norm = Math.sqrt(a.reduce((sum, v) => sum + v * v, 0));
    expect(norm).toBeCloseTo(1, 5);
  });
});

describe("reciprocalRankFusion", () => {
  test("prefers items appearing in both lists and breaks ties by evidenceId", () => {
    const lexical = [
      {
        evidenceId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
        sourceRevision: "1",
        tenantId: "t",
        visibility: "public",
        text: "b",
        lexicalScore: 0.9,
        vectorScore: null,
        lexicalRank: 1,
        vectorRank: null,
      },
      {
        evidenceId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        sourceRevision: "1",
        tenantId: "t",
        visibility: "public",
        text: "a",
        lexicalScore: 0.5,
        vectorScore: null,
        lexicalRank: 2,
        vectorRank: null,
      },
    ];
    const vector = [
      {
        evidenceId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        sourceRevision: "1",
        tenantId: "t",
        visibility: "public",
        text: "a",
        lexicalScore: null,
        vectorScore: 0.8,
        lexicalRank: null,
        vectorRank: 1,
      },
    ];

    const hits = reciprocalRankFusion(lexical, vector, 5);
    expect(hits[0]?.evidenceId).toBe("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa");
    expect(hits[0]?.rank).toBe(1);
    expect(hits[0]?.fusedScore).toBeGreaterThan(hits[1]?.fusedScore ?? 0);
  });
});
