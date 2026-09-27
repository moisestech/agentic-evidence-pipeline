import { describe, expect, test } from "bun:test";
import { DCC_ORG_CONFIG_DRAFT, fabricationJobIntakeSchema } from "../src/fabrication";

describe("fabrication contracts", () => {
  test("parses a valid intake", () => {
    const parsed = fabricationJobIntakeSchema.parse({
      intakeKey: "intake-1",
      orgId: "dcc",
      channel: "web",
      submittedAt: "2026-09-27T16:00:00.000Z",
      client: { ref: "client-ref-1" },
      artifact: {
        filename: "part.stl",
        mimeType: "model/stl",
        sizeBytes: 128,
        storageRef: "uploads/part.stl",
      },
    });
    expect(parsed.orgId).toBe("dcc");
  });

  test("DCC draft allows STL and OBJ only", () => {
    expect(DCC_ORG_CONFIG_DRAFT.allowedFormats).toEqual(["model/stl", "model/obj"]);
  });
});
