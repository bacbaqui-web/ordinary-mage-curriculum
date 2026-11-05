import assert from 'node:assert/strict';
import {QueuedCharge} from './dist/queued-charge.mjs';
import {resolveSpell} from './dist/live-charge-spells.mjs';
import {RUNES,validLoadout,mapSequence} from './dist/live-loadout.mjs';
import {compileSpell} from './dist/live-spells.mjs';
const q=new QueuedCharge();assert.equal(q.begin(),false);for(const k of ['q','q','w'])assert.equal(q.enqueue(k),true);assert.equal(q.enqueue('e'),false);assert.equal(q.active,false);q.begin();assert.equal(q.enqueue('e'),false);q.tick(2.5);let r=q.release();assert.deepEqual(r.parts,['q','q']);assert.deepEqual(q.queue,[]);assert.equal(q.release(),null);assert.equal(resolveSpell(r).sequence,'qq');q.enqueue('e');q.begin();q.tick(.05);assert.equal(q.release().tap,true);
q.enqueue('q');q.enqueue('w');q.enqueue('e');q.begin();q.tick(20);r=q.release();assert.equal(resolveSpell(r).sequence,'qwe');assert.equal(q.queue.length,0);
assert.equal(Object.keys(RUNES).length,12);assert.ok(validLoadout({q:'p',w:'a',e:'d'}));assert.equal(mapSequence(['q','w'],{q:'p',w:'a',e:'d'}),'pa');
for(const a of Object.keys(RUNES))for(const b of Object.keys(RUNES))for(const c of Object.keys(RUNES)){const n=compileSpell(a+b+c);assert.equal(n.op,c);assert.equal(n.inner.op,b);assert.equal(n.inner.inner.kind,a);}
assert.equal(compileSpell('qtw').inner.op,'t');assert.equal(compileSpell('qwt').inner.op,'w');console.log('PASS queued casts, reset, completed prefix, 12 rune loadouts, 1728 ordered spell trees');
