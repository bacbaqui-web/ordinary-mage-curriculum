import assert from 'node:assert/strict';
import * as T from './dist/three.module.js';
import {FireSpells} from './dist/fire-spells.mjs';
import {fireSpec,FIRE_RECIPES} from './dist/fire-spec.mjs';
import {RUNES,valid,describe} from './dist/combo-design.mjs';
import {ForcedMotion} from './dist/motion.mjs';
const scene=new T.Scene(),wards=[],owner={x:0,z:0},victim={x:1.5,z:0,motion:new ForcedMotion()},back={x:-1.5,z:0,motion:new ForcedMotion()};let hits=[],payloads=[],blocked=false;
const api={scene,wards,targets:()=>[victim,back],clearPath:()=>true,collides:x=>blocked&&x>1,wallBlocks:()=>false,hit:(v,d,dir,force)=>{hits.push({v,d,force});return true},applyPayload:(v,p)=>payloads.push({v,p}),remove:m=>{scene.remove(m);m.traverse(o=>{o.geometry?.dispose();o.material?.dispose()})},vfx:{particle(){}}};
const f=new FireSpells(api),dir=new T.Vector3(1,0,0),aim=new T.Vector3(3,0,0);
function cast(seq){f.clear();for(const w of wards)api.remove(w.m);wards.length=0;hits=[];payloads=[];owner.x=owner.z=0;f.cast(seq,1,owner,dir,aim);}
assert.equal(Object.keys(RUNES).length,11);assert.equal(valid('qa'),false);
for(const seq of Object.keys(FIRE_RECIPES))assert.equal(describe(seq).name,FIRE_RECIPES[seq][0]);
cast('q');assert.ok(hits.some(x=>x.v===victim));assert.ok(!hits.some(x=>x.v===back));assert.equal(f.effects[0].type,'cone');assert.equal(f.effects[0].mesh.children[0].material.type,'ShaderMaterial');
assert.ok(fireSpec('qq').radius>fireSpec('q').radius);cast('qi');assert.ok(payloads.every(x=>!x.p.burn));cast('qd');assert.ok(payloads.some(x=>x.p.burn&&x.p.slow));cast('qp');assert.ok(payloads[0].p.burn>fireSpec('q').burn);assert.ok(payloads[0].p.burnDamage>fireSpec('q').burnDamage);
cast('ql');assert.deepEqual(f.effects.map(e=>e.type),['lightning','scorch','smoke']);
cast('qe');assert.equal(wards.length,12);assert.ok(wards.every(w=>Math.abs(Math.hypot(w.x,w.z)-2)<1e-8));
cast('qt');victim.x=3;for(let j=0;j<20;j++)f.update(.05);assert.ok(hits.length>=3);
cast('qg');victim.x=4;f.update(.05);assert.ok(victim.motion.active);assert.ok(victim.motion.x<0);
victim.x=2;cast('qs');assert.equal(f.effects[0].type,'cut');for(let j=0;j<20;j++)f.update(.05);assert.equal(hits.filter(x=>x.v===victim).length,1);
cast('qh');blocked=true;for(let j=0;j<20;j++)f.update(.05);assert.ok(owner.x>0&&owner.x<=1);blocked=false;
for(const seq of Object.keys(FIRE_RECIPES)){cast(seq);for(let i=0;i<160;i++)f.update(.05);assert.equal(f.effects.length,0,seq+' expires');}
console.log('PASS fire shapes, cone direction, steam, debuffs, lightning residue, ring walls, persistent damage, pull, slash, blocked dash, cleanup, water removal');
cast('qi');assert.equal(f.smokeVolumes.length,1);assert.ok(f.smokeVolumes[0].radius>fireSpec('q').radius);assert.equal(f.effects[0].type,'smokescreen');assert.equal(hits.length,0);for(let i=0;i<121;i++)f.update(.05);assert.equal(f.smokeVolumes.length,0);console.log('PASS dense smoke lasts six seconds and expires without damage');

victim.x=1.5;cast('qh');for(let i=0;i<10;i++)f.update(.05);assert.ok(hits.some(h=>h.force===4.5));victim.x=5;cast('qs');assert.equal(hits.length,0);cast('qg');assert.ok(f.effects[0].mesh.children.some(m=>m.userData.vortex));console.log('PASS melee-only fire slash, strong punch knockback, rising vortex geometry');

// Upgrades must change the actual hit area, payload, movement and residual effects.
for(const op of ['d','p','e','t','g','s','h']){const base=fireSpec('q'+op),up=fireSpec('qq'+op);assert.ok(up.radius>base.radius);assert.ok(up.damage>base.damage);}
assert.equal(fireSpec('qqi').radius,fireSpec('qi').radius);assert.ok(fireSpec('qi').radius<4.8);
cast('qqq');assert.ok(f.effects.filter(e=>e.type==='scorch').length>=9);assert.equal(f.effects[0].radius,6.6);
cast('qql');assert.equal(f.effects[0].radius,2.25);assert.ok(f.effects[1].mesh.scale.x>2);
victim.x=3.6;cast('qs');assert.equal(hits.length,0);cast('qqs');assert.ok(hits.some(h=>h.v===victim));
cast('qqe');assert.ok(wards.every(w=>Math.abs(Math.hypot(w.x,w.z)-3)<1e-8));
victim.x=1.5;cast('qqh');for(let i=0;i<12;i++)f.update(.05);assert.ok(hits.some(h=>h.force===7));assert.ok(owner.x>4.9);
cast('qqh');blocked=true;for(let i=0;i<12;i++)f.update(.05);assert.ok(owner.x<=1);blocked=false;
cast('qqi');f.update(.05);assert.ok(hits.length>0);assert.ok(payloads.some(x=>x.p.burn));
console.log('PASS fire upgrades: radius, damage, smoke size, scorch, melee reach, walls, dash collision and knockback');

cast('qd');const smallAsh=f.effects.find(e=>e.type==='ashfall').flakes.length;cast('qqd');let falling=f.effects.find(e=>e.type==='ashfall');assert.ok(falling.flakes.length>=smallAsh*7);for(let i=0;i<20;i++)f.update(.05);assert.ok(!f.effects.some(e=>e.type==='cone'));assert.ok(falling.flakes.some(x=>!x.landed));const hitCount=hits.length;for(let i=0;i<100;i++)f.update(.05);assert.ok(falling.flakes.some(x=>x.landed));assert.equal(hits.length,hitCount);for(let i=0;i<40;i++)f.update(.05);assert.equal(f.effects.length,0);console.log('PASS dense ash outlasts flame, settles on ground, causes no extra damage and expires');
