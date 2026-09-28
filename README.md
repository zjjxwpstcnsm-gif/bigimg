# BigImg

Free, private AI image super-resolution in your browser. 免费、本地运行的 AI 图片超分。

Deployment target: **https://zjjxwpstcnsm-gif.github.io/bigimg/** (publication status is tracked in `docs/ACCEPTANCE.md`; a URL here is not proof that Pages is enabled).

## Features

- Nine **different real ONNX weights**, lazy download and SHA-256 integrity verification.
- WebGPU preferred, explicit single-thread WASM fallback. No COOP/COEP or SharedArrayBuffer requirement.
- Worker-based inference, bounded tile sizes 256 → 192 → 128 → 96 → 64 on allocation errors, cancellation by terminating the worker.
- Reflected boundary padding, 16/24/32-pixel context halo, overlap cropping and exact edge-tile placement.
- PNG/JPEG/WebP input, drag/drop, file picker, clipboard paste, generated 64/128px samples.
- 2× and 4× output; native 2× is explicitly distinguished from AI 4× followed by high-quality browser downsampling.
- Alpha is resized separately and recombined using `destination-in`. JPEG explicitly flattens on white.
- Fit/100%/zoom/pan, Before/After slider, PNG/JPEG/WebP download and quality control.
- Model Cache Storage status and clear-cache action. If cache storage is unavailable or full, inference can continue without persistent cache.
- Responsive layout and system dark/light appearance. No external fonts, accounts, analytics or inference service.

## Local development

Node 24 recommended.

```sh
npm ci
python -m pip install -r scripts/requirements-build.txt
npm run models:fetch
npm run dev
```

Open the `/bigimg/` path. All nine models are downloaded into ignored `public/models/` with integrity checks; model binaries are **not** pushed into Git history. The Pages build hosts the resulting static files alongside the application.

```sh
npm run lint
npm run test
npm run build
npx playwright install --with-deps chromium
npm run test:e2e
```

Playwright uses the real production build, real ONNX files, and browser WASM. No mock inference. WebGPU is probed independently; software SwiftShader is never described as physical GPU validation. Unit-test synthetic tensors test geometric stitching only.

## Architecture

React + TypeScript + Vite → local image decode → module Web Worker → ONNX Runtime Web WebGPU/WASM session → padded tile inference → crop/merge → local alpha compositing and optional 4×→2× downsample → local encoding/download.

All image data stays in browser memory. The main thread decodes and encodes using Canvas, which works without OffscreenCanvas. The heavy inference, tensor packing and merge loops run in a worker. Browsers without Worker use a cooperative main-thread fallback; that fallback is not a performance promise and is not yet separately validated.

## Models and licenses

| UI | Exact model | Author | Native | Architecture | License |
|---|---|---|---|---|---|
| Natural | 4x-Nomos8k_span_otf_weak | Helaman | 4× | SPAN | CC-BY-4.0 |
| Standard (default) | 4x-Nomos8k_span_otf_medium | Helaman | 4× | SPAN | CC-BY-4.0 |
| Restore | 4x-Nomos8k_span_otf_strong | Helaman | 4× | SPAN | CC-BY-4.0 |
| Realistic | 4x-ClearRealityV1 | Kim2091 | 4× | SPAN | Apache-2.0 |
| 2× Fast | RealESRGAN_x2plus | Xintao Wang et al. | 2× | RRDBNet | BSD-3-Clause |
| RealESRGAN 4× | RealESRGAN_x4plus | Xintao Wang et al. | 4× | RRDBNet | BSD-3-Clause |
| Detail | 4x-Remacri | FoolhardyVEVO | 4× | ESRGAN | **CC-BY-NC-SA-4.0** |
| Ultra Sharp | 4x-UltraSharp | Kim2091 | 4× | ESRGAN | **CC-BY-NC-SA-4.0** |
| High Quality (experimental) | 4xNomos8kDAT | Helaman | 4× | DAT | CC-BY-4.0 |

**Remacri and UltraSharp are non-commercial models.** Preserve attribution and follow their share-alike terms. BigImg code is MIT; that does not relicense weights. ClearReality's current author's ONNX release is Apache-2.0; older OpenModelDB metadata still lists a different license. Original source links, URLs, exact byte sizes, hashes and runtime evidence are in `src/models/manifest.json`. Full license texts and attribution are published under `public/licenses/` and `public/models/ATTRIBUTION.md`.

The UI title “2× Fast” describes avoiding a 4× output pass. RealESRGAN x2plus is a heavy RRDB network and can be slower than SPAN. It is not a latency guarantee.

