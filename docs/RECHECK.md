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
