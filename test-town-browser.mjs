import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {createGameServer} from './server/index.mjs';
const app=createGameServer();await new Promise(r=>app.server.listen(0,'127.0.0.1',r));const url=`http://127.0.0.1:${app.server.address().port}`;
const browser=await chromium.launch({headless:true,...(process.platform==='darwin'?{executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'}:{})});
const errors=[];try{
 await mkdir('output/town-map',{recursive:true});const page=await browser.newPage({viewport:{width:1600,height:1100}});page.on('pageerror',e=>errors.push(e.message));
 await page.goto(url+'/town-map.html');await page.waitForFunction(()=>window.townDebug);assert.equal((await page.evaluate(()=>townDebug())).camera,'OrthographicCamera');
 await page.screenshot({path:'output/town-map/overview.png'});
 for(const id of['mart','factory','park','office']){await page.locator(`[data-view="${id}"]`).click();assert.equal((await page.evaluate(()=>townDebug())).span,64);await page.screenshot({path:`output/town-map/${id}.png`});}
 await page.setViewportSize({width:800,height:1000});await page.locator('[data-view="all"]').click();await page.screenshot({path:'output/town-map/narrow.png'});await page.setViewportSize({width:1600,height:1100});
 await page.goto(url);await page.waitForFunction(()=>window.mageDebug);await page.locator('#confirmSelection').click();await page.waitForFunction(()=>mageDebug().monsters.length>0);const before=await page.evaluate(()=>mageDebug());
 await page.keyboard.down('d');await page.waitForTimeout(600);await page.keyboard.up('d');const after=await page.evaluate(()=>mageDebug());assert(after.player.x>before.player.x+.4);assert(after.player.z<before.player.z-.4);assert.equal(after.camera.type,'OrthographicCamera');
 await page.mouse.move(1000,500);await page.mouse.down();await page.waitForTimeout(160);await page.mouse.up();await page.waitForFunction(()=>mageDebug().history.length>0);
 await page.screenshot({path:'output/town-map/combat.png'});await page.getByRole('button',{name:'전체 지도',exact:true}).click();assert.equal((await page.evaluate(()=>mageDebug())).map.overview,true);await page.screenshot({path:'output/town-map/game-overview.png'});await page.getByRole('button',{name:'전투 시점',exact:true}).click();assert.equal((await page.evaluate(()=>mageDebug())).map.overview,false);
 assert.deepEqual(errors,[]);console.log('PASS: four real 3D district views, narrow viewport, WASD movement, casting, orthographic game camera and overview toggle; no browser errors');
}finally{await browser.close();await app.close();}
