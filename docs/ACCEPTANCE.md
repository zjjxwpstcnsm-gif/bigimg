# Acceptance — 2026-09-28 recheck

**Not deployed.** A real public-URL Chromium navigation returned HTTP 404 (`Site not found · GitHub Pages`). Repository Pages needs to be enabled. The connector rejects the Pages endpoint and exposes no Pages administration mutation.

## Measured model results

Browser: Playwright Chromium 141.0.7390.37, Linux headless, ONNX Runtime Web 1.30.0. WebGPU below means a Google SwiftShader **software adapter**, not physical GPU certification. All physical-GPU results are NOT TESTED.

|Model|ONNX|WebGPU (software)|WASM|Tile path|Output correct|License|
|---|---|---|---|---|---|---|
|4x-Nomos8k_span_otf_weak|PASS|PASS|PASS|PASS (64px core)|PASS|CC-BY-4.0|
|4x-Nomos8k_span_otf_medium|PASS|PASS|PASS|PASS (64px core)|PASS|CC-BY-4.0|
|4x-Nomos8k_span_otf_strong|PASS|PASS|PASS|PASS (64px core)|PASS|CC-BY-4.0|
|4x-ClearRealityV1|PASS|PASS|PASS|PASS (64px core)|PASS|Apache-2.0|
|RealESRGAN_x2plus|PASS|PASS|PASS|PASS (64px core)|PASS|BSD-3-Clause|
|RealESRGAN_x4plus|PASS|PASS|PASS|PASS (64px core)|PASS|BSD-3-Clause|
|4x-Remacri|PASS|PASS|PASS|PASS (64px core)|PASS|CC-BY-NC-SA-4.0|
|4x-UltraSharp|PASS|PASS|PASS|PASS (64px core)|PASS|CC-BY-NC-SA-4.0|
|4xNomos8kDAT|PASS|FAIL: 360 s timeout|PASS|PASS (64px core)|PASS|CC-BY-4.0|

Each model ran a real 64×64 RGB/alpha sample with Tile 64 and halo 24. Native output is 256×256 except RealESRGAN x2 (128×128). WASM alpha checks, Before/After, download, and zero page exceptions/HTTP errors passed. Tile PASS means this measured padded-tile path; it does not certify large images/seams on every model.

Standard additionally ran 128×128 through four tiles, plus a 129×97 uploaded sample through six tiles. The latter tested no-Worker fallback, 4×→2× (258×194), JPEG/WebP export and 375×812 layout. Generated-image tiled/full-frame RGB MAE and seam MAE were both zero; real portraits and DAT attention seams remain unvalidated.

UltraSharp initially failed WebGPU with input/output symbolic dimension reuse; its real CPU fallback worked. After metadata-only repair, WebGPU passed (284.72 s) and WASM passed again. No weights/operators were changed. DAT exceeded a 360-second software WebGPU test budget; no unsupported-operator conclusion was established. It passed WASM (41.21 s). Do not equate a software-adapter timeout with browser impossibility.

## Evidence

- `browser-recheck-wasm.json`: nine WASM models, cache/cancel/layout, default backend.
- `browser-pipeline.json`: odd upload, multi-tile seams, downsample and formats.
- `browser-recheck-webgpu-initial.json`: complete nine-model first GPU attempt, including failures.
- `browser-recheck-ultrasharp-fixed.json`: corrected hashed-cache recovery, UltraSharp WASM and WebGPU retest.
- `ultrasharp-shape-repair.json`: hashes and unchanged graph/weight proof.
- `browser-online-status.json`: real public URL response.
- `RECHECK.md`: source references, changes, deployment limitation.

## Browser/device scope

|Environment|Result|
|---|---|
|Chromium 141 / Linux headless|PASS for the tests above|
|375×812 Chromium viewport|PASS layout; screenshot reviewed|
|Chrome branded desktop|NOT TESTED|
|Edge|NOT TESTED|
|Safari|NOT TESTED|
|Android physical device|NOT TESTED|
|iOS physical device|NOT TESTED|
|Physical WebGPU|NOT TESTED|

## Performance sample

Nomos Standard, 64×64 → 256×256, single-thread WASM, Tile 64 + halo 24: **1.28 s**. This is the app's worker timer (model loading/session initialization/inference/merge), excluding final main-thread encoding. Software WebGPU Standard: 13.05 s. Synthetic smoke timings are not full-resolution portrait/device benchmarks.

## Checks and deployment

Dependency installation, lint, 38 unit tests and production build passed locally. Source run [36400655583](https://github.com/zjjxwpstcnsm-gif/bigimg/actions/runs/36400655583) passed build + 13 browser tests, then failed at configure-pages with Pages Not Found. Subsequent UltraSharp repair and final evidence are included in the repository; consult the latest Actions run for their CI status.

The workflow includes a separate post-deployment `verify-live` job: all nine models are fetched and inferred from the real public URL, with pipeline/cache tests and artifacts. It remains blocked by Pages setup. A build PASS is not an online PASS.

## Remaining limits

- Enable repository Pages with Source = GitHub Actions, then complete deployment and online inference verification.
- DAT software WebGPU timed out; use WASM if needed. Physical GPU behavior is not established.
- Physical Chrome/Edge/Safari/mobile, large portrait quality, per-model large-image seam comparisons and low-memory/device-loss recovery need actual device testing.
- PWA/offline application shell is not implemented. Model cache alone does not make a fresh page reload work offline.
- Decode/encode use main-thread Canvas for compatibility; inference/packing/merge use a Worker when available. No model inference backend server exists.
