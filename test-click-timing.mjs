import assert from 'node:assert/strict';
import {QueuedCharge} from './dist/queued-charge.mjs';
import {Duel} from './dist/duel.mjs';
for(const held of [0,.01,.1,.3,1.19,1.3]){
 const q=new QueuedCharge();q.enqueue('q');q.enqueue('w');q.begin();q.tick(held);q.requestRelease();
 const wait=Math.max(0,2/12-held)+2/12;
 assert.ok(held+wait>=4/12-1e-9);
 q.tick(wait-.001);assert.equal(q.takeRelease(),null);
 q.tick(.001);assert.ok(q.releasePose);const result=q.takeRelease();assert.equal(result.parts.length,1);assert.equal(result.completedRings,held>=1.2?1:0);
 assert.equal(q.takeRelease(),null);
}
for(const hand of ['left','right']){
 let emitted=0;const d=new Duel([{q:'i',w:'q',e:'w'},{q:'q',w:'i',e:'w'}],{onCast:()=>emitted++});
 d.input(0,{action:'queue',key:'q'});d.input(0,{action:'begin',hand,point:{x:0,z:4}});d.input(0,{action:'release',point:{x:0,z:4}});
 for(let i=0;i<16;i++)d.step(.01);assert.equal(emitted,0);assert.equal(d.actors[0].charge.releasePose,false);
 d.step(.01);assert.equal(d.actors[0].charge.releasePose,true);assert.equal(emitted,0);
 const copy=new Duel([{q:'i',w:'q',e:'w'},{q:'q',w:'i',e:'w'}]);copy.correct(d.snapshot());assert.equal(copy.actors[0].charge.releasePose,true);copy.dispose();
 for(let i=0;i<16;i++)d.step(.01);assert.equal(emitted,0);
 d.step(.01);assert.equal(emitted,1);assert.ok(d.magic.ice.effects.some(e=>e.type===(hand==='left'?'shot':'iceMist')));
 for(let i=0;i<50;i++)d.step(.01);assert.equal(emitted,1);d.dispose();
}
console.log('PASS: minimum four-frame click, separate charge/release phases, frozen tier, authoritative emission and snapshot');
