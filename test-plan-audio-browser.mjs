import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {createGameServer} from './server/index.mjs';
const remote=process.env.TEST_URL,app=remote?null:createGameServer();if(app)await new Promise(r=>app.server.listen(0,'127.0.0.1',r));
const base=remote||`http://127.0.0.1:${app.server.address().port}/`;
const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
const page=await browser.newPage({viewport:{width:1440,height:1100}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.addInitScript(()=>{
 localStorage.setItem('mage-sound-enabled','false');window.soundEvents=[];window.castTimes=[];window.activeSounds=new Set();
 const original=AudioContext.prototype.createBufferSource;
 AudioContext.prototype.createBufferSource=function(){const source=original.call(this),start=source.start;source.start=function(...args){const samples=source.buffer.getChannelData(0),n=Math.round(source.buffer.sampleRate*.02);let energy=0;for(let i=0;i<n;i++)energy+=samples[i]**2;window.soundEvents.push({onsetRms:Math.sqrt(energy/n),at:performance.now(),loop:source.loop,duration:source.buffer.duration,rate:source.playbackRate.value});window.activeSounds.add(source);source.addEventListener('ended',()=>window.activeSounds.delete(source));return start.apply(source,args);};return source;};
 window.addEventListener('DOMContentLoaded',()=>{let last='';new MutationObserver(()=>{const status=document.querySelector('#atlasPreview [role=status]')?.textContent||'';if(status.startsWith('시전')&&!last.startsWith('시전'))window.castTimes.push(performance.now());last=status;}).observe(document.body,{subtree:true,childList:true,characterData:true});});
});
try{
 await page.goto(base+'skill-plan.html#qqw');await page.locator('#atlasPreview [data-action=restart]').click();
 await page.waitForFunction(()=>window.soundEvents.some(e=>e.loop));
 await page.waitForFunction(()=>window.castTimes.length>0&&window.soundEvents.some(e=>!e.loop),{},{timeout:15000});
 const timing=await page.evaluate(()=>({cast:castTimes[0],sounds:soundEvents.filter(e=>!e.loop)}));assert.ok(Math.abs(timing.sounds[0].at-timing.cast)<100,JSON.stringify(timing));assert.ok(timing.sounds[0].onsetRms>.05,'Fire must be audible within its first 20 ms');assert.ok(timing.sounds.length>=2,'Compound cast must play both layers');await page.waitForFunction(()=>soundEvents.filter(e=>!e.loop).length>=3,{},{timeout:10000});
 await page.locator('#atlasPreview [data-action=restart]').click();await page.waitForFunction(()=>[...window.activeSounds].some(s=>s.loop));
 await page.locator('#atlasPreview [data-action=pause]').click();await page.waitForFunction(()=>window.activeSounds.size===0);
 await page.locator('#bases [data-seq="i"]').click();await page.locator('#atlasPreview [data-action=restart]').click();const before=await page.evaluate(()=>soundEvents.length);await page.waitForFunction(n=>soundEvents.length>n&&soundEvents.slice(n).some(e=>!e.loop),before,{timeout:10000});
 await page.locator('[data-preview-sound]').click();await page.waitForFunction(()=>activeSounds.size===0);const muted=await page.evaluate(()=>soundEvents.length);
 await page.locator('#atlasPreview [data-action=restart]').click();await page.waitForTimeout(1700);assert.equal(await page.evaluate(()=>soundEvents.length),muted);
 assert.equal(await page.evaluate(()=>localStorage.getItem('mage-sound-enabled')),'false');
 await page.locator('[data-preview-sound]').click();await page.locator('#atlasPreview [data-action=restart]').click();await page.waitForFunction(()=>[...activeSounds].some(s=>s.loop));
 await page.locator('h1').scrollIntoViewIfNeeded();await page.waitForFunction(()=>activeSounds.size===0);await page.locator('#planSound').scrollIntoViewIfNeeded();
 await page.screenshot({path:'outputs/plan-audio-synced.png'});assert.deepEqual(errors,[]);
 console.log('PASS: automatic charge/cast synchronized within 100 ms, compound layers, pause, restart, selection, preview mute independent from game, offscreen stop; no browser errors',base);
}finally{await browser.close();if(app)await app.close();}
