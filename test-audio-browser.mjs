import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {createGameServer} from './server/index.mjs';
const app=createGameServer();await new Promise(r=>app.server.listen(0,'127.0.0.1',r));
const base=`http://127.0.0.1:${app.server.address().port}/`;
const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.url().includes('/audio/')&&r.status()!==200)errors.push(r.url()+': '+r.status());});
async function aim(x,z){const p=await page.evaluate(async({x,z})=>{const T=await import('./three.module.js'),c=mageDebug().camera,camera=new T.PerspectiveCamera(c.fov,c.aspect,.1,200);camera.position.fromArray(c.position);camera.quaternion.fromArray(c.quaternion);camera.updateMatrixWorld();const v=new T.Vector3(x,0,z).project(camera);return{x:(v.x+1)*innerWidth/2,y:(1-v.y)*innerHeight/2};},{x,z});await page.mouse.move(p.x,p.y);}
async function begin(loadout){
 await page.goto(base);await page.evaluate(v=>localStorage.setItem('mage-loadout-v1',JSON.stringify(v)),loadout);await page.reload();
 await page.locator('#confirmSelection').click();await page.locator('#botToggle').click();
 await page.waitForFunction(()=>mageDebug().audio.loaded===14&&mageDebug().audio.state==='running');
 await page.evaluate(()=>{window.audioMax=0;window.audioSample=setInterval(()=>window.audioMax=Math.max(window.audioMax,mageDebug().audio.rms),10);});
}
try{
 const groups=[{q:'q',w:'w',e:'e'},{q:'i',w:'l',e:'d'},{q:'p',w:'t',e:'g'},{q:'s',w:'h',e:'q'}];
 const names={q:'fire',w:'push',e:'barrier',i:'ice',l:'lightning',d:'earth',p:'poison',t:'field',g:'pull',s:'slash',h:'strike'};
 for(const loadout of groups){
  await begin(loadout);
  for(const key of ['q','w','e']){
   await aim(-2,4);await page.keyboard.press(key);await page.mouse.down();
   await page.waitForFunction(()=>mageDebug().audio.charging);await page.waitForTimeout(150);await page.mouse.up();
   await page.waitForFunction(id=>mageDebug().audio.counts[id]>0,names[loadout[key]]);await page.waitForTimeout(400);
  }
  assert.ok(await page.evaluate(()=>audioMax)>.001,'Audio must reach the output analyser');
  assert.deepEqual((await page.evaluate(()=>mageDebug().audio)).failures,[]);
 }
 await aim(-2,4);await page.keyboard.press('Space');await page.waitForFunction(()=>mageDebug().audio.counts.roll>0);
 await page.waitForTimeout(650);await page.keyboard.press('q');await page.mouse.down();await page.waitForFunction(()=>mageDebug().audio.charging);
 await page.keyboard.press('p');await page.waitForTimeout(180);assert.equal((await page.evaluate(()=>mageDebug().audio)).voices,0);await page.mouse.up();await page.keyboard.press('p');
 await page.locator('#soundToggle').click();const before=await page.evaluate(()=>mageDebug().audio.counts);
 await aim(-2,4);await page.keyboard.press('q');await page.mouse.down();await page.mouse.up();await page.waitForTimeout(200);
 assert.deepEqual(await page.evaluate(()=>mageDebug().audio.counts),before);
 await page.reload();assert.equal(await page.locator('#soundToggle').textContent(),'소리 켜기');
 await page.locator('#confirmSelection').click();await page.locator('#soundToggle').click();await page.waitForFunction(()=>mageDebug().audio.loaded===14);
 await page.screenshot({path:'outputs/audio-game.png'});
 assert.deepEqual(errors,[]);console.log('PASS: 14 WAVs decode, 11 rune sounds play through real controls, output has signal, charge loop stops on pause, roll, mute, saved preference; no browser errors');
}finally{await browser.close();await app.close();}
