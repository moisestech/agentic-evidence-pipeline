/**
 * Example Trigger.dev task registration (optional peer `@trigger.dev/sdk`).
 *
 * ```ts
 * import { task } from "@trigger.dev/sdk";
 * import {
 *   ASSESS_CONTROL_JOB,
 *   ASSESS_CONTROL_RETRY,
 *   runAssessControlJob,
 * } from "@aep/jobs/trigger";
 *
 * export const assessControlTask = task({
 *   id: ASSESS_CONTROL_JOB,
 *   retry: ASSESS_CONTROL_RETRY,
 *   run: runAssessControlJob,
 * });
 * ```
 *
 * Offline CI uses `DurableRunner` — no Trigger cloud credential required.
 * See `docs/adr/0006-trigger-durable-jobs.md`.
 */
export {};
