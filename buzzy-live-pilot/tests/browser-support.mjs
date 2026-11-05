import {createServer} from 'vite';
import {chromium} from 'playwright';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
export const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export async function browserHarness(onPage=async()=>{}){
  const server=await createServer({root,server:{host:'127.0.0.1',port:5173,strictPort:true},logLevel:'error'});
  try{await server.listen();}catch(e){await server.close();throw e;}
  let browser;
  try{browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});}
  catch(error){await server.close();throw error;}
  const pageErrors=[];
  return {browser,pageErrors,
    async page(width=390){const context=await browser.newContext({viewport:{width,height:844},isMobile:width<600,hasTouch:width<600});const page=await context.newPage();page.on('pageerror',error=>pageErrors.push(error.message));await onPage(page);await page.goto('http://127.0.0.1:5173/');await page.waitForFunction(async()=>{const c=await import('/src/client.js').then(m=>m.getClient());return !!c.uid;});return page;},
    async close(){await browser.close();await server.close();}
  };
}
export const call=(page,input)=>page.evaluate(async input=>{const c=await import('/src/client.js').then(m=>m.getClient());try{return {ok:true,data:await c.command(input)};}catch(e){return {ok:false,code:e.code,message:e.message};}},input);
export const identity=page=>page.evaluate(async()=>{const c=await import('/src/client.js').then(m=>m.getClient());return c.uid;});
export const read=(page,path)=>page.evaluate(async path=>{const c=await import('/src/client.js').then(m=>m.getClient());return c.read(path);},path);
