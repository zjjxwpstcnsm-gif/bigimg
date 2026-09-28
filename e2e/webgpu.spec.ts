import { test, expect, chromium } from "@playwright/test";
const models = [
  "nomos-weak",
  "nomos-standard",
  "nomos-strong",
  "clearreality",
  "realesrgan-x2",
  "realesrgan-x4",
  "remacri",
  "ultrasharp",
  "nomos-dat",
];
for (const id of models)
  test(`${id}: real WebGPU (software adapter; not hardware certification)`, async ({}, info) => {
    test.setTimeout(360000);
    const b = await chromium.launch({
      args: [
        "--no-sandbox",
        "--enable-unsafe-webgpu",
        "--use-angle=swiftshader",
      ],
    });
    try {
      const page = await b.newPage(),
        warnings: string[] = [];
      page.on("console", (m) => {
        if (["warning", "error"].includes(m.type())) warnings.push(m.text());
      });
      await page.goto(process.env.BASE_URL || "http://127.0.0.1:4173/bigimg/");
      const capability = await page.evaluate(async () => {
        const gpu = (
          navigator as unknown as {
            gpu?: {
              requestAdapter: () => Promise<{
                info: Record<string, string>;
              } | null>;
            };
          }
        ).gpu;
        const a = await gpu?.requestAdapter();
        return {
          gpu: !!gpu,
          adapter: !!a,
          info: a
            ? { vendor: a.info.vendor, architecture: a.info.architecture }
            : null,
        };
      });
      await info.attach("gpu", {
        body: JSON.stringify(capability),
        contentType: "application/json",
      });
      test.skip(
        !capability.adapter,
        "No WebGPU adapter in this test environment",
      );
      await page.getByLabel("选择模型", { exact: true }).selectOption(id);
      await page.getByText("高级设置", { exact: false }).click();
      await page.getByLabel("Tile", { exact: true }).selectOption("64");
      await page.getByRole("button", { name: "64 × 64 ↗" }).click();
      await page.getByRole("button", { name: "开始 AI 超分" }).click();
      await expect(page.getByRole("button", { name: "下载图片" })).toBeVisible({
        timeout: 330000,
      });
      const metrics = await page.getByTestId("metrics").innerText();
      console.log(id, metrics, warnings);
      await info.attach("gpu-result", {
        body: JSON.stringify({ id, metrics, warnings }),
        contentType: "application/json",
      });
      expect(metrics).toContain("WebGPU");
      expect(metrics).toContain(
        id === "realesrgan-x2" ? "128 × 128" : "256 × 256",
      );
      if (id === "nomos-standard") {
        await page.screenshot({
          path: info.outputPath("desktop.png"),
          fullPage: true,
        });
        await page.setViewportSize({ width: 375, height: 812 });
        await page.screenshot({
          path: info.outputPath("mobile.png"),
          fullPage: true,
        });
      }
    } finally {
      await b.close();
    }
  });
