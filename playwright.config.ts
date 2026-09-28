import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "e2e",
  timeout: 300000,
  workers: 1,
  retries: 0,
  reporter: [["list"], ["json", { outputFile: "test-results/results.json" }]],
  use: {
    baseURL: process.env.BASE_URL || "http://127.0.0.1:4173/bigimg/",
    viewport: { width: 1280, height: 900 },
    headless: true,
    launchOptions: { args: ["--no-sandbox"] },
  },
  webServer: process.env.BASE_URL
    ? undefined
    : {
        command: "npm run preview -- --port 4173",
        url: "http://127.0.0.1:4173/bigimg/",
        reuseExistingServer: true,
      },
});
