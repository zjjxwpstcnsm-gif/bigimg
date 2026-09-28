import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
const models = JSON.parse(await readFile("src/models/manifest.json", "utf8"));
await mkdir("public/models", { recursive: true });
for (const m of models) {
  const path = "public/" + m.modelUrl;
  try {
    const b = await readFile(path);
    if (createHash("sha256").update(b).digest("hex") === m.sha256) {
      console.log(m.id, "verified cache");
      continue;
    }
  } catch {}
  let last;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const r = await fetch(m.originalUrl, {
        signal: AbortSignal.timeout(240000),
      });
      if (!r.ok) throw new Error("HTTP " + r.status);
      const b = Buffer.from(await r.arrayBuffer());
      if (createHash("sha256").update(b).digest("hex") !== m.originalSha256)
        throw new Error("Original SHA-256 mismatch: " + m.id);
      await writeFile(path, b);
      if (m.transform)
        execFileSync("python", ["scripts/fix-onnx-shapes.py", path]);
      if (
        createHash("sha256")
          .update(await readFile(path))
          .digest("hex") !== m.sha256
      )
        throw new Error("Prepared SHA-256 mismatch: " + m.id);
      console.log(m.id, b.length, "verified");
      last = null;
      break;
    } catch (e) {
      last = e;
      console.warn(m.id, "attempt", attempt + 1, String(e));
    }
  }
  if (last) throw last;
}
