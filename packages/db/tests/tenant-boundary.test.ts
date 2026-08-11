import { describe, expect, test } from "bun:test";
import { assertSameTenant, TenantBoundaryError } from "../src/tenant";

describe("assertSameTenant", () => {
  test("allows matching tenant IDs", () => {
    expect(() => assertSameTenant("tenant-a", "tenant-a")).not.toThrow();
  });

  test("blocks cross-tenant access", () => {
    expect(() => assertSameTenant("tenant-a", "tenant-b")).toThrow(TenantBoundaryError);
  });
});
