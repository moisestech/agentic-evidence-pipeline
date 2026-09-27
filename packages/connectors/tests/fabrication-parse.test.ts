import { describe, expect, test } from "bun:test";
import { checkFabricationConstraints, parseFabricationFile } from "../src/fabrication-parse";

const asciiStl = `solid cube
  facet normal 0 0 0
    outer loop
      vertex 0 0 0
      vertex 10 0 0
      vertex 0 20 0
    endloop
  endfacet
endsolid cube
`;

const obj = `v 0 0 0
v 5 0 0
v 0 8 0
f 1 2 3
`;

describe("fabrication parser", () => {
  test("parses ASCII STL bounds", () => {
    const { mesh, findings } = parseFabricationFile({
      filename: "cube.stl",
      mimeType: "model/stl",
      bytes: new TextEncoder().encode(asciiStl),
    });
    expect(findings[0]?.result).toBe("pass");
    expect(mesh?.format).toBe("stl");
    expect(mesh?.boundsMm).toEqual({ x: 10, y: 20, z: 0 });
  });

  test("parses OBJ bounds", () => {
    const { mesh } = parseFabricationFile({
      filename: "part.obj",
      mimeType: "model/obj",
      bytes: new TextEncoder().encode(obj),
    });
    expect(mesh?.format).toBe("obj");
    expect(mesh?.boundsMm).toEqual({ x: 5, y: 8, z: 0 });
  });

  test("rejects unsupported formats", () => {
    const { findings } = parseFabricationFile({
      filename: "part.3mf",
      mimeType: "model/3mf",
      bytes: new Uint8Array([1, 2, 3]),
    });
    expect(findings[0]?.result).toBe("unsupported");
  });

  test("envelope check waits when machines are not configured", () => {
    const findings = checkFabricationConstraints({
      mesh: { format: "stl", vertexCount: 3, boundsMm: { x: 10, y: 10, z: 1 } },
      org: { allowedFormats: ["model/stl", "model/obj"], machines: [] },
    });
    expect(
      findings.some((item) => item.check === "build_envelope" && item.result === "needs_review"),
    ).toBe(true);
  });
});
