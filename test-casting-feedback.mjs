import assert from 'node:assert/strict';
import * as T from './dist/three.module.js';
import {ChargeCamera,CastingFeedback} from './dist/casting-feedback.mjs';
const camera=new ChargeCamera();const stages=[];
for(const tier of [1,2,3]){let state;for(let i=0;i<180;i++)state=camera.update(1/60,true,tier);stages.push(state);}
assert.ok(stages[2].distance<stages[1].distance&&stages[1].distance<stages[0].distance);
assert.ok(stages[2].fov>stages[1].fov);assert.ok(Math.abs(stages[2].x)>0);assert.ok(Math.abs(stages[0].x)===0);
let state;for(let i=0;i<600;i++)state=camera.update(1/60,false,1);assert.ok(Math.abs(state.fov-38)<.001);
const scene=new T.Scene(),feedback=new CastingFeedback(scene),view=new T.PerspectiveCamera(),actor={g:{visible:true}};
const hands={LeftHand:new T.Vector3(-1,1,0),RightHand:new T.Vector3(1,1,0)};
feedback.charge(actor,true,1,'#ff9869',hands,view);const a=feedback.actors.get(actor);assert.deepEqual(a.group.position.toArray(),[0,1,0]);assert.equal(a.rings.filter(r=>r.visible).length,1);assert.equal(a.rings[0].children[0].material.color.getHexString(),'ff9869');
for(let i=0;i<20;i++)feedback.fire(new T.Vector3(),new T.Vector3(0,0,1),'#8fe2ff');assert.equal(feedback.bursts.length,12);
feedback.update(.4);assert.equal(feedback.bursts.length,0);feedback.clear();assert.equal(a.group.visible,false);
console.log('PASS: hand midpoint, rune color, one-ring charge, bounded bursts, expiry, staged camera and recovery');

const {impactFeedback}=await import('./dist/casting-feedback.mjs');
const {ForcedMotion}=await import('./dist/motion.mjs');const victim={motion:new ForcedMotion()};
impactFeedback(victim,5,new T.Vector3(1,0,0),0);assert.equal(victim.hitFlash,.12);assert.equal(victim.motion.distance,.22);
victim.motion.clear();impactFeedback(victim,5,new T.Vector3(1,0,0),-2);assert.equal(victim.motion.x,-1);assert.equal(victim.motion.distance,2);
victim.motion.clear();impactFeedback(victim,2,new T.Vector3(),0);assert.equal(victim.motion.active,false);
console.log('PASS: white hit flash, short recoil, pull preservation, no directional recoil on damage over time');
