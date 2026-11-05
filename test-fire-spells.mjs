import assert from 'node:assert/strict';
import * as T from './dist/three.module.js';
import {FireSpells} from './dist/fire-spells.mjs';
import {fireSpec,FIRE_RECIPES} from './dist/fire-spec.mjs';
import {RUNES,valid,describe} from './dist/combo-design.mjs';
import {ForcedMotion} from './dist/motion.mjs';
const scene=new T.Scene(),wards=[],owner={x:0,z:0},victim={x:1.5,z:0,motion:new ForcedMotion()},back={x:-1.5,z:0,motion:new ForcedMotion()};let hits=[],payloads=[],blocked=false;
const api={scene,wards,targets:()=>[victim,back],clearPath:()=>true,collides:x=>blocked&&x>1,wallBlocks:()=>false,hit:(v,d)=>{hits.push({v,d});return true},applyPayload:(v,p)=>payloads.push({v,p}),remove:m=>{scene.remove(m);m.traverse(o=>{o.geometry?.dispose();o.material?.dispose()})},vfx:{particle(){}}};
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
cast('qs');victim.x=2;for(let j=0;j<20;j++)f.update(.05);assert.equal(hits.filter(x=>x.v===victim).length,1);
cast('qh');blocked=true;for(let j=0;j<20;j++)f.update(.05);assert.ok(owner.x>0&&owner.x<=1);blocked=false;
for(const seq of Object.keys(FIRE_RECIPES)){cast(seq);for(let i=0;i<160;i++)f.update(.05);assert.equal(f.effects.length,0,seq+' expires');}
console.log('PASS fire shapes, cone direction, steam, debuffs, lightning residue, ring walls, persistent damage, pull, slash, blocked dash, cleanup, water removal');
cast('qi');assert.equal(f.smokeVolumes.length,1);assert.ok(f.smokeVolumes[0].radius>fireSpec('q').radius);assert.equal(f.effects[0].type,'smokescreen');assert.equal(hits.length,0);for(let i=0;i<121;i++)f.update(.05);assert.equal(f.smokeVolumes.length,0);console.log('PASS dense smoke lasts six seconds and expires without damage');
