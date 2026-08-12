import { describe, expect, test } from "bun:test";
import { assessControlPromptVersionLabel, getPrompt, listPrompts, renderPrompt } from "../src";

describe("prompt registry", () => {
  test("loads versioned assess-control prompt with checksum", () => {
    const prompts = listPrompts();
    expect(prompts.length).toBeGreaterThan(0);
    const p = getPrompt("assess-control", "1.0.0");
    expect(p.checksum).toHaveLength(64);
    expect(p.system).toContain("allowlisted");
    expect(assessControlPromptVersionLabel()).toBe("assess-control@1.0.0");
  });

  test("renders user template without mutating registry entry", () => {
    const p = getPrompt("assess-control", "1.0.0");
    const rendered = renderPrompt(p, {
      controlId: "ctrl-1",
      requirement: "HTTPS required",
      evidenceIds: "e1",
      evidenceText: "TLS is enforced",
    });
    expect(rendered.user).toContain("ctrl-1");
    expect(rendered.user).toContain("TLS is enforced");
    expect(p.userTemplate).toContain("{{controlId}}");
  });
});
