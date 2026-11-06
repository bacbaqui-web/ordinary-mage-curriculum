import assert from 'node:assert/strict';import * as T from './dist/three.module.js';import {FireSpells} from './dist/fire-spells.mjs';import {RED_LIGHTNING_RECIPES} from './dist/red-lightning-spec.mjs';import {describe} from './dist/combo-design.mjs';import {ForcedMotion} from './dist/motion.mjs';import {canSee} from './dist/vision.mjs';
let hits=[],blocked=false,immune=false;const scene=new T.Scene(),wards=[],owner={x:0,z:0},v={x:3,z:0,motion:new ForcedMotion()};const api={scene,wards,targets:()=>[v],clearPath:()=>true,collides:x=>blocked&&x>1,wallBlocks:()=>false,hit:(a,d,dir,force)=>{if(immune)return false;hits.push({d,force});return true},applyPayload:(a,p)=>{a.burn=p.burn;},remove:m=>{m.removeFromParent();m.traverse(o=>{o.geometry?.dispose();o.material?.dispose()});},vfx:{particle(){}}};const f=new FireSpells(api),dir=new T.Vector3(1,0,0),aim=new T.Vector3(3,0,0);
function cast(seq){f.clear();for(const w of wards)api.remove(w.m);wards.length=0;owner.x=owner.z=0;v.x=3;v.z=0;v.poison=0;hits=[];blocked=immune=false;f.cast(seq,1,owner,dir,aim);}
function advance(t){for(let i=0;i<Math.ceil(t/.05);i++)f.update(.05);}
for(const seq of Object.keys(RED_LIGHTNING_RECIPES)){cast(seq);assert.equal(describe(seq).name,RED_LIGHTNING_RECIPES[seq][0]);advance(12);assert.equal(f.effects.length,0,seq);}
cast('qli');advance(.2);assert.equal(hits.length,0);advance(.2);assert.equal(hits.length,1);assert.equal(hits[0].d,8);assert.equal(v.frostSlow,2.5);advance(.3);assert.equal(hits.length,1);
cast('qli');v.z=2;advance(.5);assert.equal(hits.length,0);
cast('qlq');advance(.4);assert.equal(hits.length,1);assert.ok(f.effects.some(e=>e.type==='redFireField'));assert.equal(hits[0].d,4);
cast('qll');const positions=f.effects.map(e=>({...e.point}));v.x=7;advance(.4);assert.deepEqual(f.effects.filter(e=>e.type==='redStrike').map(e=>e.point),positions);advance(1);assert.equal(hits.length,0);
cast('qlp');advance(.4);assert.equal(v.poison,6);assert.equal(v.burn,6);assert.ok(v.burn>0);
cast('qld');advance(.7);assert.equal(hits.length,0);advance(.3);assert.ok(hits.some(h=>h.force===2.5));assert.ok(f.effects.some(e=>e.type==='redCracks'));
cast('qle');assert.equal(wards.length,0);advance(.7);assert.equal(wards.length,14);assert.ok(Math.abs(wards.reduce((n,w)=>n+w.x,0)/14-3)<1e-8);assert.equal(canSee(owner,v,{walls:wards}),false);v.x=5.2;advance(.7);assert.ok(hits.length>0);
cast('qlt');advance(.1);assert.equal(hits.length,0);v.x=7;advance(.5);assert.equal(hits.length,0);assert.ok(f.effects.some(e=>e.type==='redStrike'));
cast('qlw');advance(.3);assert.equal(hits.length,1);cast('qlw');blocked=true;advance(.5);assert.equal(hits.length,0);
cast('qlg');v.x=4;advance(.1);assert.ok(v.motion.active);assert.ok(v.motion.x<0);assert.ok(hits.every(h=>h.d===0));v.x=7;advance(.7);assert.ok(hits.every(h=>h.d===0));
cast('qls');assert.equal(hits.length,1);advance(.5);assert.equal(hits.length,1);
cast('qlh');advance(.05);assert.equal(hits.length,1);assert.equal(hits[0].force,3.5);cast('qlh');blocked=true;advance(.5);assert.ok(owner.x<=1);assert.equal(hits.length,0);
cast('qli');immune=true;advance(.5);assert.equal(hits.length,0);
console.log('PASS 11 lightning recipes: warnings, single hits, fixed chain targets, poison, meteor, walls, dodgeable zone and pull, melee, projectiles, dash collision and invulnerability');

cast('qlq');advance(.4);const impact=hits[0].d;advance(1.5);assert.ok(hits.length>2);assert.ok(hits.slice(1).every(h=>h.d===.75));v.x=8;const leaveCount=hits.length;advance(2);assert.equal(hits.length,leaveCount);
cast('qlq');advance(5);const directTotal=hits.reduce((sum,h)=>sum+h.d,0);assert.ok(directTotal>=9&&directTotal<=11);assert.equal(impact,4);
cast('qlt');assert.deepEqual(f.effects[0].point,{x:0,z:0});
cast('qle');v.x=7;advance(.7);assert.ok(wards.every(w=>Math.abs(Math.hypot(w.x-3,w.z)-2.2)<1e-8));
console.log('PASS revised lightning: low impact plus bounded ground damage, leave-area safety, long poison, frost, longer meteor warning, target-centered cage, caster-centered zone and instant punch');
