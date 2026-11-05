import assert from 'node:assert/strict';import {CastRecoil,HitScreen} from './dist/combat-response.mjs';
const distances=[];for(let n=1;n<=3;n++){const r=new CastRecoil();r.start({x:3,z:4},n);let x=0,z=0;for(let i=0;i<60;i++){const d=r.tick(1/60);x+=d.x;z+=d.z;}assert.ok(x<0&&z<0);assert.ok(!r.active);distances.push(Math.hypot(x,z));}assert.ok(distances[0]<distances[1]&&distances[1]<distances[2]);
const h=new HitScreen();h.hit(10);assert.ok(h.opacity>0);assert.ok(Math.abs(h.shake().x)>0);h.tick(1);assert.equal(h.opacity,0);assert.equal(h.shake().x,0);h.hit(0);assert.equal(h.opacity,0);console.log('PASS directional recoil scales across three tiers; damage cue decays and ignores zero damage');

for(const [tier,duration] of [[1,.35],[2,.5],[3,.7]]){const r=new CastRecoil();r.start({x:1,z:0},tier);assert.equal(r.duration,duration);r.tick(duration-.001);assert.ok(r.active);r.tick(.002);assert.ok(!r.active);}
const delayed=new CastRecoil();delayed.start({x:1,z:0},2,.4);const waiting=delayed.tick(.3);assert.equal(Math.hypot(waiting.x,waiting.z),0);assert.ok(delayed.active);delayed.tick(.61);assert.ok(!delayed.active);
