import { test, expect } from "@playwright/test";
test("odd upload, 4x-to-2x, no-Worker fallback, export formats and real tile seams", async ({
  page,
}, info) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "Worker", { value: undefined });
  });
  await page.goto("./");
  const sample = await page.evaluate(() => {
    const c = document.createElement("canvas");
    c.width = 129;
    c.height = 97;
    const x = c.getContext("2d")!;
    for (let y = 0; y < c.height; y++)
      for (let i = 0; i < c.width; i++) {
        x.fillStyle = `rgb(${i * 2},${y * 2},${(i + y) % 256})`;
        x.fillRect(i, y, 1, 1);
      }
    x.clearRect(0, 0, 8, 8);
    return c.toDataURL().split(",")[1];
  });
  await page
    .getByLabel("选择图片", { exact: true })
    .setInputFiles({
      name: "odd.png",
      mimeType: "image/png",
      buffer: Buffer.from(sample, "base64"),
    });
  await page.getByText("高级设置", { exact: false }).click();
  await page.getByLabel("Tile", { exact: true }).selectOption("64");
  await page.getByLabel("Acceleration", { exact: true }).selectOption("wasm");
  async function runPixels() {
    await page.getByRole("button", { name: "开始 AI 超分" }).click();
    await expect(page.getByRole("button", { name: "下载图片" })).toBeVisible({
      timeout: 120000,
    });
    return page.locator('img[alt="AI 超分结果"]').evaluate(async (img) => {
      const i = img as HTMLImageElement;
      await i.decode();
      const c = document.createElement("canvas");
      c.width = i.naturalWidth;
      c.height = i.naturalHeight;
      const x = c.getContext("2d")!;
      x.drawImage(i, 0, 0);
      return Array.from(x.getImageData(0, 0, c.width, c.height).data);
    });
  }
  const tiled = await runPixels();
  await expect(page.getByRole("status")).toContainText("6 / 6 Tiles");
  await expect(page.getByTestId("metrics")).toContainText("516 × 388");
  await page.getByLabel("Tile", { exact: true }).selectOption("192");
  const full = await runPixels();
  let sum = 0,
    max = 0,
    count = 0,
    seamSum = 0,
    seamCount = 0;
  for (let y = 0; y < 388; y++)
    for (let x = 0; x < 516; x++)
      for (let c = 0; c < 3; c++) {
        const i = (y * 516 + x) * 4 + c,
          d = Math.abs(tiled[i] - full[i]);
        sum += d;
        max = Math.max(max, d);
        count++;
        if (
          Math.abs(x - 256) < 8 ||
          Math.abs(x - 512) < 4 ||
          Math.abs(y - 256) < 8
        ) {
          seamSum += d;
          seamCount++;
        }
      }
  const seam = {
    mae: sum / count,
    max,
    seamMae: seamSum / seamCount,
    halo: 24,
    input: "129x97",
    backend: "WASM",
    model: "nomos-standard",
  };
  await info.attach("seam-metrics", {
    body: JSON.stringify(seam),
    contentType: "application/json",
  });
  expect(seam.seamMae).toBeLessThan(2);
  await page.getByLabel("输出倍率", { exact: true }).selectOption("2");
  await runPixels();
  await expect(page.getByTestId("metrics")).toContainText("258 × 194");
  await expect(
    page.getByText("AI 4× → downsample to 2× · 高质量缩小", { exact: true }),
  ).toBeVisible();
  for (const format of ["image/jpeg", "image/webp"]) {
    await page.getByLabel("输出格式", { exact: true }).selectOption(format);
    const dp = page.waitForEvent("download");
    await page.getByRole("button", { name: "下载图片" }).click();
    const d = await dp;
    expect(d.suggestedFilename()).toMatch(/\.(jpg|webp)$/);
    await d.saveAs(info.outputPath(d.suggestedFilename()));
  }
  await page.setViewportSize({ width: 375, height: 812 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: info.outputPath("mobile.png"),
    fullPage: true,
  });
});
