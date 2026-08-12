import { describe, expect, test } from "bun:test";
import { ASSESS_CONTROL_JOB, DurableRunner, JobError, MemoryJobStore } from "../src";

describe("DurableRunner", () => {
  test("duplicate enqueue reuses the same job", async () => {
    const store = new MemoryJobStore();
    const runner = new DurableRunner({
      store,
      handlers: {
        [ASSESS_CONTROL_JOB]: async () => ({ ok: true }),
      },
    });

    const first = await runner.enqueue({
      tenantId: "t1",
      name: ASSESS_CONTROL_JOB,
      idempotencyKey: "same-key",
      payload: { n: 1 },
    });
    const second = await runner.enqueue({
      tenantId: "t1",
      name: ASSESS_CONTROL_JOB,
      idempotencyKey: "same-key",
      payload: { n: 2 },
    });

    expect(second.created).toBe(false);
    expect(second.job.id).toBe(first.job.id);
    expect(second.job.payload).toEqual({ n: 1 });
  });

  test("retryable failures exhaust attempts then dead-letter", async () => {
    let clock = 1_000;
    const store = new MemoryJobStore();
    let calls = 0;
    const runner = new DurableRunner({
      store,
      now: () => new Date(clock),
      sleep: async (ms) => {
        clock += ms;
      },
      handlers: {
        boom: async () => {
          calls += 1;
          throw new JobError("temporary", "retryable");
        },
      },
    });

    const { job } = await runner.enqueue({
      tenantId: "t1",
      name: "boom",
      idempotencyKey: "k1",
      payload: {},
      maxAttempts: 3,
    });

    let current = job;
    for (let i = 0; i < 6; i += 1) {
      const next = await runner.processNext();
      if (!next) {
        clock += 10_000;
        continue;
      }
      current = next;
      if (current.status === "dead_letter") break;
    }

    expect(calls).toBe(3);
    expect(current.status).toBe("dead_letter");
    expect(current.failureClass).toBe("retryable");
    expect(current.attemptCount).toBe(3);
  });

  test("terminal failure goes to DLQ immediately", async () => {
    const store = new MemoryJobStore();
    const runner = new DurableRunner({
      store,
      handlers: {
        bad: async () => {
          throw new JobError("fatal", "terminal");
        },
      },
    });

    await runner.enqueue({
      tenantId: "t1",
      name: "bad",
      idempotencyKey: "k2",
      payload: {},
      maxAttempts: 5,
    });
    const done = await runner.processNext();
    expect(done?.status).toBe("dead_letter");
    expect(done?.attemptCount).toBe(1);
    expect(done?.failureClass).toBe("terminal");
  });

  test("replay dead letter requeues and can succeed", async () => {
    let clock = 5_000;
    const store = new MemoryJobStore();
    let calls = 0;
    const runner = new DurableRunner({
      store,
      now: () => new Date(clock),
      sleep: async (ms) => {
        clock += ms;
      },
      handlers: {
        flaky: async () => {
          calls += 1;
          if (calls === 1) throw new JobError("injected", "terminal");
          return { recovered: true };
        },
      },
    });

    const { job } = await runner.enqueue({
      tenantId: "t1",
      name: "flaky",
      idempotencyKey: "k3",
      payload: {},
    });
    const failed = await runner.processNext();
    expect(failed?.status).toBe("dead_letter");

    const replayed = await runner.replayDeadLetter(job.id);
    expect(replayed.status).toBe("queued");
    expect(replayed.attemptCount).toBe(0);

    const succeeded = await runner.processNext();
    expect(succeeded?.status).toBe("succeeded");
    expect(succeeded?.result).toEqual({ recovered: true });
  });

  test("injected retryable failures then succeed", async () => {
    let clock = 9_000;
    const store = new MemoryJobStore();
    let calls = 0;
    const runner = new DurableRunner({
      store,
      now: () => new Date(clock),
      sleep: async (ms) => {
        clock += ms;
      },
      handlers: {
        [ASSESS_CONTROL_JOB]: async () => {
          calls += 1;
          if (calls < 3) throw new JobError("injected_retryable", "retryable");
          return { ok: true };
        },
      },
    });

    await runner.enqueue({
      tenantId: "t1",
      name: ASSESS_CONTROL_JOB,
      idempotencyKey: "inject",
      payload: { injectFailure: "retryable", injectFailTimes: 2 },
      maxAttempts: 5,
    });

    let status = "queued";
    for (let i = 0; i < 10; i += 1) {
      const next = await runner.processNext();
      if (!next) {
        clock += 10_000;
        continue;
      }
      status = next.status;
      if (status === "succeeded" || status === "dead_letter") break;
    }
    expect(status).toBe("succeeded");
    expect(calls).toBe(3);
  });
});
