import assert from 'node:assert/strict';
import {QueuedCharge} from './dist/queued-charge.mjs';
import {resolveSpell} from './dist/live-charge-spells.mjs';
import {Duel} from './dist/duel.mjs';
import {attackCooldown} from './dist/attack-cooldown.mjs';
const spell=t=>{const q=new QueuedCharge();for(const k of ['q','w','e'])q.enqueue(k);q.begin();q.tick(t);return resolveSpell(q.release(),{q:'i',w:'q',e:'w'});};
for(const t of [.01,.149,.15,.5,1.199])assert.deepEqual(spell(t),spell(0),'partial first ring always yields identical basic attack');
for(const t of [1.2,1.3,2,2.399]){const s=spell(t);assert.equal(s.rangeScale,1.25);assert.equal(s.power,spell(0).power);assert.equal(s.cost,spell(0).cost);assert.equal(s.sequence,'i');}
assert.equal(spell(2.4).sequence,'iq');assert.equal(spell(3.6).sequence,'iqw');
const loads=[{q:'i',w:'q',e:'w'},{q:'q',w:'i',e:'w'}];
for(const hand of ['left','right'])for(const elapsed of [.1,.8,1.2,2.39]){
 let cast;const d=new Duel(loads,{onCast:s=>cast=s});const a=d.actors[0];
 for(const key of ['q','w'])d.input(0,{action:'queue',key});d.input(0,{action:'begin',hand,point:{x:0,z:4}});a.charge.tick(elapsed);d.input(0,{action:'release',point:{x:0,z:4}});a.charge.tick(1);d.castResult(a,a.charge.takeRelease());
 assert.equal(cast.power,1);assert.equal(cast.rangeScale,elapsed>=1.2?1.25:1);
 const effect=d.magic.ice.effects.find(e=>e.type===(hand==='left'?'shot':'iceMist'));
 if(hand==='left'){const shot=d.magic.ice.effects.find(e=>e.type==='shot');assert.ok(Math.abs(shot.life*shot.speed-7*cast.rangeScale)<1e-8);assert.equal(shot.damage,7);}
 else{assert.equal(effect.range,2.6*cast.rangeScale);assert.equal(effect.max,1.2);}
 d.dispose();
}
assert.deepEqual(attackCooldown({iceLeftCool:.8},'left',true),{remaining:.8,ready:false,progress:0});
assert.equal(attackCooldown({iceRightCool:1.2},'right',true).progress,.5);
assert.equal(attackCooldown({},'left',true).progress,1);
console.log('PASS: fixed basic attack before 1.2s, range-only upgrade, 2-ring boundary, both ice hands on authoritative duel, cooldown fill');
