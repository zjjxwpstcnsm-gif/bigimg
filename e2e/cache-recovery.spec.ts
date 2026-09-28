import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
const models: { id: string; sha256: string }[] = JSON.parse(
  readFileSync(new URL("../src/models/manifest.json", import.meta.url), "utf8"),
);
test("corrupt cache is replaced and real AI inference completes", async ({
  page,
}) => {
  await page.goto("./");
  await page.evaluate(
    async (hash) => {
      const cache = await caches.open("bigimg-models-v1");
      const url = new URL("models/nomos-standard.onnx", location.href);
      url.searchParams.set("sha256", hash);
      await cache.put(url, new Response("corrupted weights"));
    },
    models.find((m) => m.id === "nomos-standard")!.sha256,
  );
  const requests: string[] = [];
  page.on("request", (r) => {
    if (r.url().includes("nomos-standard.onnx")) requests.push(r.url());
  });
  await page.getByText("高级设置", { exact: false }).click();
  await page.getByLabel("Acceleration", { exact: true }).selectOption("wasm");
  await page.getByRole("button", { name: "64 × 64 ↗" }).click();
  await page.getByRole("button", { name: "开始 AI 超分" }).click();
  await expect(page.getByRole("button", { name: "下载图片" })).toBeVisible({
    timeout: 120000,
  });
  expect(requests).toHaveLength(1);
  await expect(page.getByTestId("metrics")).toContainText("256 × 256");
  await page.getByRole("button", { name: "开始 AI 超分" }).click();
  await expect(page.getByRole("button", { name: "下载图片" })).toBeVisible({
    timeout: 120000,
  });
  expect(requests).toHaveLength(1);
});
