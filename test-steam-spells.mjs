import assert from 'node:assert/strict';
import * as T from './dist/three.module.js';
import {FireSpells} from './dist/fire-spells.mjs';
import {STEAM_RECIPES,steamSpec} from './dist/steam-spec.mjs';
import {describe} from './dist/combo-design.mjs';
import {canSee} from './dist/vision.mjs';
import {crossesWard} from './dist/forces.mjs';
import {ForcedMotion} from './dist/motion.mjs';
let hits=[],payloads=[],blocked=false;const scene=new T.Scene(),wards=[],owner={x:0,z:0},victim={x:3,z:0,motion:new ForcedMotion()};const api={scene,wards,targets:()=>[victim],clearPath:()=>true,collides:x=>blocked&&x>1,wallBlocks:(a,b)=>wards.some(w=>w.life>0&&w.hp>0&&crossesWard(a,b,w)),hit:(v,d,dir,force)=>{hits.push({d,force});return true},applyPayload:(v,p)=>payloads.push(p),remove:m=>{m.removeFromParent();m.traverse(o=>{o.geometry?.dispose();o.material?.dispose()})},vfx:{particle(){}}};const f=new FireSpells(api),dir=new T.Vector3(1,0,0),aim=new T.Vector3(3,0,0);
function cast(seq){f.clear();for(const w of wards)api.remove(w.m);wards.length=0;hits=[];payloads=[];owner.x=owner.z=0;victim.x=3;victim.z=0;victim.poison=0;victim.frostSlow=0;blocked=false;f.cast(seq,1,owner,dir,aim);}
function advance(t){for(let i=0;i<Math.ceil(t/.05);i++)f.update(.05);}
for(const seq of Object.keys(STEAM_RECIPES)){cast(seq);assert.equal(describe(seq).name,STEAM_RECIPES[seq][0]);advance(11);assert.equal(f.effects.length,0,seq);}
cast('qiq');f.update(.05);assert.ok(payloads.some(p=>p.burn>0));assert.ok(steamSpec('qiq').radius>3);assert.equal(canSee(owner,victim,{smoke:f.smokeVolumes}),false);
cast('qii');f.update(.05);assert.equal(victim.frostSlow,1);assert.ok(steamSpec('qii').radius<3);assert.ok(hits.every(h=>h.d===0));
cast('qip');f.update(.05);const first=victim.poison;advance(1);assert.ok(victim.poison>first);victim.x=12;const before=victim.poison;advance(.6);assert.equal(victim.poison,before);assert.ok(before>0);assert.ok(hits.every(h=>h.d===0));
cast('qid');f.update(.05);assert.ok(payloads.some(p=>p.slow&&p.dust));
cast('qit');f.update(.05);assert.equal(f.smokeVolumes.length,0);assert.ok(payloads.some(p=>p.slow));
cast('qil');assert.equal(hits.length,0);advance(.6);assert.ok(hits.some(h=>h.d===9));assert.ok(f.smokeVolumes.length>0);
cast('qiw');advance(.5);assert.ok(f.smokeVolumes.length>0);assert.ok(hits.every(h=>h.d===0));
cast('qiw');blocked=true;advance(.5);assert.ok(f.smokeVolumes[0].x<=1);
cast('qie');assert.equal(wards.length,14);assert.equal(canSee(owner,victim,{walls:wards}),false);wards[0].hp=0;f.update(.05);assert.ok(f.smokeVolumes.length>0);assert.equal(wards[0].life,0);
cast('qig');victim.x=4;f.update(.05);assert.ok(victim.motion.active);assert.ok(victim.motion.x<0);
cast('qis');assert.ok(hits.some(h=>h.d===7));assert.ok(f.smokeVolumes.length>=5);const beforeHits=hits.length;advance(.5);assert.equal(hits.length,beforeHits);
cast('qih');advance(.6);assert.ok(hits.some(h=>h.force===3.5));assert.ok(f.smokeVolumes.length>0);
cast('qih');blocked=true;advance(.6);assert.ok(owner.x<=1);
console.log('PASS all 11 steam combinations: names, lifetime, sight, damage, frost, poison buildup, dust, low fog, impacts, walls, pull, melee and blocked dash');
