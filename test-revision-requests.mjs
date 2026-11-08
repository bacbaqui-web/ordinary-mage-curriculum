import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm,stat} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createGameServer} from './server/index.mjs';
test('requests persist, stay private, validate input, and reject stale writes',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'mage-requests-')),file=join(dir,'requests.json');let app;
 async function start(){app=createGameServer({requestsFile:file});await new Promise(r=>app.server.listen(0,'127.0.0.1',r));return `http://127.0.0.1:${app.server.address().port}/api/revision-requests`;}
 let url=await start();const token='a'.repeat(64),other='b'.repeat(64);
 async function call(path='',body,auth=token,extra={}){const r=await fetch(url+path,{method:body?'PUT':'GET',headers:{Authorization:'Bearer '+auth,'Content-Type':'application/json',...extra},...(body?{body:JSON.stringify(body)}:{})});return{status:r.status,data:await r.json()};}
 try{
  assert.equal((await call('')).data.items.length,0);
  assert.equal((await call('/qqw',{text:'소리를 짧게 하고 <script>를 글자로 남기기',version:0})).status,200);
  assert.equal((await call('',undefined,other)).data.items.length,0);
  assert.equal((await call('',undefined,'bad')).status,401);
  assert.equal((await call('/qqw',{text:'덮어쓰기',version:0})).status,409);
  assert.equal((await call('/invalid',{text:'오류',version:0})).status,400);
  assert.equal((await call('/q',{text:'가'.repeat(2001),version:0})).status,400);
  assert.equal((await call('/q',{text:'가'.repeat(2000),version:0})).status,200);
  assert.equal((await call('/i',{text:'외부',version:0},token,{Origin:'https://example.org'})).status,403);
  const preflight=await fetch(url,{method:'OPTIONS',headers:{Origin:'https://bacbaqui-web.github.io'}});assert.equal(preflight.status,204);assert.equal(preflight.headers.get('access-control-allow-origin'),'https://bacbaqui-web.github.io');
  await app.close();url=await start();const records=(await call()).data.items;assert.equal(records.length,2);assert.match(records.find(x=>x.sequence==='qqw').text,/<script>/);
  assert.equal((await stat(file)).mode&0o777,0o600);
  assert.equal((await call('/qqw',{text:'수정한 내용',version:1})).data.item.version,2);
 }finally{await app.close();await rm(dir,{recursive:true,force:true});}
});
