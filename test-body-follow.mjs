import assert from 'node:assert/strict';
import * as T from './dist/three.module.js';
import {BodyFollow,angleDelta} from './dist/body-follow.mjs';
import {MotionPuppet} from './dist/motion-puppet.mjs';
const turn=new BodyFollow();turn.update(0,{aim:0,x:0,z:0});turn.update(.03,{aim:1,x:0,z:0});assert.ok(turn.head>turn.chest&&turn.chest>turn.pelvis);
for(let i=0;i<120;i++){turn.update(1/60,{aim:3,x:0,z:0});assert.ok(Math.abs(angleDelta(turn.head,turn.chest))<=.90001);assert.ok(Math.abs(angleDelta(turn.chest,turn.pelvis))<=.70001);}
const scene=new T.Scene(),p=new MotionPuppet(scene),camera=new T.PerspectiveCamera();camera.position.set(4,4,4);camera.lookAt(0,1,0);p.bodyFollow=new BodyFollow();let previous=null,maxSlip=0;
for(let i=0;i<240;i++){
 const z=i*4.4/120;p.group.position.z=z;p.update(1/120);p.bodyFollow.update(1/120,{aim:0,x:0,z,vz:4.4});p.render(camera);
 const state=p.bodyFollow;
 if(previous)for(const side of ['Left','Right'])if(state.swing?.side!==side&&previous.swing!==side){maxSlip=Math.max(maxSlip,p.lastPositions[side+'Foot'].distanceTo(previous[side]));}
 previous={Left:p.lastPositions.LeftFoot.clone(),Right:p.lastPositions.RightFoot.clone(),swing:state.swing?.side};
 for(const side of ['Left','Right'])assert.ok(p.lastPositions[side+'Foot'].y>=.099,'feet stay above floor');
}
console.log({maxSlip});assert.ok(maxSlip<.01,'stance foot should remain planted');
console.log('PASS: staggered turning, angular limits, grounded feet, planted stance during movement');
for(const [vx,vz] of [[0,-3],[3,0],[-3,0],[0,0]]){
 for(let i=0;i<60;i++){
  p.group.position.x+=vx/120;p.group.position.z+=vz/120;const aim=Math.PI*i/60;p.group.rotation.y=aim;
  p.update(1/120);p.bodyFollow.update(1/120,{aim,x:p.group.position.x,z:p.group.position.z,vx,vz});p.render(camera);
  for(const point of Object.values(p.lastPositions))assert.ok(point.toArray().every(Number.isFinite));
  for(const side of ['Left','Right'])assert.ok(p.lastPositions[side+'Foot'].y>=.09);
 }
}
console.log('PASS: backwards, sideways, turning and stopping remain finite and above ground');
