export const CACHE = "bigimg-models-v1";
async function validHash(bytes: Uint8Array, hash: string) {
  const digest = Array.from(
    new Uint8Array(
      await crypto.subtle.digest("SHA-256", new Uint8Array(bytes)),
    ),
  )
    .map((v) => v.toString(16).padStart(2, "0"))
    .join("");
  return digest === hash;
}
export async function loadModel(
  url: string,
  hash: string,
  progress: (percent: number, note?: string) => void,
  signal?: AbortSignal,
): Promise<Uint8Array> {
  signal?.throwIfAborted();
  let cache: Cache | undefined;
  try {
    cache = await caches.open(CACHE);
  } catch {
    progress(0, "本机缓存不可用，本次模型仅保存在内存。");
  }
  const cached = await cache?.match(url);
  if (cached) {
    const bytes = new Uint8Array(await cached.arrayBuffer());
    signal?.throwIfAborted();
    if (await validHash(bytes, hash)) {
      progress(100, "已缓存 · Cached");
      return bytes;
    }
    await cache?.delete(url);
    progress(0, "旧版本或损坏的模型缓存已清理，正在重新下载。");
  }
  const response = await fetch(url, { credentials: "omit", signal });
  if (!response.ok) throw new Error(`模型下载失败 HTTP ${response.status}`);
  const total = Number(response.headers.get("content-length"));
  const reader = response.body?.getReader(),
    chunks: Uint8Array[] = [];
  let length = 0;
  if (!reader) throw new Error("浏览器不支持流式模型下载");
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    length += value.length;
    progress(
      total ? Math.min(99, (length / total) * 100) : 0,
      `${(length / 1048576).toFixed(1)} MB`,
    );
  }
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  signal?.throwIfAborted();
  if (!(await validHash(bytes, hash)))
    throw new Error("模型完整性校验失败，请清理缓存后重试。");
  try {
    await cache?.put(
      url,
      new Response(bytes, {
        headers: { "Content-Type": "application/octet-stream" },
      }),
    );
  } catch {
    progress(100, "缓存空间不足；本次仍可推理。");
  }
  progress(100);
  return bytes;
}
