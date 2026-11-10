import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from './dist/three.module.js';
import {Duel} from './dist/duel.mjs';
import {iceSpec,ICE_RECIPES} from './dist/ice-spec.mjs';
import {describe} from './dist/combo-design.mjs';
import {plannerRange} from './dist/planner-range.mjs';
const loads=[{q:'i',w:'t',e:'w'},{q:'i',w:'q',e:'p'}];
function setup(){const d=new Duel(loads),[a,b]=d.actors;Object.assign(a,{x:0,z:6});Object.assign(b,{x:2,z:6});a.dir.set(1,0,0);b.dir.set(1,0,0);return d;}
function cast(d,seq){d.magic.cast({sequence:seq,power:1},d.actors[0],new T.Vector3(1,0,0),new T.Vector3(2,0,6));}

test('all ice pairs use shared names, ranges, custom runtime, and expire',()=>{for(const seq of Object.keys(ICE_RECIPES)){const d=setup();cast(d,seq);assert.equal(describe(seq).name,ICE_RECIPES[seq][0]);assert.equal(plannerRange(seq).value,iceSpec(seq).range);assert.ok(d.magic.iceCombos.effects.length,seq);for(let i=0;i<300;i++)d.step();assert.equal(d.magic.iceCombos.effects.length,0,seq);d.dispose();}});
test('white fog slows with exactly zero damage; frostbite leaves long green frost',()=>{for(const seq of ['iq','ip']){const d=setup(),b=d.actors[1];cast(d,seq);d.step();assert.equal(b.hp,seq==='iq'?100:96);assert.ok(b.slow>0);if(seq==='ip'){assert.ok(b.slow>4.9);assert.ok(b.greenFrost>4.9);}d.dispose();}});
test('icicle is fast and thin; snowball is slow and wide; both hit bodies',()=>{for(const seq of ['ii','iw']){const d=setup(),b=d.actors[1];cast(d,seq);const e=d.magic.iceCombos.effects[0];assert.equal(e.s.speed,seq==='ii'?30:8);for(let i=0;i<25;i++)d.step();assert.equal(b.hp,100-iceSpec(seq).damage,seq);assert.ok(b.slow>0);d.dispose();}});
test('ice rink interrupts queued casting and active mist, causes a fall, then prevents rapid retrigger',()=>{const d=setup(),b=d.actors[1];d.input(1,{action:'ice-basic',hand:'right',point:{x:5,z:6}});d.input(1,{action:'queue',key:'q'});d.input(1,{action:'begin',point:{x:5,z:6}});cast(d,'it');d.step();assert.equal(b.hp,95);assert.equal(b.charge.active,false);assert.ok(b.knockdown>0);assert.ok(b.slipImmune>2.4);assert.equal(d.magic.ice.effects.filter(e=>e.owner===b).length,0);assert.equal(d.input(1,{action:'begin'}),false);for(let i=0;i<30;i++)d.step();assert.equal(b.hp,95);assert.equal(b.knockdown,0);const copy=setup();copy.correct(d.snapshot());assert.equal(copy.actors[1].slipImmune,b.slipImmune);copy.step();assert.ok(copy.actors[1].slipImmune<b.slipImmune);copy.dispose();d.dispose();});
test('fall cancels an ice windup before its projectile can spawn',()=>{const d=setup(),b=d.actors[1];d.input(1,{action:'ice-basic',hand:'left',point:{x:5,z:6}});cast(d,'it');for(let i=0;i<12;i++)d.step();assert.equal(d.magic.ice.effects.filter(e=>e.owner===b).length,0);d.dispose();});
test('icebergs hurt and knock back before becoming a movement blocker',()=>{const d=setup(),b=d.actors[1];cast(d,'id');assert.equal(b.hp,92);assert.ok(b.motion.active);assert.equal(d.wards.length,1);assert.equal(d.wards[0].baseY,0);assert.ok(d.wallBlocks({x:0,z:6},{x:4,z:6}));d.dispose();});
test('new ice projectiles remain blocked by walls',()=>{for(const seq of ['ii','iw']){const d=setup(),b=d.actors[1];d.magic.a.collides=(x)=>x>=1&&x<=1.4;cast(d,seq);for(let i=0;i<30;i++)d.step();assert.equal(b.hp,100);d.dispose();}});
