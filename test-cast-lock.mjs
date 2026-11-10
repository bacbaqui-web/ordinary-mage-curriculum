import assert from 'node:assert/strict';
import {Duel} from './dist/duel.mjs';
import {castControlsLocked,followCastAim,chargeTurnScale} from './dist/cast-lock.mjs';
import {Vector3} from './dist/three.module.js';
for(const stage of [1,2]){
 const actor={x:0,z:0,dir:new Vector3(0,0,1),charge:{active:true,parts:Array(stage).fill('q')}};
 followCastAim(actor,{x:10,z:0},.05);assert.ok(Math.abs(Math.atan2(actor.dir.x,actor.dir.z)-4*Math.PI*.05*(stage===1?.5:.3))<1e-9);
 assert.equal(chargeTurnScale(actor.charge),stage===1?.5:.3);
}
for(const rune of ['i','q','w'])for(const hand of ['left','right']){
 const loads=[{q:rune,w:rune==='w'?'i':'w',e:'e'},{q:'q',w:'w',e:'e'}],d=new Duel(loads),a=d.actors[0];a.x=0;a.z=10;
 d.input(0,{action:'queue',key:'q'});d.input(0,{action:'begin',hand,point:{x:8,z:10}});
 d.input(0,{action:'move',point:{x:0,z:18}});d.input(0,{action:'aim',point:{x:0,z:18}});d.input(0,{action:'roll',point:{x:0,z:18}});
 assert.ok(a.dir.x>.999,'input alone cannot snap a charging actor');d.step(.05);assert.ok(Math.abs(a.z-10-4.4*.3*.05)<1e-8);assert.ok(a.dir.x>0&&a.dir.z>0);assert.equal(a.roll.active,false);
 d.input(0,{action:'release',point:{x:0,z:18}});const position=[a.x,a.z],facing=a.dir.clone();
 for(let i=0;i<10;i++){d.input(0,{action:'aim',point:{x:-9,z:10}});d.step();assert.deepEqual([a.x,a.z],position);assert.ok(a.dir.distanceTo(facing)<1e-8);}
 const copy=new Duel(loads);copy.correct(d.snapshot());assert.equal(copy.actors[0].castControlLock,a.castControlLock);copy.dispose();
 for(let i=0;i<60&&castControlsLocked(a);i++)d.step();assert.equal(castControlsLocked(a),false);d.dispose();
}
const d=new Duel([{q:'i',w:'w',e:'e'},{q:'q',w:'w',e:'e'}]),a=d.actors[0];a.x=0;a.z=10;d.input(0,{action:'queue',key:'q'});d.input(0,{action:'queue',key:'w'});d.input(0,{action:'begin',point:{x:8,z:10}});d.step(1.21);d.input(0,{action:'move',point:{x:0,z:18}});d.input(0,{action:'aim',point:{x:0,z:18}});d.step(.05);assert.equal(a.z,10);assert.ok(a.dir.z>0);d.dispose();
console.log('PASS: first-ring movement 30%, turning 50%/30%, second-ring stationary, release locked and network snapshot preserved');
