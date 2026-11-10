import test from 'node:test';import assert from 'node:assert/strict';
import {mouseRecipe} from './dist/duel-controls.mjs';
import {QueuedCharge} from './dist/queued-charge.mjs';
import {resolveSpell} from './dist/live-charge-spells.mjs';
const loadout={q:'i',w:'w',e:'e'},ranks={q:2,w:1,e:1};
function begin(){const c=new QueuedCharge();for(const k of mouseRecipe(1,ranks,loadout))c.enqueue(k);c.begin();return c;}
test('rank two ice left hold fills two ice rings and only releases icicle after both finish',()=>{
 for(const [seconds,parts,sequence] of [[.1,1,'i'],[1.19,1,'i'],[1.2,2,'i'],[1.8,2,'i'],[2.4,2,'ii'],[3,2,'ii']]){
 const c=begin();c.tick(seconds);assert.equal(c.parts.length,parts);assert.deepEqual(c.queue,['q','q']);assert.equal(resolveSpell(c.release(),loadout).sequence,sequence);
 }
 const c=begin();c.tick(1.8);assert.ok(Math.abs(c.progress-.5)<1e-8);
});
test('adding right mouse preserves charge and returns to chosen support combination',()=>{
 const c=begin();c.tick(1.8);assert.ok(c.retarget(mouseRecipe(3,ranks,loadout)));assert.equal(c.elapsed,1.8);assert.deepEqual(c.queue,['q','w','e']);c.tick(1.8);assert.equal(resolveSpell(c.release(),loadout).sequence,'iwe');
});
test('rank one, right mouse and other characters retain original recipes',()=>{
 assert.deepEqual(mouseRecipe(1,{q:1,w:0,e:0},loadout),['q']);
 assert.deepEqual(mouseRecipe(2,ranks,loadout),['q','e']);
 assert.deepEqual(mouseRecipe(1,ranks,{...loadout,q:'q'}),['q','w']);
 assert.deepEqual(mouseRecipe(1,ranks),['q','w']);
 const c=begin();c.tick(2);c.disrupt(1);assert.deepEqual(c.parts,['q']);assert.equal(resolveSpell(c.release(),loadout).sequence,'i');
});
