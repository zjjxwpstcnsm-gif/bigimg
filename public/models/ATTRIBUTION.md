# Model attribution

FP32 ONNX model files distributed by BigImg:

- Nomos8k SPAN OTF Weak / Medium / Strong: Helaman, CC BY 4.0.
- 4xNomos8kDAT: Helaman, CC BY 4.0.
- 4x-ClearRealityV1: Kim2091, Apache 2.0 (current author's release).
- RealESRGAN_x2plus / RealESRGAN_x4plus: Xintao Wang, Liangbin Xie, Chao Dong, Ying Shan, BSD 3-Clause.
- 4x-Remacri: FoolhardyVEVO, CC BY-NC-SA 4.0. Non-commercial only.
- 4x-UltraSharp: Kim2091, CC BY-NC-SA 4.0. Non-commercial only.

Full license terms are in ../licenses/. Source URLs, download URLs, sizes,
versions and SHA-256 are in ../../src/models/manifest.json in the GitHub repository.
The website's Models & Licenses table links each original model page.

Changes: SPAN and DAT output shape metadata uses distinct spatial symbol names to fix ONNX Runtime WebGPU buffer reuse. No weights or operators changed. Original and prepared SHA-256 are both in the manifest. RealESRGAN and Remacri ONNX
conversions are mirrored by huggingworld; all 702 weight tensors in each were
verified byte-for-byte against the original PTH distribution. DAT mirror has
the exact SHA-256 recorded by OpenModelDB. Do not infer model licensing from
any mirror's repository-level license. BigImg's MIT code license does not
relicense model weights.
