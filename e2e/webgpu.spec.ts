import {test,expect,chromium} from '@playwright/test'
test('WebGPU adapter probe and real inference when available',async({},info)=>{
 const b=await chromium.launch({args:['--no-sandbox','--enable-unsafe-webgpu','--use-angle=swiftshader']});const page=await b.newPage();page.on('console',m=>console.log('browser:',m.type(),m.text()));await page.goto(process.env.BASE_URL||'http://127.0.0.1:4173/bigimg/')
 const capability=await page.evaluate(async()=>{const gpu=(navigator as unknown as {gpu?:{requestAdapter:()=>Promise<{info:Record<string,string>}|null>}}).gpu;const a=await gpu?.requestAdapter();return {gpu:!!gpu,adapter:!!a,info:a?{vendor:a.info.vendor,architecture:a.info.architecture,device:a.info.device,description:a.info.description}:null}})
 await info.attach('gpu',{body:JSON.stringify(capability),contentType:'application/json'});console.log('WebGPU',capability)
 await page.screenshot({path:info.outputPath('desktop.png'),fullPage:true});await page.setViewportSize({width:375,height:812});await page.screenshot({path:info.outputPath('mobile.png'),fullPage:true})
 if(capability.adapter){await page.getByRole('button',{name:'64 × 64 ↗'}).click();await page.getByRole('button',{name:'开始 AI 超分'}).click();await expect(page.getByRole('button',{name:'下载图片'})).toBeVisible({timeout:120000});console.log(await page.getByTestId('metrics').innerText());await info.attach('gpu-result',{body:await page.getByTestId('metrics').innerText()});expect(await page.getByTestId('metrics').innerText()).toContain('WebGPU')}
 await b.close()
})
