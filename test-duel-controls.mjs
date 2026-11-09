import test from 'node:test';
import assert from 'node:assert/strict';
import {mouseRecipe,bindDuelControls} from './dist/duel-controls.mjs';
import {QueuedCharge} from './dist/queued-charge.mjs';
test('mouse recipes respect learned runes and barrier fallback',()=>{
 assert.deepEqual(mouseRecipe(1,{q:1,w:1,e:1}),['q','w']);
 assert.deepEqual(mouseRecipe(2,{q:1,w:1,e:1}),['q','e']);
 assert.deepEqual(mouseRecipe(3,{q:1,w:1,e:1}),['q','w','e']);
 assert.deepEqual(mouseRecipe(3,{q:1,w:0,e:0}),['q']);
 assert.deepEqual(mouseRecipe(3,{q:0,w:1,e:0}),['w']);
});
test('tap, full pair and full triple release only completed rings',()=>{
 for(const [buttons,seconds,count] of [[1,.1,1],[2,.1,1],[1,2.4,2],[2,2.4,2],[3,3.6,3]]){
 const c=new QueuedCharge();mouseRecipe(buttons,{q:1,w:1,e:1}).forEach(k=>c.enqueue(k));c.begin();c.tick(seconds);assert.equal(c.release().parts.length,count);
 }
});
test('second mouse button extends as triple; two releases only cast once; blur clears movement',()=>{
 const canvas=new EventTarget(),target=new EventTarget(),begins=[],moves=[];let casts=0,cancels=0;
 bindDuelControls(canvas,target,{enabled:()=>true,begin:(b,e,extending)=>begins.push([b,extending]),release:()=>casts++,cancel:()=>cancels++,walk:d=>moves.push(d)});
 const send=(t,type,fields)=>{const e=new Event(type,{cancelable:true});Object.assign(e,fields);t.dispatchEvent(e);};
 send(canvas,'mousedown',{button:2});send(canvas,'mousedown',{button:0});send(target,'mouseup',{button:2});send(target,'mouseup',{button:0});assert.deepEqual(begins,[[2,false],[3,true]]);assert.equal(casts,1);
 send(target,'keydown',{code:'KeyW'});assert.ok(moves.at(-1).z<0);send(target,'blur',{});assert.deepEqual(moves.at(-1),{x:0,z:0});assert.equal(cancels,1);
});
test('extending preserves partial and completed charge in either button order',()=>{
 for(const pair of [['q','w'],['q','e']])for(const elapsed of [.7,1.8,2.4]){
 const c=new QueuedCharge();pair.forEach(k=>c.enqueue(k));c.begin();c.tick(elapsed);c.extend(['q','w','e']);
 assert.equal(c.elapsed,elapsed);assert.deepEqual(c.queue,[...pair,pair[1]==='w'?'e':'w']);
 c.tick(3.6-elapsed);assert.equal(c.release().parts.length,3);
 }
});
test('no banked overcharge, no duplicate extension, and damage setback survives extension',()=>{
 const c=new QueuedCharge();c.enqueue('q');c.enqueue('w');c.begin();c.tick(10);c.disrupt(.4);c.extend(['q','w','e']);assert.equal(c.elapsed,2);c.extend(['q','w','e']);assert.equal(c.queue.length,3);assert.equal(c.release().parts.length,1);
});
