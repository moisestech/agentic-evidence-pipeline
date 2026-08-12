import { describe, expect, test } from "bun:test";
import {
  collectCsvFixture,
  collectDemoFixturePack,
  collectGithubFixture,
  collectHttpMarkdownFixture,
  normalizeDocuments,
} from "../src/index";

const tenantId = "11111111-1111-4111-8111-111111111111";
const retrievedAt = "2026-08-12T12:00:00.000Z";

describe("normalizeDocuments", () => {
  test("hashes normalized text stably across whitespace variants", () => {
    const a = normalizeDocuments(
      "github",
      [
        {
          locator: "fixture://a",
          revision: "1",
          text: "Hello world\r\n",
        },
      ],
      { tenantId, retrievedAt },
    );
    const b = normalizeDocuments(
      "github",
      [
        {
          locator: "fixture://a",
          revision: "1",
          text: "Hello world\n",
        },
      ],
      { tenantId, retrievedAt },
    );

    expect(a.source.contentHash).toBe(b.source.contentHash);
    expect(a.evidence[0]?.contentHash).toBe(b.evidence[0]?.contentHash);
    expect(a.evidence[0]?.text).toBe("Hello world");
  });

  test("rejects empty connector input", () => {
    expect(() => normalizeDocuments("csv", [], { tenantId })).toThrow("connector_csv_empty_input");
  });
});

describe("fixture connectors", () => {
  test("github, http_markdown, and csv connectors produce typed sources", () => {
    const github = collectGithubFixture(
      [{ locator: "fixture://gh", revision: "1", text: "repo evidence" }],
      { tenantId, retrievedAt },
    );
    const md = collectHttpMarkdownFixture(
      [{ locator: "fixture://md", revision: "1", text: "site evidence" }],
      { tenantId, retrievedAt },
    );
    const csv = collectCsvFixture([{ locator: "fixture://csv", revision: "1", text: "a,b\n1,2" }], {
      tenantId,
      retrievedAt,
    });

    expect(github.source.kind).toBe("github");
    expect(md.source.kind).toBe("http_markdown");
    expect(csv.source.kind).toBe("csv");
    expect(github.evidence).toHaveLength(1);
    expect(md.source.tenantId).toBe(tenantId);
    expect(csv.source.status).toBe("ready");
  });

  test("demo fixture pack returns three source kinds", () => {
    const pack = collectDemoFixturePack({ tenantId, retrievedAt });
    expect(pack).toHaveLength(3);
    expect(pack.map((item) => item.source.kind).sort()).toEqual(["csv", "github", "http_markdown"]);
    for (const item of pack) {
      expect(item.evidence.length).toBeGreaterThan(0);
      expect(item.source.contentHash.length).toBe(64);
    }
  });
});
