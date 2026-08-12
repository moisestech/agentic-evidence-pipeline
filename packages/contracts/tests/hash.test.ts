import { describe, expect, test } from "bun:test";
import { hashContent, normalizeEvidenceText } from "../src/index";

describe("normalizeEvidenceText + hashContent", () => {
  test("normalizes CRLF and trailing spaces before hashing", () => {
    const a = hashContent(normalizeEvidenceText("line one  \r\nline two\r\n"));
    const b = hashContent(normalizeEvidenceText("line one\nline two\n"));
    expect(a).toBe(b);
  });

  test("produces 64-char sha256 hex", () => {
    expect(hashContent("hello")).toMatch(/^[a-f0-9]{64}$/);
  });
});
