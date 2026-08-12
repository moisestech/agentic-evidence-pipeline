import { randomUUID } from "node:crypto";
import {
  type EvidenceItem,
  hashContent,
  normalizeEvidenceText,
  type Source,
  type SourceKind,
  type Visibility,
} from "@aep/contracts";

export type RawDocument = {
  locator: string;
  revision: string;
  text: string;
  visibility?: Visibility;
  metadata?: Record<string, string>;
};

export type ConnectorResult = {
  source: Source;
  evidence: EvidenceItem[];
};

export type ConnectorContext = {
  tenantId: string;
  retrievedAt?: string;
};

function nowIso(override?: string): string {
  return override ?? new Date().toISOString();
}

/**
 * Shared normalize + hash path for every connector.
 * Deterministic: same tenant/source/revision/text → same content hashes.
 */
export function normalizeDocuments(
  kind: SourceKind,
  docs: readonly RawDocument[],
  ctx: ConnectorContext,
): ConnectorResult {
  if (docs.length === 0) {
    throw new Error(`connector_${kind}_empty_input`);
  }

  const retrievedAt = nowIso(ctx.retrievedAt);
  const combined = docs
    .map((doc) => `${doc.locator}\n${doc.revision}\n${normalizeEvidenceText(doc.text)}`)
    .join("\n---\n");
  const sourceId = randomUUID();
  const primary = docs[0];
  if (!primary) {
    throw new Error(`connector_${kind}_empty_input`);
  }

  const source: Source = {
    id: sourceId,
    tenantId: ctx.tenantId,
    kind,
    locator: primary.locator,
    visibility: primary.visibility ?? "public",
    revision: primary.revision,
    contentHash: hashContent(combined),
    retrievedAt,
    status: "ready",
    lastErrorCode: null,
  };

  const evidence: EvidenceItem[] = docs.map((doc) => {
    const normalized = normalizeEvidenceText(doc.text);
    return {
      id: randomUUID(),
      sourceId,
      tenantId: ctx.tenantId,
      text: normalized,
      contentHash: hashContent(`${doc.revision}\n${normalized}`),
      visibility: doc.visibility ?? "public",
      sourceRevision: doc.revision,
      createdAt: retrievedAt,
    };
  });

  return { source, evidence };
}

export function collectGithubFixture(
  docs: readonly RawDocument[],
  ctx: ConnectorContext,
): ConnectorResult {
  return normalizeDocuments("github", docs, ctx);
}

export function collectHttpMarkdownFixture(
  docs: readonly RawDocument[],
  ctx: ConnectorContext,
): ConnectorResult {
  return normalizeDocuments("http_markdown", docs, ctx);
}

export function collectCsvFixture(
  docs: readonly RawDocument[],
  ctx: ConnectorContext,
): ConnectorResult {
  return normalizeDocuments("csv", docs, ctx);
}

/**
 * Collect the seeded partner-readiness fixture pack (public/synthetic only).
 */
export function collectDemoFixturePack(ctx: ConnectorContext): ConnectorResult[] {
  const github = collectGithubFixture(
    [
      {
        locator: "fixture://github/partner-org/README.md",
        revision: "gh-rev-1",
        text: `# Partner Org

HTTPS is enforced on the public site.
Accessibility statement is linked from the footer.
`,
      },
    ],
    ctx,
  );

  const markdown = collectHttpMarkdownFixture(
    [
      {
        locator: "fixture://http/partner-org/digital-readiness.md",
        revision: "web-rev-1",
        text: `## Digital readiness

The organization publishes an open data inventory CSV and documents backup contacts.
`,
      },
    ],
    ctx,
  );

  const csv = collectCsvFixture(
    [
      {
        locator: "fixture://csv/inventory.csv",
        revision: "csv-rev-1",
        text: `system,owner,public
website,comms,yes
crm,ops,no
`,
      },
    ],
    ctx,
  );

  return [github, markdown, csv];
}

export const PACKAGE_STATUS = "connectors-v0.0.1" as const;
