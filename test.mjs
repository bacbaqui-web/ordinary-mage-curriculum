import assert from 'node:assert/strict';
import {Charge,resolveSpell,NAMES,RING_SECONDS} from './dist/spells.mjs';
let c=new Charge();c.down('q');c.tick(.08);assert.equal(resolveSpell(c.up('q')).sequence,'q');
c=new Charge();c.down('q');c.tick(.5);c.down('w');c.tick(.71);assert.deepEqual(c.parts,['q','w']);c.tick(1.2);assert.deepEqual(c.parts,['q','w','w']);c.tick(1.2);assert.equal(c.up('w'),null);assert.equal(resolveSpell(c.up('q')).sequence,'qww');
c=new Charge();c.down('q');c.tick(.5);c.down('w');c.tick(.71);c.up('w');c.tick(1.2);assert.deepEqual(c.parts,['q','w','q']);c.tick(1.2);assert.equal(resolveSpell(c.up('q')).sequence,'qwq');
c=new Charge();c.down('q');c.down('q');assert.deepEqual(c.held,['q']);c.tick(1.21);assert.equal(resolveSpell(c.up('q')).sequence,'q');
c=new Charge();c.down('e');c.tick(5);assert.deepEqual(c.parts,['e','e','e']);assert.equal(c.progress,1);assert.equal(resolveSpell(c.up('e')).sequence,'eee');
c=new Charge();c.down('q');c.down('w');c.down('e');c.up('e');assert.equal(c.next(),'w');c.clear();assert.equal(c.up('q'),null);
for(const a of'qwe')for(const b of'qwe')for(const d of'qwe')assert.ok(NAMES[a+b+d]);
console.log('PASS: tap, QWW, QWQ, key repeat, partial ring, three-ring cap, cancel, all 27 spell names');

assert.equal(RING_SECONDS,1.2);
c=new Charge();c.down('q');c.tick(.6);assert.equal(c.parts.length,1);assert.equal(c.progress,.5);
const {Roll,ROLL_DISTANCE, incomingThreat}=await import('./dist/combat.mjs');
const roll=new Roll();assert.equal(roll.start(3,4),true);assert.equal(roll.start(1,0),false);assert.equal(roll.invulnerable,true);
let x=0,z=0;for(let i=0;i<36;i++){const step=roll.tick(.01);x+=step.x;z+=step.z;}assert.ok(Math.abs(Math.hypot(x,z)-ROLL_DISTANCE)<1e-8);assert.equal(roll.active,false);assert.equal(roll.invulnerable,false);assert.equal(roll.start(1,0),false);roll.tick(3);assert.equal(roll.start(1,0),true);roll.tick(.29);assert.equal(roll.invulnerable,false);roll.reset();assert.equal(roll.cooldown,0);
assert.equal(incomingThreat(0,0,1,0,10,4,0),true);assert.equal(incomingThreat(0,0,-1,0,10,4,0),false);assert.equal(incomingThreat(0,0,1,0,10,4,3),false);
console.log('PASS: slower charge, roll distance, invulnerability window, cooldown, reset, directional AI threat detection');
