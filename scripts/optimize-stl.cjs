/* eslint-disable */
// One-off: decimate a binary STL down to a web-friendly triangle budget.
//   node scripts/optimize-stl.cjs <in.stl> <out.stl> <targetTris>
const fs = require('fs');
const { MeshoptSimplifier } = require('meshoptimizer');

function parseBinarySTL(buf) {
  const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  const triCount = dv.getUint32(80, true);
  const expected = 84 + triCount * 50;
  if (expected !== buf.byteLength) {
    throw new Error(`Not a binary STL (expected ${expected} bytes, got ${buf.byteLength})`);
  }
  const positions = new Float32Array(triCount * 9);
  let o = 84;
  for (let t = 0; t < triCount; t++) {
    o += 12; // skip stored normal
    for (let v = 0; v < 9; v++) {
      positions[t * 9 + v] = dv.getFloat32(o, true);
      o += 4;
    }
    o += 2; // attribute byte count
  }
  return { positions, triCount };
}

// Weld coincident vertices -> indexed mesh.
function weld(positions) {
  const grid = 1e4; // quantization (units of 1/grid)
  const map = new Map();
  const verts = [];
  const indices = new Uint32Array(positions.length / 3);
  for (let i = 0; i < positions.length; i += 3) {
    const x = positions[i],
      y = positions[i + 1],
      z = positions[i + 2];
    const key =
      Math.round(x * grid) + '|' + Math.round(y * grid) + '|' + Math.round(z * grid);
    let idx = map.get(key);
    if (idx === undefined) {
      idx = verts.length / 3;
      map.set(key, idx);
      verts.push(x, y, z);
    }
    indices[i / 3] = idx;
  }
  return { vertices: new Float32Array(verts), indices };
}

function faceNormals(positions) {
  // positions: non-indexed triangle soup. Returns Float32Array same length holding per-vertex (face) normals.
  const normals = new Float32Array(positions.length);
  for (let i = 0; i < positions.length; i += 9) {
    const ax = positions[i], ay = positions[i + 1], az = positions[i + 2];
    const bx = positions[i + 3], by = positions[i + 4], bz = positions[i + 5];
    const cx = positions[i + 6], cy = positions[i + 7], cz = positions[i + 8];
    const ux = bx - ax, uy = by - ay, uz = bz - az;
    const vx = cx - ax, vy = cy - ay, vz = cz - az;
    let nx = uy * vz - uz * vy;
    let ny = uz * vx - ux * vz;
    let nz = ux * vy - uy * vx;
    const len = Math.hypot(nx, ny, nz) || 1;
    nx /= len; ny /= len; nz /= len;
    for (let k = 0; k < 9; k += 3) {
      normals[i + k] = nx; normals[i + k + 1] = ny; normals[i + k + 2] = nz;
    }
  }
  return normals;
}

function writeBinarySTL(positions, normals) {
  const triCount = positions.length / 9;
  const buf = Buffer.alloc(84 + triCount * 50);
  buf.writeUInt32LE(triCount, 80);
  let o = 84;
  for (let t = 0; t < triCount; t++) {
    const p = t * 9;
    buf.writeFloatLE(normals[p], o); buf.writeFloatLE(normals[p + 1], o + 4); buf.writeFloatLE(normals[p + 2], o + 8);
    o += 12;
    for (let v = 0; v < 9; v++) {
      buf.writeFloatLE(positions[p + v], o);
      o += 4;
    }
    o += 2;
  }
  return buf;
}

(async () => {
  const [, , inPath, outPath, targetArg] = process.argv;
  const targetTris = parseInt(targetArg, 10) || 120000;

  const raw = fs.readFileSync(inPath);
  const { positions, triCount } = parseBinarySTL(raw);
  console.log(`${inPath}: ${triCount.toLocaleString()} triangles`);

  if (triCount <= targetTris) {
    console.log('  already under budget — copying as-is');
    fs.writeFileSync(outPath, raw);
    return;
  }

  console.log('  welding…');
  const { vertices, indices } = weld(positions);
  console.log(`  ${(vertices.length / 3).toLocaleString()} unique verts`);

  await MeshoptSimplifier.ready;
  const targetIndexCount = targetTris * 3;
  const [simplified, error] = MeshoptSimplifier.simplify(
    indices,
    vertices,
    3,
    targetIndexCount,
    0.05,
    ['LockBorder']
  );
  console.log(`  simplified to ${(simplified.length / 3).toLocaleString()} tris (err ${error.toFixed(4)})`);

  // expand back to non-indexed triangle soup
  const out = new Float32Array(simplified.length * 3);
  for (let i = 0; i < simplified.length; i++) {
    const vi = simplified[i] * 3;
    out[i * 3] = vertices[vi];
    out[i * 3 + 1] = vertices[vi + 1];
    out[i * 3 + 2] = vertices[vi + 2];
  }
  const normals = faceNormals(out);
  const buf = writeBinarySTL(out, normals);
  fs.writeFileSync(outPath, buf);
  console.log(`  wrote ${outPath} — ${(buf.length / 1e6).toFixed(2)} MB`);
})();
