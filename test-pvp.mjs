import test from 'node:test';
import assert from 'node:assert/strict';
import {WebSocket} from 'ws';
import {Duel,STEP,validInput} from './dist/duel.mjs';
import {createGameServer} from './server/index.mjs';
import {DEFAULT_LOADOUT} from './dist/live-loadout.mjs';
const loads=[DEFAULT_LOADOUT,DEFAULT_LOADOUT];
const steps=(d,n)=>{for(let i=0;i<n;i++)d.step();};
const cast=(d,id,keys,point,chargeTicks=0)=>{for(const key of keys)d.input(id,{action:'queue',key});d.input(id,{action:'begin',point});steps(d,chargeTicks);d.input(id,{action:'release',point});};
test('server validates input, movement speed and collisions',()=>{
 const d=new Duel(loads);assert.equal(validInput({action:'move',point:{x:Infinity,z:0}}),false);assert.equal(validInput({action:'queue',key:'q',point:{x:'bad',z:0}}),false);assert.equal(d.input(0,{action:'damage',damage:9999}),false);
 const a=d.actors[0],x=a.x,z=a.z;d.input(0,{action:'move',point:{x:20,z:4}});steps(d,30);assert.ok(Math.hypot(a.x-x,a.z-z)<=4.401);assert.equal(d.actors[1].x,5);a.x=-6;a.z=-2;d.input(0,{action:'move',point:{x:0,z:-2}});steps(d,60);assert.ok(a.x<=-5.9);d.dispose();
});
test('both fighters use identical charge, damage, mana and roll immunity',()=>{
 const d=new Duel(loads),[a,b]=d.actors;a.x=0;a.z=0;b.x=1.5;b.z=0;
 cast(d,0,['q'],{x:2,z:0});assert.ok(b.hp<100);assert.equal(a.mana,96);const mana=a.mana,hp=b.hp;cast(d,0,['q'],{x:2,z:0});assert.equal(b.hp,hp);assert.equal(a.mana,mana);
 d.dispose();
 for(const id of [0,1]){const duel=new Duel([{q:'l',w:'w',e:'e'},{q:'l',w:'w',e:'e'}]),actor=duel.actors[id],source=duel.actors[1-id];duel.input(id,{action:'roll',point:{x:actor.x+1,z:actor.z}});assert.equal(duel.hit(actor,20,source.dir,0,source),false);steps(duel,9);assert.equal(duel.hit(actor,20,source.dir,0,source),true);assert.equal(actor.hp,80);duel.dispose();}
});
test('charge time and mana cannot be supplied by the client; hits disrupt charging',()=>{
 const d=new Duel(loads),a=d.actors[0];for(const key of ['q','q','q'])d.input(0,{action:'queue',key});d.input(0,{action:'begin',point:{x:2,z:0},elapsed:999});steps(d,45);assert.equal(a.charge.parts.length,2);d.hit(a,10,d.actors[1].dir,0,d.actors[1]);assert.ok(a.charge.elapsed<1.2);assert.equal(a.charge.parts.length,1);a.mana=0;d.input(0,{action:'release',point:{x:2,z:0}});assert.equal(d.magic.fire.effects.length,0);d.dispose();
});
test('snapshot replay preserves combat state and result; cleanup removes spell objects',()=>{
 const server=new Duel(loads),client=new Duel(loads);server.actors[0].x=0;server.actors[0].z=0;server.actors[1].x=1;server.actors[1].z=0;client.correct(server.snapshot());
 const inputs=[{action:'queue',key:'q'},{action:'begin',point:{x:1,z:0}},{action:'release',point:{x:1,z:0}}];for(const input of inputs){server.input(0,input);client.input(0,input);}for(let i=0;i<90;i++){server.step();client.step();client.correct(server.snapshot());assert.deepEqual(client.snapshot().actors,server.snapshot().actors);}server.hit(server.actors[1],999,server.actors[0].dir,0,server.actors[0]);assert.equal(server.winner,0);assert.equal(server.finished,true);assert.equal(server.input(1,{action:'queue',key:'q'}),false);server.dispose();client.dispose();assert.equal(server.scene.children.length,0);assert.equal(client.scene.children.length,0);
});
function socket(url){return new Promise((resolve,reject)=>{const ws=new WebSocket(url),messages=[],waiters=[];ws.on('error',reject);ws.on('message',raw=>{const m=JSON.parse(raw);messages.push(m);for(const w of [...waiters])if(w.predicate(m)){waiters.splice(waiters.indexOf(w),1);clearTimeout(w.timer);w.resolve(m);}});ws.on('open',()=>resolve({ws,messages,send:m=>ws.send(JSON.stringify(m)),wait:(predicate,timeout=6000)=>new Promise((resolve,reject)=>{const found=messages.find(predicate);if(found)return resolve(found);const w={predicate,resolve,timer:setTimeout(()=>{waiters.splice(waiters.indexOf(w),1);reject(Error('message timeout'));},timeout)};waiters.push(w);})}));});}
test('real sockets: rooms, ready barrier, authoritative states, full room, rematch, stale input and disconnect',async()=>{
 const app=createGameServer();await new Promise(r=>app.server.listen(0,'127.0.0.1',r));const address=`127.0.0.1:${app.server.address().port}`;const clients=[];
 try{const a=await socket(`ws://${address}/pvp`),b=await socket(`ws://${address}/pvp`),c=await socket(`ws://${address}/pvp`);clients.push(a,b,c);
 assert.equal((await fetch(`http://${address}/health`)).status,200);assert.equal((await fetch(`http://${address}/server/index.mjs`)).status,404);
 b.send({type:'join',code:'XXXXXX'});assert.match((await b.wait(m=>m.type==='error')).message,/방을 찾을/);
 a.send({type:'create'});const {code}=await a.wait(m=>m.type==='joined');assert.match(code,/^[A-Z2-9]{6}$/);b.send({type:'join',code:code.toLowerCase()});await b.wait(m=>m.type==='joined');c.send({type:'join',code});assert.match((await c.wait(m=>m.type==='error')).message,/두 사람/);
 a.send({type:'ready',ready:true,loadout:DEFAULT_LOADOUT});await a.wait(m=>m.type==='lobby'&&m.players[0]?.ready);assert.equal(app.rooms.get(code).phase,'waiting');b.send({type:'ready',ready:true,loadout:DEFAULT_LOADOUT});const start=await a.wait(m=>m.type==='start');await b.wait(m=>m.type==='go');
 a.send({type:'input',round:start.round,input:{action:'move',point:{x:0,z:0}}});const state=await a.wait(m=>m.type==='tick'&&m.inputs.some(i=>i.input.action==='move'));const other=await b.wait(m=>m.type==='tick'&&m.state.tick===state.state.tick);assert.deepEqual(other.state,state.state);
 const room=app.rooms.get(code);room.core.hit(room.core.actors[1],999,room.core.actors[0].dir,0,room.core.actors[0]);await a.wait(m=>m.type==='tick'&&m.state.finished);assert.equal(room.phase,'ended');a.send({type:'ready',ready:true,loadout:DEFAULT_LOADOUT});b.send({type:'ready',ready:true,loadout:DEFAULT_LOADOUT});const rematch=await a.wait(m=>m.type==='start'&&m.round!==start.round);assert.notEqual(rematch.round,start.round);assert.equal(rematch.state.actors[1].hp,100);await a.wait(m=>m.type==='go'&&m.round===rematch.round);a.send({type:'input',round:start.round,input:{action:'queue',key:'q'}});const next=await a.wait(m=>m.type==='tick'&&m.round===rematch.round&&m.state.tick>3);assert.equal(next.state.actors[0].charge.queue.length,0);
 b.ws.close();await a.wait(m=>m.type==='opponentLeft');assert.equal(room.core,null);assert.equal(room.phase,'waiting');assert.equal(room.players[0].ready,false);a.ws.close();await new Promise(r=>setTimeout(r,50));assert.equal(app.rooms.size,0);
 }finally{for(const c of clients)c.ws.terminate();await app.close();}
});
test('online extension preserves server charge and rejects invalid rune input',()=>{
 const d=new Duel(loads),c=d.actors[0].charge;
 d.input(0,{action:'queue',key:'q'});d.input(0,{action:'queue',key:'w'});d.input(0,{action:'begin',point:{x:0,z:0}});steps(d,48);const elapsed=c.elapsed;
 assert.equal(validInput({action:'extend',keys:['q','bad']}),false);
 assert.equal(validInput({action:'extend',keys:'qwe'}),false);
 d.input(0,{action:'extend',keys:['q','w','e']});assert.equal(c.elapsed,elapsed);assert.deepEqual(c.queue,['q','w','e']);steps(d,60);assert.equal(c.release().parts.length,3);d.dispose();
});
