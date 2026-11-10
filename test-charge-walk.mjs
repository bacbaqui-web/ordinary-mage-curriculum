import assert from 'node:assert/strict';
import * as T from './dist/three.module.js';
import {MotionPuppet} from './dist/motion-puppet.mjs';
const p=new MotionPuppet(new T.Group()),camera=new T.PerspectiveCamera();camera.position.set(8,12,10);camera.lookAt(0,0,0);
p.motionReader={savedMotion:()=>({frames:12,fps:12}),savedPose:(name,time)=>name==='기본 걷기'?{LeftFoot:[-.2,.12,Math.sin(time*6)],RightFoot:[.2,.12,-Math.sin(time*6)]}:{LeftFoot:[-.2,.12,0],RightFoot:[.2,.12,0],RightHand:[.3,1.8,.6]}};
p.magic.press();p.magic.stage=1;p.update(.3,{speed:.3,charging:true});p.render(camera);const first=p.lastPositions.LeftFoot.clone();assert.deepEqual(p.lastPositions.RightHand.toArray(),[.3,1.8,.6]);p.update(.3,{speed:.3,charging:true});p.render(camera);assert.ok(first.distanceTo(p.lastPositions.LeftFoot)>.1,'saved walking legs advance beneath fixed charge upper body');
p.magic.stage=2;p.render(camera);assert.equal(p.lastPositions.LeftFoot.z,0,'second ring uses planted charge legs');p.dispose();console.log('PASS: first-ring charge keeps authored upper body and animated walking legs; second ring keeps authored feet');
