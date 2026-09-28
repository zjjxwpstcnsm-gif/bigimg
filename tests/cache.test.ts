import { afterEach, expect, it, vi } from "vitest";
import { loadModel } from "../src/engine/cache";
const bytes = new Uint8Array([1, 2, 3]);
const hash = Array.from(
  new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)),
)
  .map((v) => v.toString(16).padStart(2, "0"))
  .join("");
afterEach(() => vi.unstubAllGlobals());
it("reuses verified bytes without downloading", async () => {
  const fetch = vi.fn();
  vi.stubGlobal("fetch", fetch);
  vi.stubGlobal("caches", {
    open: async () => ({ match: async () => new Response(bytes) }),
  });
  expect(
    await loadModel("https://example.test/model.onnx", hash, vi.fn()),
  ).toEqual(bytes);
  expect(fetch).not.toHaveBeenCalled();
});
it("evicts a corrupted or outdated cached model before fetching current weights", async () => {
  const remove = vi.fn(),
    put = vi.fn(),
    fetch = vi.fn(async () => new Response(bytes));
  vi.stubGlobal("fetch", fetch);
  vi.stubGlobal("caches", {
    open: async () => ({
      match: async () => new Response("stale"),
      delete: remove,
      put,
    }),
  });
  expect(
    await loadModel("https://example.test/model.onnx", hash, vi.fn()),
  ).toEqual(bytes);
  expect(remove).toHaveBeenCalledOnce();
  expect(fetch).toHaveBeenCalledOnce();
  expect(put).toHaveBeenCalledOnce();
});
it("rejects incorrect downloaded weights without caching them", async () => {
  const put = vi.fn();
  vi.stubGlobal("fetch", async () => new Response("bad"));
  vi.stubGlobal("caches", {
    open: async () => ({ match: async () => undefined, put }),
  });
  await expect(
    loadModel("https://example.test/model.onnx", hash, vi.fn()),
  ).rejects.toThrow("完整性");
  expect(put).not.toHaveBeenCalled();
});
it("propagates cancellation to an in-flight model fetch", async () => {
  const controller = new AbortController();
  vi.stubGlobal("caches", {
    open: async () => {
      throw new Error("unavailable");
    },
  });
  vi.stubGlobal(
    "fetch",
    (_url: string, { signal }: { signal: AbortSignal }) =>
      new Promise((_resolve, reject) => {
        signal.addEventListener("abort", () => reject(signal.reason));
        controller.abort(new Error("cancelled download"));
      }),
  );
  await expect(
    loadModel(
      "https://example.test/model.onnx",
      hash,
      vi.fn(),
      controller.signal,
    ),
  ).rejects.toThrow("cancelled download");
});
