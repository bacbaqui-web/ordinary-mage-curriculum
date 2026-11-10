import test from 'node:test';import assert from 'node:assert/strict';
import {bindDuelControls} from './dist/duel-controls.mjs';
import {Duel} from './dist/duel.mjs';
const send=(t,type,button)=>{const e=new Event(type,{cancelable:true});e.button=button;t.dispatchEvent(e);};
test('rejected press never releases or starts later when cooldown expires',()=>{
 const canvas=new EventTarget(),target=new EventTarget();let ready=false,started=0,released=0;
 bindDuelControls(canvas,target,{enabled:()=>true,begin:()=>{if(!ready)return false;started++;},release:()=>released++,cancel(){},walk(){}});
 send(canvas,'mousedown',0);ready=true;send(target,'mouseup',0);assert.equal(started,0);assert.equal(released,0);
 send(canvas,'mousedown',0);send(target,'mouseup',0);assert.equal(started,1);assert.equal(released,1);
});
test('rejected opposite button leaves the existing charge intact',()=>{
 const canvas=new EventTarget(),target=new EventTarget();let released=0;
 bindDuelControls(canvas,target,{enabled:()=>true,begin:(buttons,e)=>e.button===2?false:undefined,release:()=>released++,cancel(){},walk(){}});
 send(canvas,'mousedown',0);send(canvas,'mousedown',2);send(target,'mouseup',2);assert.equal(released,0);send(target,'mouseup',0);assert.equal(released,1);
});
test('server denies cooling hand before any charging or release pose, other hand remains available',()=>{
 const d=new Duel([{q:'i',w:'q',e:'w'},{q:'q',w:'i',e:'w'}]),a=d.actors[0];
 a.iceLeftCool=.8;
 d.input(0,{action:'queue',key:'q'});d.input(0,{action:'begin',hand:'left',point:{x:0,z:4}});
 assert.equal(a.charge.active,false);assert.equal(a.charge.pending,null);assert.equal(a.charge.queue.length,0);
 d.input(0,{action:'release',point:{x:0,z:4}});d.step(.4);assert.equal(d.magic.ice.effects.length,0);assert.equal(a.mana,100);
 d.input(0,{action:'queue',key:'q'});d.input(0,{action:'begin',hand:'right',point:{x:0,z:4}});assert.equal(a.charge.active,true);
 d.dispose();
});
