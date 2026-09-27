import { describe, expect, test } from "bun:test";
import { stageAirtableUpsert } from "../src/airtable-stage";

describe("airtable stage", () => {
  test("blocks when CRM fields are unnamed", () => {
    const { mutation, findings } = stageAirtableUpsert({
      org: { crm: { baseId: "", tableId: "", fieldMap: {} } },
      fields: { intakeKey: "intake-1" },
      approved: true,
    });
    expect(mutation).toBeNull();
    expect(findings[0]?.check).toBe("airtable_fields");
    expect(findings[0]?.result).toBe("needs_review");
  });

  test("blocks writes without approval even when fields exist", () => {
    const { mutation, findings } = stageAirtableUpsert({
      org: {
        crm: {
          baseId: "appTest",
          tableId: "tblTest",
          fieldMap: { intakeKey: "Intake Key" },
        },
      },
      fields: { intakeKey: "intake-1" },
      approved: false,
    });
    expect(mutation).toBeNull();
    expect(findings[0]?.check).toBe("human_approval");
  });
});
