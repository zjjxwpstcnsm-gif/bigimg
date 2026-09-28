import * as ort from "onnxruntime-web/webgpu";
import { models, modelAddress } from "../models/modelRegistry";
import { guardSize, packTile, mergeTile, retrySizes, tiles } from "./tiles";
import { loadModel } from "./cache";
import type { EngineMessage, Job } from "./protocol";
export async function run(
  job: Job,
  send: (message: EngineMessage) => void,
  cancelled: () => boolean = () => false,
) {
  const started = performance.now(),
    model = models.find((m) => m.id === job.modelId);
  if (!model) throw new Error("未知模型");
  guardSize(job.width, job.height, model.scale);
  const progress = (
    stage: string,
    percent: number,
    extra: Record<string, string | number> = {},
  ) => send({ type: "progress", value: { stage, percent, ...extra } });
  ort.env.wasm.numThreads = 1;
  ort.env.wasm.proxy = false;
  ort.env.wasm.wasmPaths = new URL("runtime/", job.baseUrl).href;
  const bytes = await loadModel(
    modelAddress(model, job.baseUrl),
    model.sha256,
    (p, n) => progress("Downloading model · 下载模型", p, n ? { note: n } : {}),
  );
  const check = () => {
    if (cancelled()) throw new Error("已取消");
  };
  check();
  let session: ort.InferenceSession | undefined;
  let backend: "webgpu" | "wasm" =
    job.backend === "auto" && "gpu" in navigator ? "webgpu" : "wasm";
  const width = job.width * model.scale,
    height = job.height * model.scale;
  const output = new Uint8ClampedArray(width * height * 4);
  const initial =
    job.tile ||
    (model.architecture === "SPAN" && backend === "webgpu"
      ? Math.min(
          192,
          Math.max(64, Math.ceil(Math.max(job.width, job.height) / 64) * 64),
        )
      : 64);
  let sizes = retrySizes(initial);
  let finalTile = initial;
  try {
    for (let backendAttempt = 0; backendAttempt < 2; backendAttempt++) {
      try {
        progress("Initializing model · 初始化模型", 0, {
          backend: backend === "webgpu" ? "WebGPU" : "CPU / WASM",
        });
        session = await ort.InferenceSession.create(bytes, {
          executionProviders: [backend],
          graphOptimizationLevel: "all",
        });
        for (let attempt = 0; attempt < sizes.length; attempt++) {
          finalTile = sizes[attempt];
          try {
            check();
            progress("Preparing image · 准备图片", 0, { tile: finalTile });
            const list = tiles(job.width, job.height, finalTile, job.overlap);
            for (let i = 0; i < list.length; i++) {
              check();
              const tile = list[i],
                n = tile.inputSize;
              const input = new ort.Tensor(
                "float32",
                packTile(job.pixels, job.width, job.height, tile),
                [1, 3, n, n],
              );
              let results: ort.InferenceSession.ReturnType | undefined;
              try {
                results = await session.run({ [session.inputNames[0]]: input });
                const result = results[session.outputNames[0]];
                if (
                  result.dims.join(",") !==
                  [1, 3, n * model.scale, n * model.scale].join(",")
                )
                  throw new Error(`模型输出维度错误: ${result.dims}`);
                if (result.type !== "float32")
                  throw new Error("模型输出不是 FP32");
                const rgb = (await result.getData()) as Float32Array;
                if (!rgb.every(Number.isFinite))
                  throw new Error("模型输出含无效数值");
                mergeTile(output, width, rgb, tile, model.scale);
              } finally {
                input.dispose();
                if (results)
                  for (const t of Object.values(results)) t.dispose();
              }
              progress("Upscaling · AI 超分", ((i + 1) / list.length) * 100, {
                processed: i + 1,
                total: list.length,
                tile: finalTile,
                backend: backend === "webgpu" ? "WebGPU" : "CPU / WASM",
              });
              await new Promise((resolve) => setTimeout(resolve, 0));
            }
            progress("Merging tiles · 拼接完成", 100, { tile: finalTile });
            check();
            send({
              type: "done",
              pixels: output,
              width,
              height,
              ms: performance.now() - started,
              backend: backend === "webgpu" ? "WebGPU" : "CPU / WASM",
              tile: finalTile,
            });
            return;
          } catch (error) {
            check();
            const detail = String(error);
            if (
              !/memory|alloc|device.*lost|out of bounds|oom/i.test(detail) ||
              attempt === sizes.length - 1
            )
              throw error;
            progress("Retrying · 内存不足，减小 Tile", 0, {
              tile: sizes[attempt + 1],
              note: `改用 Tile ${sizes[attempt + 1]}，最多 ${sizes.length - 1} 次降级。`,
            });
            await session.release();
            session = undefined;
            session = await ort.InferenceSession.create(bytes, {
              executionProviders: [backend],
              graphOptimizationLevel: "all",
            });
          }
        }
      } catch (error) {
        check();
        if (backend === "wasm") throw error;
        console.warn(
          "WebGPU initialization/inference failed; CPU fallback:",
          String(error),
        );
        if (session) {
          await session.release().catch(() => {});
          session = undefined;
        }
        backend = "wasm";
        if (!job.tile) sizes = [64];
        progress("Fallback · 转用 CPU / WASM", 0, {
          backend: "CPU / WASM",
          note: "此模型在当前 WebGPU 环境运行失败，正在尝试 CPU。",
        });
      }
    }
  } finally {
    await session?.release().catch(() => {});
  }
}
export function readableError(error: unknown) {
  const detail = String(error);
  if (/fetch|network|download|HTTP/i.test(detail))
    return "模型下载失败。请检查网络连接，或清理模型缓存后重试。";
  if (/memory|alloc|oom|out of bounds/i.test(detail))
    return "当前设备内存不足。请选择较小 Tile、较小图片，或 Nomos8k Standard。";
  if (/operator|kernel|not implemented|unsupported/i.test(detail))
    return "此模型含当前浏览器后端不支持的算子，请尝试 CPU 或其他模型。";
  return "AI 处理失败。请尝试 CPU、较小 Tile 或 Nomos8k Standard；错误详情可展开查看。";
}
