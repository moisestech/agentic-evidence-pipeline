/**
 * Optional Trigger.dev project config.
 * Install `@trigger.dev/sdk` and point `dirs` at `packages/jobs/src/trigger` when deploying.
 * Offline CI uses `@aep/jobs` DurableRunner — no Trigger cloud credential required.
 */
export default {
  project: "proj_aep_local",
  runtime: "node",
  logLevel: "info",
  maxDuration: 300,
  retries: {
    enabledInDev: true,
    default: {
      maxAttempts: 3,
      minTimeoutInMs: 500,
      maxTimeoutInMs: 30_000,
      factor: 1.8,
      randomize: false,
    },
  },
  dirs: ["./packages/jobs/src/trigger"],
};
