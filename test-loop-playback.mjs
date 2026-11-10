import assert from 'node:assert/strict';
import * as T from './dist/three.module.js';
import {JOINTS,samplePose} from './dist/pose-data.mjs';
import {loopFrame} from './dist/motion-timing.mjs';
const pose=y=>Object.fromEntries(JOINTS.map(n=>[n,[0,y,0]]));
const clip={name:'기본 걷기',binding:'기본 걷기',loop:true,frames:9,fps:12,keys:[{frame:0,ease:'smooth',pose:pose(1)},{frame:4,ease:'smooth',pose:pose(2)},{frame:8,ease:'smooth',pose:pose(1)}]};
globalThis.localStorage={getItem:()=>JSON.stringify({version:1,actions:[clip,{...clip,name:'대기',binding:'대기'}]})};
const {createMotionReader,savedPose}=await import('./dist/live-motions.mjs?v=loop-playback-2');
const {MotionPuppet}=await import('./dist/motion-puppet.mjs');
const puppet=new MotionPuppet(new T.Scene()),camera=new T.PerspectiveCamera();puppet.motionReader=createMotionReader('default');puppet.blendTransitions=true;
for(const name of ['기본 걷기','대기']){
 puppet.locomotionName=name;puppet.poseTransition=null;
 for(let i=0;i<300;i++){
  const t=i/60;puppet.time=t;puppet.idleTime=t;puppet.transitionDt=1/60;puppet.render(camera);
  const expected=samplePose(clip,loopFrame(clip,t*clip.fps));
  assert.deepEqual(savedPose(name,t,{loop:true}),expected);
  for(const n of JOINTS)assert.ok(puppet.lastPositions[n].distanceTo(new T.Vector3(...expected[n]))<1e-8,`${name} frame ${i}: ${n}`);
 }
}
console.log('PASS: editor and game match all joints across repeated idle/walk loops, without per-cycle blending or extra endpoint hold');
