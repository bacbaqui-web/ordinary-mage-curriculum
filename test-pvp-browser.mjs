import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {createGameServer} from './server/index.mjs';
const remote=process.env.PVP_TEST_URL;
const app=remote?null:createGameServer();if(app)await new Promise(r=>app.server.listen(0,'127.0.0.1',r));
const base=remote||`http://127.0.0.1:${app.server.address().port}/`;
const browser=await chromium.launch({headless:true,...(process.platform==='darwin'?{executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'}:{})});
const errors=[];
async function page(){const context=await browser.newContext({viewport:{width:1440,height:1000}});const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto(base);await page.waitForFunction(()=>!!window.mageDebug&&!!document.querySelector('#modePvp'));return page;}
async function world(page,x,z){return page.evaluate(async({x,z})=>{const T=await import('./three.module.js'),c=window.mageDebug().camera,camera=new T.PerspectiveCamera(c.fov,c.aspect,.1,200);camera.position.fromArray(c.position);camera.quaternion.fromArray(c.quaternion);camera.updateMatrixWorld();const v=new T.Vector3(x,0,z).project(camera);return{x:(v.x+1)*innerWidth/2,y:(1-v.y)*innerHeight/2};},{x,z});}
async function aim(page,x,z){const p=await world(page,x,z);await page.mouse.move(p.x,p.y);return p;}
async function move(page,x,z){const p=await aim(page,x,z);await page.mouse.click(p.x,p.y,{button:'right'});}
async function tap(page,key,x,z){await page.keyboard.press(key);const p=await aim(page,x,z);await page.mouse.click(p.x,p.y);}
try{
 const ai=await page();await ai.locator('#confirmSelection').click();await ai.waitForFunction(()=>window.mageDebug().running&&window.mageDebug().monsters.length>0);assert.equal((await ai.evaluate(()=>mageDebug())).bot,true);await ai.locator('#botToggle').click();assert.equal((await ai.evaluate(()=>mageDebug())).bot,false);await ai.close();
 const a=await page(),b=await page();await a.locator('#modePvp').click();await a.locator('#createRoom').click();await a.waitForFunction(()=>document.querySelector('#activeRoomCode').textContent.length===6);const code=await a.locator('#activeRoomCode').textContent();await b.locator('#modePvp').click();await b.locator('#roomCode').fill(code);await b.locator('#joinRoom').click();await b.waitForFunction(()=>!document.querySelector('#pvpRoom').classList.contains('hidden'));
 // A single ready player must remain in the lobby; typing a code must not enqueue spells.
 await a.screenshot({path:'/tmp/mage-pvp-room.png'});assert.equal((await b.evaluate(()=>mageDebug())).charge.queue.length,0);await a.locator('#readyRoom').click();await a.waitForTimeout(200);await a.keyboard.press('w');assert.equal(await a.locator('[data-rune]:enabled').count(),0);assert.equal(await a.locator('#selection').isVisible(),true);await b.locator('#readyRoom').click();await Promise.all([a,b].map(p=>p.waitForFunction(()=>window.mageDebug().online&&window.mageDebug().running)));
 await a.screenshot({path:'/tmp/mage-pvp-match.png'});
 await move(a,-1,0);await a.waitForFunction(()=>Math.hypot(mageDebug().player.x+1,mageDebug().player.z)<.4,{},{timeout:10000});await move(b,1,0);await b.waitForFunction(()=>Math.hypot(mageDebug().player.x-1,mageDebug().player.z)<.4,{},{timeout:10000});
 const [da,db]=await Promise.all([a,b].map(p=>p.evaluate(()=>mageDebug())));assert.ok(Math.hypot(da.player.x-db.enemy.x,da.player.z-db.enemy.z)<.25);assert.equal(da.monsters.length,0);assert.equal(db.monsters.length,0);
 await tap(a,'q',1,0);await b.waitForFunction(()=>mageDebug().player.hp<100);await a.waitForTimeout(100);const hitA=await a.evaluate(()=>mageDebug()),hitB=await b.evaluate(()=>mageDebug());assert.ok(Math.abs(hitA.enemy.hp-hitB.player.hp)<3);
 // The other participant can attack too; repeated casts finish an actual match.
 await tap(b,'q',-1,0);await a.waitForFunction(()=>mageDebug().player.hp<100);await a.screenshot({path:'/tmp/mage-pvp-combat.png'});
 for(let i=0;i<35;i++){if((await a.evaluate(()=>mageDebug())).finished)break;const target=(await a.evaluate(()=>mageDebug())).enemy;await move(a,target.x-.9,target.z);await a.waitForTimeout(300);if((await a.evaluate(()=>mageDebug())).finished)break;await tap(a,'q',target.x,target.z);await a.waitForTimeout(420);}
 await a.waitForFunction(()=>mageDebug().finished,{},{timeout:8000});await b.waitForFunction(()=>mageDebug().finished);assert.equal(await a.locator('#resultTitle').textContent(),'승리');assert.equal(await b.locator('#resultTitle').textContent(),'패배');
 await a.locator('#again').click();await b.locator('#again').click();await a.locator('#readyRoom').click();await b.locator('#readyRoom').click();await Promise.all([a,b].map(p=>p.waitForFunction(()=>mageDebug().running&&!mageDebug().finished&&mageDebug().online?.tick>1)));assert.equal((await a.evaluate(()=>mageDebug())).player.hp,100);
 await b.close();await a.waitForFunction(()=>!mageDebug().online&&!document.querySelector('#selection').classList.contains('hidden'));await a.locator('#modeAI').click();await a.locator('#confirmSelection').click();await a.waitForFunction(()=>mageDebug().running&&mageDebug().monsters.length>0);assert.equal((await a.evaluate(()=>mageDebug())).online,null);
 assert.deepEqual(errors,[]);console.log('PASS browser: AI/practice preserved, room join, readiness, both players move/cast, shared HP, win/loss, rematch, disconnect, return to AI');
}catch(error){console.log('Browser errors:',errors);for(const context of browser.contexts())for(const p of context.pages()){console.log(await p.evaluate(()=>({state:mageDebug(),result:document.querySelector('#result').className,selection:document.querySelector('#selection').className})).catch(()=>null));}throw error;}finally{await browser.close();if(app)await app.close();}
