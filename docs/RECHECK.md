# Recheck — 2026-09-28

## Starting state (read from live remote)

- main: `9f995a77c11c4834cf4ff49b13e720d496a73d45`; existing nine-model application, not an empty repository.
- Actions run `36396379247`: build PASS including nine-model browser WASM tests; deployment FAIL at `actions/configure-pages@v5` with `Get Pages site failed ... Not Found`.
- Public Pages URL: HTTP 404. This is not a deployed product yet.
- GitHub connector exposes repository/file/Git/Actions operations but no Pages administration mutation. Its repository metadata reports the user's admin role; that is not a callable Pages API capability.
- Official configure-pages action explicitly requires a token other than GITHUB_TOKEN for `enablement`; no such credential is provided here. Do not change enablement to true and claim that resolves permission.

## Source recheck

Sources read on 2026-09-28:

- https://onnxruntime.ai/docs/tutorials/web/ep-webgpu.html — webgpu import and execution provider.
- https://onnxruntime.ai/docs/tutorials/web/env-flags-and-session-options.html — WASM single-thread and paths.
- https://onnxruntime.ai/docs/tutorials/web/deploy.html — static runtime deployment.
- https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages
- https://raw.githubusercontent.com/actions/configure-pages/main/action.yml — enablement permissions.
- The three Nomos SPAN source pages linked in manifest, OpenModelDB Nomos8kDAT, ClearRealityV1, Remacri and UltraSharp pages.
- https://huggingface.co/Kim2091/ClearRealityV1 — author states Apache 2.0, unlike older OpenModelDB CC-BY-NC-SA metadata. Use the author's current ONNX distribution terms.
- https://huggingface.co/Kim2091/UltraSharp — author still states CC-BY-NC-SA 4.0.
- https://github.com/xinntao/Real-ESRGAN — original project and BSD-3-Clause terms.

Existing ONNX exports exist for all nine models. No need to convert ClearReality from PTH: the author publishes an ONNX release. All nine downloaded files were reverified against pinned manifest hashes this turn. Models stay out of Git and are included in the static build, so production model fetch is same-origin.

## Runtime changes

- Verify cached model bytes against the current manifest SHA-256. Evict and redownload stale/corrupt entries, preserving true cache hits without another network download.
- Abort model fetch in the no-Worker fallback when cancelled; keep cancellation and worker cleanup scoped to the originating job so an old encoding completion cannot terminate a new job.
- Reset progress before a new job and release a partial output on cancellation.
- Add corrupted-cache browser regression and download cancellation/integrity unit tests.
- CI now tests odd image dimensions, actual upload, native-4x-to-2x export, no-Worker fallback and tile seams, in addition to all nine WASM smoke runs.
- Add a post-deployment browser job against the public Pages URL. It cannot run until repository Pages is enabled and deployment succeeds.

No server inference or image transmission was added. Main-thread image decode/encode remains the compatibility path; inference and tile loops use the worker when available.

## Public URL check

A real Playwright Chromium 141 navigation through the configured network proxy returned HTTP 404, title `Site not found · GitHub Pages`. Online AI inference cannot be tested against that response. Direct Chromium navigation without the environment proxy returned ERR_EMPTY_RESPONSE; this is an automation networking issue, distinct from the confirmed Pages 404.

## Recheck results available so far

- Dependency installation, TypeScript/ESLint, 38 unit tests and Vite production build: PASS.
- Twelve browser tests in the WASM/cache suite: PASS. Separately, the extended image pipeline browser test: PASS. Real ONNX models, no inference mocks.
- Nine model smoke runs: 64×64 input, Tile 64, halo 24, correct native output shape; alpha and download passed, no page exceptions or HTTP errors in the smoke suite.
- Standard also processed 128×128 into four tiles. The 129×97 upload ran six tiles and native-4×-to-2×, JPEG/WebP export, and no-Worker fallback. On this generated sample, tile/full-image RGB MAE = 0. This does not establish portrait-quality/seam equivalence for DAT or every model.
- Software versions: ONNX Runtime Web 1.30.0, React 19.3.0, Vite 8.3.1, Playwright 1.56.1, Chromium 141.0.7390.37.
- Screenshots reviewed at desktop and 375×812. Model selector, comparison and download controls fit; license table scrolls horizontally within its container.
- Static privacy review: the only production fetch is the model GET in cache.ts; no upload, beacon, analytics, remote inference or image logging path.
- Direct `git push` could not authenticate (no CLI credential). The identical tree was published using GitHub connector create-tree/create-commit/update-ref, without force. Local checkout was aligned only after comparing both trees.
- Connector GET for `/repos/zjjxwpstcnsm-gif/bigimg/pages` was rejected as an unsupported endpoint (HTTP 400). No Pages administration mutation is exposed.

## Remote verification

Source commit `e1384bb3eb30186fda59943ecbc5658afcff4333` was reread from remote main after publishing. Run https://github.com/zjjxwpstcnsm-gif/bigimg/actions/runs/36400655583 completed with:

- build: SUCCESS (lint, 38 unit tests, model preparation, production build, 13 real browser tests, artifact upload).
- deploy: FAILURE at configure-pages: `Get Pages site failed ... Not Found`.
- verify-live: SKIPPED because deployment did not succeed.

Remaining repository action: Settings → Pages → Build and deployment → Source → GitHub Actions. After that, rerun deployment/the workflow. The post-deploy test job must pass before claiming the public product works.

## UltraSharp WebGPU repair

The initial software WebGPU run failed with `Shape mismatch attempting to re-use buffer. {1,112,112,3} != {1,448,448,3}`. The production fallback completed with CPU / WASM and correctly displayed that backend; the GPU assertion failed rather than reporting a false PASS.

Inspection found both the ONNX input and output named their spatial dimensions `height` / `width`, although the output is 4× larger. Applied the existing build-time output-symbol repair to UltraSharp as well. Verified all graph node bytes (including embedded Constant weights) and initializer bytes were unchanged. Original and prepared SHA-256 remain distinct in the manifest. See `ultrasharp-shape-repair.json`. This is a shape metadata repair, not a different model or changed weights.

## Final GPU outcome

Eight models passed software WebGPU after repairing UltraSharp. DAT timed out at the 360-second test budget; this is not a physical-GPU incompatibility finding. The corrected UltraSharp passed both WASM and WebGPU with its new pinned hash. Its initial failure and successful retest are both retained, rather than overwriting the failure record. The cache browser test uses the exact SHA-256 query-string cache key used in production.

Cache hashing uses the existing ArrayBuffer without creating an extra full-size model copy. PWA/offline shell is not implemented. Physical devices, GPU OOM/device-loss recovery and full-resolution portrait-quality certification remain outside the measured evidence.
