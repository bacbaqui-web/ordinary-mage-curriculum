import assert from 'node:assert/strict';
import * as T from './dist/three.module.js';
import {BodyFollow,angleDelta} from './dist/body-follow.mjs';
import {MotionPuppet} from './dist/motion-puppet.mjs';
const turn=new BodyFollow();turn.update(0,{aim:0,x:0,z:0});turn.update(.03,{aim:1,x:0,z:0});assert.ok(turn.head>0);assert.equal(turn.chest,0);assert.equal(turn.pelvis,0);for(let i=0;i<8;i++)turn.update(.016,{aim:1});assert.ok(turn.chest>turn.pelvis);assert.equal(turn.pelvis,0);
for(let i=0;i<120;i++){turn.update(1/60,{aim:3,x:0,z:0});assert.ok(Math.abs(angleDelta(turn.head,turn.chest))<=.90001);assert.ok(Math.abs(angleDelta(turn.chest,turn.pelvis))<=.70001);}
const puppet=new MotionPuppet(new T.Scene()),camera=new T.PerspectiveCamera();
camera.position.set(4,4,4);camera.lookAt(0,1,0);
for(const time of [0,.15,.35,.7]){
 puppet.time=time;puppet.update(0);puppet.bodyFollow=null;puppet.render(camera);
 const original=Object.fromEntries(Object.entries(puppet.lastPositions).map(([n,p])=>[n,p.clone()]));
 puppet.bodyFollow=new BodyFollow();puppet.bodyFollow.update(0,{aim:0});puppet.render(camera);
 for(const [n,p] of Object.entries(puppet.lastPositions))assert.ok(p.distanceTo(original[n])<1e-9,'saved motion stays unchanged without turning');
 puppet.bodyFollow.update(.03,{aim:1});puppet.render(camera);
 for(const [n,p] of Object.entries(puppet.lastPositions))assert.ok(Math.abs(p.y-original[n].y)<1e-9,'turning does not change pelvis or foot height');
}
console.log('PASS: staggered turning, angle limits, original animation preserved, no foot planting or pelvis height correction');

const neckPose={Hips:new T.Vector3(0,1,0),Spine:new T.Vector3(0,1.4,0),Neck:new T.Vector3(.08,1.7,.06),Head:new T.Vector3(.12,1.9,.15)};
const neckLength=neckPose.Neck.distanceTo(neckPose.Head);turn.apply(neckPose);
assert.ok(Math.abs(neckPose.Neck.distanceTo(neckPose.Head)-neckLength)<1e-9,'neck and head rotate together');
