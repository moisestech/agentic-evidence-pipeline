import { z } from "zod";

export const fabricationChannelSchema = z.enum(["web", "whatsapp"]);
export type FabricationChannel = z.infer<typeof fabricationChannelSchema>;

export const fabricationJobIntakeSchema = z.object({
  intakeKey: z.string().min(1),
  orgId: z.string().min(1),
  channel: fabricationChannelSchema,
  submittedAt: z.string().datetime(),
  client: z.object({
    ref: z.string().min(1),
  }),
  artifact: z.object({
    filename: z.string().min(1),
    mimeType: z.string().min(1),
    sizeBytes: z.number().int().nonnegative(),
    storageRef: z.string().min(1),
  }),
  requested: z
    .object({
      material: z.string().optional(),
      dimensionsMm: z
        .object({
          x: z.number().positive(),
          y: z.number().positive(),
          z: z.number().positive().optional(),
        })
        .optional(),
      quantity: z.number().int().positive().optional(),
      neededBy: z.string().optional(),
    })
    .optional(),
  notes: z.string().optional(),
});

export type FabricationJobIntake = z.infer<typeof fabricationJobIntakeSchema>;

export const constraintResultSchema = z.enum(["pass", "needs_review", "unsupported"]);
export type ConstraintResult = z.infer<typeof constraintResultSchema>;

export const constraintFindingSchema = z.object({
  check: z.string().min(1),
  result: constraintResultSchema,
  reason: z.string().min(1),
  source: z.string().min(1),
});

export type ConstraintFinding = z.infer<typeof constraintFindingSchema>;

export const stagedCrmMutationSchema = z.object({
  table: z.string().min(1),
  mergeOn: z.array(z.string().min(1)).min(1),
  fields: z.record(z.string(), z.unknown()),
});

export type StagedCrmMutation = z.infer<typeof stagedCrmMutationSchema>;

export const V1_ALLOWED_FORMATS = ["model/stl", "model/obj"] as const;

export const orgConfigSchema = z.object({
  orgId: z.string().min(1),
  allowedFormats: z.array(z.string().min(1)).min(1),
  machines: z.array(
    z.object({
      id: z.string().min(1),
      envelopeMm: z.object({
        x: z.number().positive(),
        y: z.number().positive(),
        z: z.number().positive().optional(),
      }),
      materials: z.array(z.string().min(1)),
    }),
  ),
  crm: z.object({
    baseId: z.string().min(1),
    tableId: z.string().min(1),
    fieldMap: z.record(z.string(), z.string()),
  }),
  approvers: z.array(z.string().min(1)),
});

export type OrgConfig = z.infer<typeof orgConfigSchema>;

/** Placeholder DCC config. Machine numbers and Airtable IDs stay empty until Moises supplies them. */
export const DCC_ORG_CONFIG_DRAFT: Pick<OrgConfig, "orgId" | "allowedFormats"> = {
  orgId: "dcc",
  allowedFormats: [...V1_ALLOWED_FORMATS],
};
