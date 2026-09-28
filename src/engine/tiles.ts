export interface Tile {
  x: number;
  y: number;
  width: number;
  height: number;
  pad: number;
  inputSize: number;
}
export function tiles(
  width: number,
  height: number,
  size: number,
  pad: number,
): Tile[] {
  if (
    ![width, height, size].every((n) => Number.isInteger(n) && n > 0) ||
    pad < 0 ||
    !Number.isInteger(pad)
  )
    throw new Error("Invalid tile dimensions");
  const result: Tile[] = [];
  for (let y = 0; y < height; y += size)
    for (let x = 0; x < width; x += size)
      result.push({
        x,
        y,
        width: Math.min(size, width - x),
        height: Math.min(size, height - y),
        pad,
        inputSize: size + 2 * pad,
      });
  return result;
}
export function reflect(i: number, size: number): number {
  if (size === 1) return 0;
  const period = 2 * (size - 1),
    v = ((i % period) + period) % period;
  return v < size ? v : period - v;
}
export function packTile(
  rgba: Uint8ClampedArray,
  w: number,
  h: number,
  tile: Tile,
): Float32Array {
  const n = tile.inputSize,
    plane = n * n,
    data = new Float32Array(plane * 3);
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) {
      const src =
          (reflect(tile.y + y - tile.pad, h) * w +
            reflect(tile.x + x - tile.pad, w)) *
          4,
        dst = y * n + x;
      for (let c = 0; c < 3; c++) data[c * plane + dst] = rgba[src + c] / 255;
    }
  return data;
}
export function mergeTile(
  out: Uint8ClampedArray,
  outputWidth: number,
  rgb: Float32Array,
  tile: Tile,
  scale: number,
) {
  const n = tile.inputSize * scale,
    plane = n * n;
  for (let y = 0; y < tile.height * scale; y++)
    for (let x = 0; x < tile.width * scale; x++) {
      const src = (y + tile.pad * scale) * n + x + tile.pad * scale,
        dst = ((tile.y * scale + y) * outputWidth + tile.x * scale + x) * 4;
      for (let c = 0; c < 3; c++)
        out[dst + c] = Math.round(
          Math.max(0, Math.min(1, rgb[c * plane + src])) * 255,
        );
      out[dst + 3] = 255;
    }
}
export function outputDimensions(w: number, h: number, scale: number) {
  return { width: w * scale, height: h * scale };
}
export function guardSize(w: number, h: number, nativeScale: number) {
  const { width, height } = outputDimensions(w, h, nativeScale);
  // Peak includes native RGBA, canvas backing stores, encoding and display copies.
  const estimatedBytes = width * height * 20 + w * h * 4;
  if (width > 16384 || height > 16384 || estimatedBytes > 768 * 1024 * 1024)
    throw new Error(
      "输出超过安全内存预算（约 768 MiB 或单边 16384）。请先裁剪原图，或选择原生 2× 模型。",
    );
  return estimatedBytes;
}
export function retrySizes(size: number) {
  return [256, 192, 128, 96, 64].filter((n) => n <= size);
}
