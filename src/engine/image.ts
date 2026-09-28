export async function decode(file:Blob):Promise<HTMLImageElement> {
  const url=URL.createObjectURL(file),image=new Image()
  try {image.src=url;await image.decode();return image} finally {URL.revokeObjectURL(url)}
}
export function canvas(w:number,h:number) {const c=document.createElement('canvas');c.width=w;c.height=h;return c}
export function pixels(image:HTMLImageElement) {
  const c=canvas(image.naturalWidth,image.naturalHeight),ctx=c.getContext('2d',{willReadFrequently:true})!
  ctx.drawImage(image,0,0);return ctx.getImageData(0,0,c.width,c.height).data
}
export function combine(rgb:Uint8ClampedArray,w:number,h:number,source:HTMLImageElement,scale:number) {
  const native=canvas(w,h),ctx=native.getContext('2d')!
  ctx.putImageData(new ImageData(new Uint8ClampedArray(rgb),w,h),0,0)
  // Only alpha is read by destination-in; RGB remains entirely AI-generated.
  ctx.globalCompositeOperation='destination-in';ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.drawImage(source,0,0,w,h)
  if(w===source.naturalWidth*scale)return native
  const out=canvas(source.naturalWidth*scale,source.naturalHeight*scale),o=out.getContext('2d')!
  o.imageSmoothingEnabled=true;o.imageSmoothingQuality='high';o.drawImage(native,0,0,out.width,out.height);native.width=0;native.height=0;return out
}
export async function encode(c:HTMLCanvasElement,type:string,quality:number):Promise<Blob> {
  let target=c
  if(type==='image/jpeg'){target=canvas(c.width,c.height);const ctx=target.getContext('2d')!;ctx.fillStyle='#fff';ctx.fillRect(0,0,c.width,c.height);ctx.drawImage(c,0,0)}
  const blob=await new Promise<Blob>((resolve,reject)=>target.toBlob(b=>b?resolve(b):reject(new Error('浏览器无法编码此图片，请减小输出。')),type,quality))
  if(target!==c){target.width=0;target.height=0}
  return blob
}
