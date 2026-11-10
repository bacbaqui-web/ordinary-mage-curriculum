import assert from 'node:assert/strict';
import {QueuedCharge} from './dist/queued-charge.mjs';
import {Duel} from './dist/duel.mjs';
for(const held of [0,.01,.1,.3,1.19,1.3]){
 const q=new QueuedCharge();q.enqueue('q');q.enqueue('w');q.begin();q.tick(held);
 const result=q.requestRelease();
 assert.equal(result.parts.length,1);assert.equal(result.completedRings,held>=1.2?1:0);
 assert.equal(result.timed,undefined);assert.equal(q.active,false);assert.equal(q.pending,null);
 assert.equal(q.requestRelease(),null);q.tick(1);assert.equal(q.takeRelease(),null);
}
for(const hand of ['left','right'])for(const held of [0,.3,1.3]){
 let emitted=0;const d=new Duel([{q:'i',w:'q',e:'w'},{q:'q',w:'i',e:'w'}],{onCast:()=>emitted++});
 d.input(0,{action:'queue',key:'q'});d.input(0,{action:'begin',hand,point:{x:0,z:4}});d.actors[0].charge.tick(held);
 d.input(0,{action:'release',point:{x:0,z:4}});
 assert.equal(emitted,1,'release emits immediately without a simulation step');
 assert.ok(d.magic.ice.effects.some(e=>e.type===(hand==='left'?'shot':'iceMist')));
 assert.equal(d.actors[0].charge.active,false);
 const copy=new Duel([{q:'i',w:'q',e:'w'},{q:'q',w:'i',e:'w'}]);copy.correct(d.snapshot());assert.equal(copy.actors[0].charge.active,false);copy.dispose();
 for(let i=0;i<50;i++)d.step(.01);assert.equal(emitted,1);d.dispose();
}
console.log('PASS: immediate first-ring release, both hands, frozen tier, no duplicate emission and snapshot');
