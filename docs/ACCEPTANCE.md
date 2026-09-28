# Acceptance — 2026-09-28

## Current evidence

- Initial remote repository: empty, zero branches and zero Actions runs; Pages URL returned 404.
- `npm install`: executed. `npm run lint`: passed. `npm run test`: 34 passed. `npm run build`: passed.
- Browser: Playwright Chromium 141.0.7390.37, Linux headless. Eleven real production-build browser tests passed. Evidence: `browser-local.json`.
- All nine ONNX models: 64×64 input → correct native output, Tile 64 with 24-pixel halo, WASM single-thread, alpha 0/255 checks, Before/After, file download, zero page exceptions and zero HTTP errors in recorded tests.
- Standard: 128×128 → 512×512, four real tiles; cache, cancellation and 375×812 no-overflow layout passed.
- Hardware WebGPU, Edge, Safari, Android device and iOS device: NOT TESTED.
- Software SwiftShader WebGPU probe: adapter present, first attempt fell back to WASM; investigation ongoing, not a WebGPU PASS.
- Native Python ORT validation was blocked by automatic approval review because the runtime attempted Microsoft telemetry, including after disable_telemetry_events. Those runs are excluded from acceptance. Browser WASM checks and ONNX structural/weight checks do not require that path.

## Deployment

Code push and Actions deployment pending at this checkpoint. Direct Pages creation API returned HTTP 401 Requires authentication; GitHub connector has no Pages administration operation. Do not call target URL “live” until actual deployed browser verification.

## Model matrix

|Model|ONNX structural check|WASM|WebGPU hardware|Tile 64 path|Output|
|---|---|---|---|---|---|
|Nomos Weak|PASS|PASS|NOT TESTED|PASS|256×256|
|Nomos Medium|PASS|PASS|NOT TESTED|PASS (also four tiles)|256×256 / 512×512|
|Nomos Strong|PASS|PASS|NOT TESTED|PASS|256×256|
|ClearReality|PASS|PASS|NOT TESTED|PASS|256×256|
|RealESRGAN x2Plus|PASS|PASS|NOT TESTED|PASS|128×128|
|RealESRGAN x4Plus|PASS|PASS|NOT TESTED|PASS|256×256|
|Remacri|PASS|PASS|NOT TESTED|PASS|256×256|
|UltraSharp|PASS|PASS|NOT TESTED|PASS|256×256|
|Nomos8kDAT|PASS|PASS|NOT TESTED|PASS|256×256|

PASS is scoped to the listed tests. No claim that a synthetic 64px smoke test proves large portrait quality or physical-device memory tolerance.
