import assert from 'node:assert/strict';
import {Duel} from './dist/duel.mjs';
import {castControlsLocked} from './dist/cast-lock.mjs';
for(const rune of ['i','q','w'])for(const hand of ['left','right']){
 const d=new Duel([{q:rune,w:rune==='w'?'i':'w',e:'e'},{q:'q',w:'w',e:'e'}]),a=d.actors[0];a.x=0;a.z=10;
 const east={x:8,z:10},north={x:0,z:18};
 d.input(0,{action:'queue',key:'q'});d.input(0,{action:'begin',hand,point:east});
 for(let i=0;i<5;i++){d.input(0,{action:'move',point:north});d.input(0,{action:'aim',point:north});d.input(0,{action:'roll',point:north});d.step();}
 assert.equal(a.x,0);assert.equal(a.z,10);assert.ok(a.dir.x>.999);assert.equal(a.roll.active,false);
 d.input(0,{action:'release',point:north});
 for(let i=0;i<10;i++){d.step();d.input(0,{action:'aim',point:north});assert.ok(a.dir.x>.999);assert.equal(a.x,0);assert.equal(a.z,10);}
 const copy=new Duel([{q:rune,w:rune==='w'?'i':'w',e:'e'},{q:'q',w:'w',e:'e'}]);copy.correct(d.snapshot());assert.equal(copy.actors[0].castControlLock,a.castControlLock);copy.dispose();
 for(let i=0;i<60&&castControlsLocked(a);i++)d.step();
 assert.equal(castControlsLocked(a),false);d.input(0,{action:'aim',point:north});d.input(0,{action:'move',point:north});d.step();assert.ok(a.dir.z>.99);assert.ok(a.z>10);d.dispose();
}
console.log('PASS: charge, pending release and casting lock movement/aim/roll for both buttons; controls and snapshot recover');
