import { type ConstraintFinding, type OrgConfig, V1_ALLOWED_FORMATS } from "@aep/contracts";

export type ParsedMesh = {
  format: "stl" | "obj";
  vertexCount: number;
  boundsMm: { x: number; y: number; z: number } | null;
};

const STL = "model/stl";
const OBJ = "model/obj";

export function detectFabricationFormat(filename: string, mimeType: string): "stl" | "obj" | null {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".stl") || mimeType === STL || mimeType === "application/sla") return "stl";
  if (lower.endsWith(".obj") || mimeType === OBJ || mimeType === "text/plain") {
    if (lower.endsWith(".obj")) return "obj";
  }
  if (mimeType === OBJ) return "obj";
  return null;
}

function boundsFromPoints(points: Array<[number, number, number]>): ParsedMesh["boundsMm"] {
  const first = points[0];
  if (!first) return null;
  let minX = first[0];
  let maxX = first[0];
  let minY = first[1];
  let maxY = first[1];
  let minZ = first[2];
  let maxZ = first[2];
  for (const [x, y, z] of points) {
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
    minZ = Math.min(minZ, z);
    maxZ = Math.max(maxZ, z);
  }
  return { x: maxX - minX, y: maxY - minY, z: maxZ - minZ };
}

function parseAsciiStl(text: string): ParsedMesh {
  const points: Array<[number, number, number]> = [];
  for (const line of text.split(/\r?\n/)) {
    const match = line.trim().match(/^vertex\s+([-\d.eE+]+)\s+([-\d.eE+]+)\s+([-\d.eE+]+)/);
    if (match) points.push([Number(match[1]), Number(match[2]), Number(match[3])]);
  }
  return { format: "stl", vertexCount: points.length, boundsMm: boundsFromPoints(points) };
}

function parseBinaryStl(bytes: Uint8Array): ParsedMesh {
  if (bytes.byteLength < 84) {
    return { format: "stl", vertexCount: 0, boundsMm: null };
  }
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const triangles = view.getUint32(80, true);
  const points: Array<[number, number, number]> = [];
  let offset = 84;
  for (let i = 0; i < triangles && offset + 50 <= bytes.byteLength; i += 1) {
    offset += 12;
    for (let v = 0; v < 3; v += 1) {
      points.push([
        view.getFloat32(offset, true),
        view.getFloat32(offset + 4, true),
        view.getFloat32(offset + 8, true),
      ]);
      offset += 12;
    }
    offset += 2;
  }
  return { format: "stl", vertexCount: points.length, boundsMm: boundsFromPoints(points) };
}

function parseObj(text: string): ParsedMesh {
  const points: Array<[number, number, number]> = [];
  for (const line of text.split(/\r?\n/)) {
    const match = line.trim().match(/^v\s+([-\d.eE+]+)\s+([-\d.eE+]+)\s+([-\d.eE+]+)/);
    if (match) points.push([Number(match[1]), Number(match[2]), Number(match[3])]);
  }
  return { format: "obj", vertexCount: points.length, boundsMm: boundsFromPoints(points) };
}

export function parseFabricationFile(input: {
  filename: string;
  mimeType: string;
  bytes: Uint8Array;
}): { mesh: ParsedMesh | null; findings: ConstraintFinding[] } {
  const format = detectFabricationFormat(input.filename, input.mimeType);
  if (!format) {
    return {
      mesh: null,
      findings: [
        {
          check: "allowed_format",
          result: "unsupported",
          reason: "v1 accepts STL and OBJ only.",
          source: "org.allowedFormats",
        },
      ],
    };
  }

  const text = new TextDecoder().decode(input.bytes);
  const mesh =
    format === "obj"
      ? parseObj(text)
      : text.trimStart().startsWith("solid")
        ? parseAsciiStl(text)
        : parseBinaryStl(input.bytes);

  return {
    mesh,
    findings: [
      {
        check: "allowed_format",
        result: "pass",
        reason: `${format.toUpperCase()} is an accepted v1 format.`,
        source: "org.allowedFormats",
      },
    ],
  };
}

export function checkFabricationConstraints(input: {
  mesh: ParsedMesh | null;
  org: Pick<OrgConfig, "allowedFormats" | "machines">;
}): ConstraintFinding[] {
  const findings: ConstraintFinding[] = [];
  if (!input.mesh) {
    findings.push({
      check: "allowed_format",
      result: "unsupported",
      reason: "No mesh. v1 accepts STL and OBJ only.",
      source: "org.allowedFormats",
    });
    return findings;
  }

  if (
    !input.org.allowedFormats.some((item) =>
      V1_ALLOWED_FORMATS.includes(item as (typeof V1_ALLOWED_FORMATS)[number]),
    )
  ) {
    findings.push({
      check: "allowed_format",
      result: "unsupported",
      reason: "OrgConfig allowedFormats does not include the v1 STL/OBJ set.",
      source: "org.allowedFormats",
    });
  }

  const machine = input.org.machines[0];
  if (!machine) {
    findings.push({
      check: "build_envelope",
      result: "needs_review",
      reason: "Machine envelope is not configured. Do not infer dimensions from the model.",
      source: "org.machines",
    });
    return findings;
  }

  if (!input.mesh.boundsMm) {
    findings.push({
      check: "build_envelope",
      result: "needs_review",
      reason: "Could not read mesh bounds.",
      source: "org.machines",
    });
    return findings;
  }

  const fits =
    input.mesh.boundsMm.x <= machine.envelopeMm.x &&
    input.mesh.boundsMm.y <= machine.envelopeMm.y &&
    (machine.envelopeMm.z == null || input.mesh.boundsMm.z <= machine.envelopeMm.z);

  findings.push({
    check: "build_envelope",
    result: fits ? "pass" : "needs_review",
    reason: fits
      ? "Mesh bounds fit the configured envelope."
      : "Mesh bounds exceed the configured envelope.",
    source: `org.machines.${machine.id}`,
  });
  return findings;
}
