import test from 'node:test';
import assert from 'node:assert/strict';
import {SpaceSkill,SPACE_SKILLS,interceptSpaceShots} from './dist/space-skills.mjs';
import {Duel} from './dist/duel.mjs';
import * as T from './dist/three.module.js';
const loads=kind=>[{q:kind,w:kind==='w'?'q':'w',e:kind==='e'?'i':'e'},{q:'q',w:'w',e:'e'}];
const api={targets:()=>[],clearPath:()=>true,hit:()=>true};
test('all ten characters have distinct named skills, bounded travel and cooldown',()=>{
 assert.equal(new Set(Object.values(SPACE_SKILLS).map(s=>s.name)).size,11);
 for(const kind of Object.keys(SPACE_SKILLS)){const r=new SpaceSkill(kind),a={x:0,z:0};assert.ok(r.start(1,0,a));assert.equal(r.start(1,0,a),false);for(let i=0;i<40;i++){const step=r.tick(.02,a,api);a.x+=step.x;a.z+=step.z;}assert.equal(r.active,false);assert.ok(Math.hypot(a.x,a.z)<=Math.abs(r.spec.distance)+1e-6);assert.ok(r.cooldown>0);}
});
test('every character pauses charge only during the skill, retaining queue and resuming',()=>{
 for(const kind of Object.keys(SPACE_SKILLS)){const d=new Duel(loads(kind)),a=d.actors[0],c=a.charge;a.x=-12;a.z=12;for(const key of ['q','w','e'])d.input(0,{action:'queue',key});d.input(0,{action:'begin',point:{x:-8,z:12}});d.step(.8);const before=c.elapsed;d.input(0,{action:'roll',point:{x:-8,z:12}});d.step(.08);assert.equal(c.elapsed,before,kind);assert.deepEqual(c.queue,['q','w','e']);for(let i=0;i<30;i++)d.step(.03);assert.ok(c.elapsed>before,kind);d.dispose();}
});
test('release during skill waits and casts exactly once at the end',()=>{
 let casts=0;const d=new Duel(loads('d'),{onCast:()=>casts++});d.input(0,{action:'queue',key:'q'});d.input(0,{action:'begin',point:{x:2,z:0}});d.step(.2);d.input(0,{action:'roll',point:{x:2,z:0}});d.input(0,{action:'release',point:{x:2,z:0}});assert.equal(casts,0);assert.ok(d.actors[0].charge.active);for(let i=0;i<30;i++)d.step();assert.equal(casts,1);d.dispose();
});
test('earth resists damage and knockback; only lightning has invulnerability',()=>{
 const d=new Duel(loads('d')),a=d.actors[0];d.input(0,{action:'roll',point:{x:2,z:0}});d.hit(a,10,new T.Vector3(1,0,0),4,d.actors[1]);assert.equal(a.hp,97);assert.equal(a.motion.active,false);d.dispose();
 for(const k of Object.keys(SPACE_SKILLS)){const r=new SpaceSkill(k);r.start(1,0);assert.equal(r.invulnerable,k==='l');}
});
test('fire hurts, ice slows, poison blocks sight and safe zone clears slow',()=>{
 let damage=0;const target={x:0,z:0,slow:0};const r=new SpaceSkill('q'),a={x:0,z:0};r.start(1,0,a);r.tick(.1,a,{...api,targets:()=>[target],hit:(_,n)=>damage+=n});assert.equal(damage,2);
 const ice=new SpaceSkill('i');ice.start(1,0,a);ice.tick(.1,a,api);ice.tick(.1,a,{...api,targets:()=>[target]});assert.ok(target.slow>0);
 const poison=new SpaceSkill('p');poison.start(1,0,a);assert.equal(poison.smoke.length,1);
 const field=new SpaceSkill('t');a.slow=3;a.frostSlow=3;field.start(1,0,a);field.tick(.1,a,api);assert.equal(a.slow,0);assert.equal(a.frostSlow,0);assert.equal(field.speedBoost,true);
});
test('slash cuts one front projectile, barrier blocks multiple; overhead strikes remain',()=>{
 for(const kind of ['s','e']){const roll=new SpaceSkill(kind);roll.start(1,0);const a={x:0,z:0,roll},owner={};const make=type=>({type,mesh:{position:{x:1,z:0}},dir:{x:-1,z:0},speed:10,owner});const magic={effects:[make('projectile'),make('projectile'),make('drop')],fire:{effects:[]}};interceptSpaceShots([a],magic,.1,()=>{});assert.equal(magic.effects.filter(e=>e.type==='projectile').length,kind==='s'?1:0);assert.equal(magic.effects.filter(e=>e.type==='drop').length,1);}
});
test('shoulder charge hits only once with knockback, and state snapshot replays',()=>{
 let hits=0,force=0;const r=new SpaceSkill('h'),a={x:0,z:0},target={x:.5,z:0};r.start(1,0,a);const ctx={...api,targets:()=>[target],hit:(_,d,v,f)=>{hits++;force=f;}};r.tick(.1,a,ctx);r.tick(.1,a,ctx);assert.equal(hits,1);assert.equal(force,4.8);
 const d=new Duel(loads('p')),other=new Duel(loads('p'));d.input(0,{action:'roll',point:{x:0,z:0}});d.step();other.correct(d.snapshot());assert.deepEqual(other.actors[0].roll.snapshot(),d.actors[0].roll.snapshot());d.dispose();other.dispose();
});
