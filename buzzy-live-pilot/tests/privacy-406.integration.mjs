import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {chromium} from 'playwright';

// #406: the privacy link sits at the bottom of the start page and opens the text in the landing dialog.
test('Privacy link opens and closes the privacy dialog without moving the start page',async()=>{
 const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','5173','--strictPort'],{stdio:'ignore'});
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined});
 try{
  for(let i=0;i<60;i++){try{await fetch('http://127.0.0.1:5173/');break;}catch{await new Promise(r=>setTimeout(r,250));}}
  for(const [width,height] of [[320,568],[390,844],[1280,800]]){
   const page=await browser.newPage({viewport:{width,height}});await page.goto('http://127.0.0.1:5173/');
   const link=page.locator('#privacy-open');await link.waitFor();
   const box=await link.boundingBox(),host=await page.locator('#host-entry').boundingBox();
   assert.ok(box.y>=host.y+host.height,JSON.stringify({width,height,box,host}));
   assert.ok(box.y+box.height<=Math.max(height,await page.evaluate(()=>document.documentElement.scrollHeight))+1);
   assert.ok(await page.evaluate(()=>parseFloat(getComputedStyle(document.getElementById('privacy-open')).fontSize))>=14);
   await link.click();const dialog=page.getByRole('dialog',{name:'Privacy'});await dialog.waitFor();
   assert.match(await dialog.textContent(),/no cookies, ads or analytics/);assert.match(await dialog.textContent(),/deleted when the host ends the game/);
   await page.locator('#privacy-close').click();await dialog.waitFor({state:'hidden'});
   await link.click();await dialog.waitFor();await page.keyboard.press('Escape');await dialog.waitFor({state:'hidden'});
   if(width===390){await link.click();await dialog.waitFor();assert.equal(await page.evaluate(()=>document.getElementById('privacy-dialog').scrollTop),0);await page.waitForTimeout(150);await page.screenshot({path:'reports/privacy-406-dialog.png'});await page.keyboard.press('Escape');await page.screenshot({path:'reports/privacy-406-landing.png'});}
   await page.close();
  }
 }finally{await browser.close();server.kill();}
});
