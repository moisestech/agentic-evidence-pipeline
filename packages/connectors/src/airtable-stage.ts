import type { ConstraintFinding, OrgConfig, StagedCrmMutation } from "@aep/contracts";

/**
 * TICKET-03 — stage an Airtable upsert. Never writes.
 * Blocked until org.crm names a base, table, and writable field map.
 */
export function stageAirtableUpsert(input: {
  org: Pick<OrgConfig, "crm">;
  fields: Record<string, unknown>;
  approved: boolean;
}): { mutation: StagedCrmMutation | null; findings: ConstraintFinding[] } {
  const { crm } = input.org;
  if (!crm.baseId || !crm.tableId || Object.keys(crm.fieldMap).length === 0) {
    return {
      mutation: null,
      findings: [
        {
          check: "airtable_fields",
          result: "needs_review",
          reason: "TICKET-03 is blocked until base, table, and writable fields are named.",
          source: "org.crm",
        },
      ],
    };
  }

  if (!input.approved) {
    return {
      mutation: null,
      findings: [
        {
          check: "human_approval",
          result: "needs_review",
          reason: "Airtable writes require human approval. Zero external writes until then.",
          source: "approval",
        },
      ],
    };
  }

  const mapped: Record<string, unknown> = {};
  for (const [logical, field] of Object.entries(crm.fieldMap)) {
    if (logical in input.fields) mapped[field] = input.fields[logical];
  }

  return {
    mutation: {
      table: crm.tableId,
      mergeOn: ["intakeKey"],
      fields: mapped,
    },
    findings: [
      {
        check: "airtable_stage",
        result: "pass",
        reason: "Staged only. Persist through the approval gate — this function does not write.",
        source: "org.crm",
      },
    ],
  };
}
