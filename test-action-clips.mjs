import assert from 'node:assert/strict';
import * as T from './dist/three.module.js';
import {demoMotion,MotionPuppet} from './dist/motion-puppet.mjs';
const p=new MotionPuppet(new T.Scene());
assert.deepEqual(p.clips.slice(1).map(c=>c.name),['베기','주먹 타격','방어','마법 시전']);
for(let i=1;i<p.clips.length;i++){
 p.select(i);const samples=[];
 for(let n=0;n<=24;n++){p.time=p.clips[i].duration*n/24;p.update(0);const hand=p.bones.RightHand.getWorldPosition(new T.Vector3()),elbow=p.bones.RightForeArm.getWorldPosition(new T.Vector3());assert.ok(Math.abs(hand.distanceTo(elbow)-.32)<1e-5);assert.ok(hand.toArray().every(Number.isFinite));samples.push(hand);}
 assert.ok(samples.some(v=>v.distanceTo(samples[0])>.25));assert.ok(samples.at(-1).distanceTo(samples[0])<1e-4);
}
console.log('PASS: four action clips move hands, preserve forearm length, and return to loop start');
