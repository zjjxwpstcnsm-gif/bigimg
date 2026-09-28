import {describe,it,expect} from 'vitest'
import {tiles,packTile,mergeTile,reflect,outputDimensions,guardSize,retrySizes} from '../src/engine/tiles'
import {models} from '../src/models/modelRegistry'
describe('Tile coverage',()=>{
 for(const [w,h] of [[256,256],[257,257],[1024,1536],[3,7],[511,95],[1,1025]]) for(const size of [64,96,128,192,256]) it(`${w}×${h} with ${size}`,()=>{
  const coverage=new Uint8Array(w*h)
  for(const t of tiles(w,h,size,24)){expect(t.inputSize).toBe(size+48);for(let y=t.y;y<t.y+t.height;y++)for(let x=t.x;x<t.x+t.width;x++)coverage[y*w+x]++}
  expect(coverage.every(x=>x===1)).toBe(true)
 })
 it('reflection works for padding larger than the input',()=>{expect([-2,-1,0,1,2,3,4].map(i=>reflect(i,3))).toEqual([2,1,0,1,2,1,0]);expect(reflect(55,1)).toBe(0)})
 it('RGB pack and overlap crop reconstruct an odd image without seam or gaps',()=>{
  const w=67,h=73,scale=4,src=new Uint8ClampedArray(w*h*4),out=new Uint8ClampedArray(w*h*scale*scale*4)
  for(let i=0;i<src.length;i++)src[i]=(i*17)%256
  for(const t of tiles(w,h,64,24)){
   const packed=packTile(src,w,h,t),n=t.inputSize,up=new Float32Array(n*n*scale*scale*3)
   // Synthetic nearest-neighbour tensor tests the merge geometry, not AI inference.
   for(let c=0;c<3;c++)for(let y=0;y<n*scale;y++)for(let x=0;x<n*scale;x++)up[c*n*n*scale*scale+y*n*scale+x]=packed[c*n*n+Math.floor(y/scale)*n+Math.floor(x/scale)]
   mergeTile(out,w*scale,up,t,scale)
  }
  for(let y=0;y<h*scale;y++)for(let x=0;x<w*scale;x++)for(let c=0;c<3;c++)expect(out[(y*w*scale+x)*4+c]).toBe(src[(Math.floor(y/scale)*w+Math.floor(x/scale))*4+c])
 })
 it('dimensions, memory guard, bounded retries',()=>{expect(outputDimensions(1080,1920,2)).toEqual({width:2160,height:3840});expect(()=>guardSize(8000,8000,4)).toThrow();expect(()=>guardSize(1080,1920,4)).not.toThrow();expect(retrySizes(256)).toEqual([256,192,128,96,64])})
})
describe('Model registry',()=>{
 it('has nine distinct, licensed weights',()=>{expect(models).toHaveLength(9);expect(new Set(models.map(m=>m.id)).size).toBe(9);expect(new Set(models.map(m=>m.sha256)).size).toBe(9)
  for(const m of models){expect([2,4]).toContain(m.scale);expect(m.modelUrl).toMatch(/^models\/.*\.onnx$/);expect(m.sha256).toMatch(/^[a-f0-9]{64}$/);expect(m.author).toBeTruthy();expect(m.license).toBeTruthy();expect(m.attribution).toBe(true);expect(new URL(m.originalUrl).protocol).toBe('https:');if(m.license.includes('NC'))expect(m.commercialUse).toBe(false)}
 })
})
