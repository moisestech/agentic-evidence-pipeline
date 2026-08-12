import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export type PromptDecoding = {
  temperature: number;
  maxOutputTokens: number;
};

export type PromptDefinition = {
  id: string;
  version: string;
  model: string;
  decoding: PromptDecoding;
  system: string;
  userTemplate: string;
  checksum: string;
  path: string;
};

export type RenderedPrompt = {
  prompt: PromptDefinition;
  system: string;
  user: string;
};

const PROMPTS_DIR = join(dirname(fileURLToPath(import.meta.url)), "../prompts");

function checksumOf(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

function parsePromptFile(path: string, raw: string): PromptDefinition {
  const data = JSON.parse(raw) as Omit<PromptDefinition, "checksum" | "path">;
  if (!data.id || !data.version || !data.system || !data.userTemplate) {
    throw new Error(`invalid_prompt_file:${path}`);
  }
  return {
    ...data,
    decoding: data.decoding ?? { temperature: 0, maxOutputTokens: 512 },
    model: data.model ?? "unspecified",
    checksum: checksumOf(raw),
    path,
  };
}

let cache: Map<string, PromptDefinition> | null = null;

function loadAll(): Map<string, PromptDefinition> {
  if (cache) return cache;
  const map = new Map<string, PromptDefinition>();
  for (const file of readdirSync(PROMPTS_DIR)) {
    if (!file.endsWith(".json")) continue;
    const path = join(PROMPTS_DIR, file);
    const raw = readFileSync(path, "utf8");
    const prompt = parsePromptFile(path, raw);
    const key = `${prompt.id}@${prompt.version}`;
    if (map.has(key)) {
      throw new Error(`duplicate_prompt_version:${key}`);
    }
    map.set(key, prompt);
  }
  cache = map;
  return map;
}

/** Clear registry cache (tests only). */
export function resetPromptRegistryCache(): void {
  cache = null;
}

export function listPrompts(): PromptDefinition[] {
  return [...loadAll().values()].sort((a, b) =>
    `${a.id}@${a.version}`.localeCompare(`${b.id}@${b.version}`),
  );
}

export function getPrompt(id: string, version: string): PromptDefinition {
  const prompt = loadAll().get(`${id}@${version}`);
  if (!prompt) throw new Error(`prompt_not_found:${id}@${version}`);
  return prompt;
}

export function getLatestPrompt(id: string): PromptDefinition {
  const matches = listPrompts().filter((p) => p.id === id);
  const latest = matches.sort((a, b) =>
    b.version.localeCompare(a.version, undefined, { numeric: true }),
  )[0];
  if (!latest) throw new Error(`prompt_not_found:${id}`);
  return latest;
}

export function renderPrompt(
  prompt: PromptDefinition,
  vars: Record<string, string>,
): RenderedPrompt {
  let user = prompt.userTemplate;
  for (const [key, value] of Object.entries(vars)) {
    user = user.replaceAll(`{{${key}}}`, value);
  }
  return { prompt, system: prompt.system, user };
}

/** Stable prompt id recorded on AssessmentRun.promptVersion */
export const DEFAULT_ASSESS_CONTROL_PROMPT = {
  id: "assess-control",
  version: "1.0.0",
} as const;

export function assessControlPromptVersionLabel(): string {
  const p = getPrompt(DEFAULT_ASSESS_CONTROL_PROMPT.id, DEFAULT_ASSESS_CONTROL_PROMPT.version);
  return `${p.id}@${p.version}`;
}
