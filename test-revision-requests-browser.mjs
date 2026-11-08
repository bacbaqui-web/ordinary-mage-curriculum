import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdtemp,rm,readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {createGameServer} from './server/index.mjs';
const dir=await mkdtemp(join(tmpdir(),'mage-request-browser-')),file=join(dir,'requests.json');let app=createGameServer({requestsFile:file});await new Promise(r=>app.server.listen(0,'127.0.0.1',r));const port=app.server.address().port,base=`http://127.0.0.1:${port}/`;
const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'}),page=await browser.newPage({viewport:{width:1440,height:1100}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
try{
 await page.goto(base+'skill-plan.html#qqw');await page.locator('#spellRequest').fill('불꽃 소리를 짧게 해 주세요. <img src=x onerror=alert(1)>');await page.waitForFunction(()=>document.querySelector('[data-request-status]').textContent==='서버에 저장했습니다.');
 assert.equal((await page.locator('.request-badge').count())>0,true);
 await page.locator('#bases [data-seq="i"]').click();await page.locator('#spellRequest').fill('얼음 파편을 더 크게');
 // Changing selection immediately must flush the draft to the correct combination.
 await page.locator('#bases [data-seq="q"]').click();await page.waitForTimeout(1400);await page.reload();
 await page.locator('#requestTotal').click();await page.getByRole('button',{name:/화염 → 화염 → 밀기 · 불꽃/}).click();assert.match(await page.locator('#spellRequest').inputValue(),/불꽃 소리/);assert.equal(await page.locator('#requestList img').count(),0);
 await app.close();app=createGameServer({requestsFile:file});await new Promise(r=>app.server.listen(port,'127.0.0.1',r));await page.reload();await page.waitForFunction(()=>document.querySelector('#spellRequest').value.includes('불꽃'));
 // Offline failure keeps a draft through reload, then an explicit retry saves it.
 await page.route('**/api/revision-requests/**',r=>r.abort());await page.locator('#spellRequest').fill('연결 실패 때 보관할 초안');await page.waitForTimeout(1200);await page.reload();assert.equal(await page.locator('#spellRequest').inputValue(),'연결 실패 때 보관할 초안');await page.unroute('**/api/revision-requests/**');await page.locator('[data-save-request]').click();await page.waitForFunction(()=>document.querySelector('[data-request-status]').textContent==='서버에 저장했습니다.');
 const db=JSON.parse(await readFile(file));assert.equal(db.items.find(x=>x.sequence==='i').text,'얼음 파편을 더 크게');assert.equal(db.items.find(x=>x.sequence==='qqw').text,'연결 실패 때 보관할 초안');
 await page.locator('#revisionRequest').scrollIntoViewIfNeeded();await page.screenshot({path:'outputs/revision-requests.png'});assert.deepEqual(errors,[]);console.log('PASS browser: per-combination autosave, immediate navigation, list, no HTML execution, server restart, offline draft and retry');
}finally{await browser.close();await app.close();await rm(dir,{recursive:true,force:true});}
