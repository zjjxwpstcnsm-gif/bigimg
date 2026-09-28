import {test,expect} from '@playwright/test'
import fs from 'node:fs'
const ids=['nomos-weak','nomos-standard','nomos-strong','clearreality','realesrgan-x2','realesrgan-x4','remacri','ultrasharp','nomos-dat']
for(const id of ids)test(`${id}: real WASM inference, alpha, dimensions and download`,async({page},info)=>{
 const errors:string[]=[],failed:string[]=[];page.on('pageerror',e=>errors.push(String(e)));page.on('response',r=>{if(r.status()>=400)failed.push(r.url()+':'+r.status())});page.on('request',r=>{expect(['GET','HEAD']).toContain(r.method())})
 await page.goto('./');await page.getByLabel('选择模型',{exact:true}).selectOption(id);await page.getByText('高级设置',{exact:false}).click();await page.getByLabel('Acceleration',{exact:true}).selectOption('wasm');await page.getByLabel('Tile',{exact:true}).selectOption('64')
 await page.getByRole('button',{name:'64 × 64 ↗'}).click();await page.getByRole('button',{name:'开始 AI 超分'}).click()
 await expect(page.getByRole('button',{name:'下载图片'})).toBeVisible({timeout:270000})
 const metrics=await page.getByTestId('metrics').innerText();expect(metrics).toContain(id==='realesrgan-x2'?'128 × 128':'256 × 256');expect(metrics).toContain('CPU / WASM')
 await page.getByLabel('Before After 对比').fill('30')
 const downloadPromise=page.waitForEvent('download');await page.getByRole('button',{name:'下载图片'}).click();const download=await downloadPromise;await download.saveAs(info.outputPath(download.suggestedFilename()))
 const alpha=await page.locator('img[alt="AI 超分结果"]').evaluate(async img=>{const i=img as HTMLImageElement;await i.decode();const c=document.createElement('canvas');c.width=i.naturalWidth;c.height=i.naturalHeight;const x=c.getContext('2d')!;x.drawImage(i,0,0);const d=x.getImageData(0,0,c.width,c.height).data;return {width:c.width,height:c.height,cornerAlpha:d[3],opaqueAlpha:d[(Math.floor(c.height/2)*c.width+Math.floor(c.width/2))*4+3]}})
 expect(alpha.cornerAlpha).toBe(0);expect(alpha.opaqueAlpha).toBe(255);expect(errors).toEqual([]);expect(failed).toEqual([])
 await page.screenshot({path:info.outputPath('result.png'),fullPage:true});await info.attach('metrics',{body:JSON.stringify({id,metrics,alpha,errors,failed}),contentType:'application/json'})
})
test('128px tiles, cache, cancellation and 375px layout',async({page},info)=>{
 await page.goto('./');await page.getByText('高级设置',{exact:false}).click();await page.getByLabel('Acceleration',{exact:true}).selectOption('wasm');await page.getByLabel('Tile',{exact:true}).selectOption('64');await page.getByRole('button',{name:'128 × 128 ↗'}).click();await page.getByRole('button',{name:'开始 AI 超分'}).click();await expect(page.getByRole('button',{name:'下载图片'})).toBeVisible({timeout:120000});await expect(page.getByRole('status')).toContainText('4 / 4 Tiles');await expect(page.getByTestId('metrics')).toContainText('512 × 512');await expect(page.getByText('Cached · 已缓存',{exact:true})).toBeVisible()
 await page.getByRole('button',{name:'开始 AI 超分'}).click();await page.getByRole('button',{name:'取消 · Cancel'}).click();await expect(page.getByRole('status')).toContainText('Cancelled');await expect(page.getByRole('button',{name:'开始 AI 超分'})).toBeEnabled()
 await page.setViewportSize({width:375,height:812});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.screenshot({path:info.outputPath('mobile.png'),fullPage:true});await page.getByLabel('选择模型',{exact:true}).selectOption('nomos-weak');await page.getByRole('button',{name:'清理模型缓存'}).click();await expect(page.getByText('按需下载',{exact:true})).toBeVisible()
})
test('default backend feature detection is honest',async({page})=>{await page.goto('./');await page.getByRole('button',{name:'64 × 64 ↗'}).click();await page.getByRole('button',{name:'开始 AI 超分'}).click();await expect(page.getByRole('button',{name:'下载图片'})).toBeVisible({timeout:120000});expect(await page.getByTestId('metrics').innerText()).toMatch(/CPU \/ WASM|WebGPU/);fs.mkdirSync('test-results',{recursive:true})})
