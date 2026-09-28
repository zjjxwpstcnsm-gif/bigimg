import manifest from "./manifest.json";
export interface UpscaleModel {
  id: string;
  name: string;
  zhName: string;
  technicalName: string;
  description: string;
  architecture: string;
  scale: 2 | 4;
  license: string;
  licenseUrl: string;
  author: string;
  sourceUrl: string;
  modelUrl: string;
  originalUrl: string;
  commercialUse: boolean;
  attribution: boolean;
  bytes: number;
  sha256: string;
  runtime: { webgpu: string; wasm: string };
  experimental: boolean;
}
// Runtime entries describe measured evidence, not a blanket compatibility promise.
export const models = manifest as UpscaleModel[];

export function modelAddress(model: UpscaleModel, base: string) {
  const u = new URL(model.modelUrl, base);
  u.searchParams.set("sha256", model.sha256);
  return u.href;
}
