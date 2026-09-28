import { mkdir, readdir, copyFile } from "node:fs/promises";
await mkdir("public/runtime", { recursive: true });
for (const name of await readdir("node_modules/onnxruntime-web/dist"))
  if (
    name.endsWith(".wasm") ||
    (name.startsWith("ort-wasm") && name.endsWith(".mjs"))
  )
    await copyFile(
      "node_modules/onnxruntime-web/dist/" + name,
      "public/runtime/" + name,
    );