## Model provenance

Nomos SPAN uses the author's Google Drive **FP32 opset17** exports, not the smaller FP16 files listed by OpenModelDB. Each is 1,718,947 bytes with a distinct SHA-256. ClearReality and UltraSharp are author's Hugging Face ONNX exports. The SPAN and DAT exports required a metadata-only fix: input/output height/width symbolic names were reused despite different sizes. BigImg renames output spatial dimensions to prevent ORT WebGPU buffer shape-reuse failures. Weights and operators are untouched. Original and prepared SHA-256 are both recorded; `scripts/fix-onnx-shapes.py` reproduces the change. Python is used only at build time.

RealESRGAN x2/x4 and Remacri use pinned ONNX mirrors; all **702 initializer tensors per model** were byte-compared against the official / OpenModelDB-linked PTH originals. DAT's mirrored ONNX SHA-256 exactly matches OpenModelDB's original author download. See `docs/weight-provenance.json` and `docs/onnx-graphs.json`. Models are RGB NCHW FP32; scale is validated on every actual tile output before merge.

## GitHub Pages deployment

Vite base is `/bigimg/`. WASM binaries are copied from the **same installed ORT version** into `runtime/`; worker and asset URLs retain the Pages subdirectory.

`.github/workflows/pages.yml` runs `npm ci`, lint, unit tests, pinned model download/checks, build, `configure-pages@v5`, `upload-pages-artifact@v3`, `deploy-pages@v4`. It runs on main pushes and workflow dispatch with `contents: read`, `pages: write`, `id-token: write`, and environment `github-pages`.

Repository **Settings → Pages → Build and deployment → Source → GitHub Actions** must be enabled. The normal `GITHUB_TOKEN` does not grant repository administration rights to enable Pages itself.

The approximately 350 MiB model collection plus runtime assets fits a Pages artifact without putting large binaries into Git. Browsers fetch models from the **same Pages origin**, avoiding Google Drive browser CORS problems. Build-time downloads may use external author/mirror sources; they contain model weights only. Deployment fails rather than silently serving a missing or changed model.

## Privacy

The production app has no upload code, remote inference API, analytics or image logging. `fetch` downloads model bytes using GET; the model cache contains weights, not user images. Object URLs, worker transfers, canvas pixel arrays and downloads stay local. Browser tests check network methods, missing resources and console exceptions. Hosting providers receive ordinary requests for HTML/JS/CSS/WASM/weights; the app does not send them input images.

## WebGPU and WASM compatibility

`navigator.gpu` is checked, and actual session creation/run can still fail despite presence of that property. Failures explicitly select CPU/WASM and change the displayed backend. WASM uses one thread. Backend initialization is not a claim that every model runs on every GPU.

See `docs/ACCEPTANCE.md` for measured browser/model outcomes. Chrome, Edge, Safari, Android and iOS are **not interchangeable**: only tested versions count. Physical GPU/mobile/Safari tests are outstanding unless recorded there. Chromium emulation is a layout test, not an Android or iOS device test.

## Tile and memory limitations

Tile is the unpadded core; inference dimensions include `2 × overlap`. Edge tiles are reflected to a consistent square input, and the halo is discarded when copying the core. The final image has exactly input width/height × native scale. Alpha is preserved through browser high-quality interpolation; transparent RGB cannot be recovered if it was absent from the input.

Halo cropping reduces boundary artifacts but does not mathematically reproduce full-frame inference for every deep/attention architecture. DAT uses global/spatial attention; large-photo seam and skin/hair quality need further visual validation. Overlap 24 is configurable, not a universal guarantee. Memory retries cover reported allocation/device failures; a browser process killed by the OS cannot be recovered by JavaScript.

Peak output working memory is estimated before allocating native output (even for 4×→2×). Outputs above a 768 MiB estimate or 16,384 pixels on either axis are refused with a readable error. Device-specific canvas/memory limits may be lower. Large models on CPU can be slow. Native WebGPU hardware, device-loss recovery, image-quality comparisons on real portraits, low-memory mobile, 16-bit color/ICC preservation and PWA offline-shell support are not claimed as verified.

## Attribution and test assets

Thanks to Helaman, Kim2091, FoolhardyVEVO, Xintao Wang and collaborators, OpenModelDB, the ONNX Runtime team and the ONNX mirror maintainers. Author-provided model licenses take precedence over a mirror repository's generic license.

Samples are generated locally from gradients, circles and text in `src/App.tsx`; generated test images are CC0. No third-party portrait is bundled.
