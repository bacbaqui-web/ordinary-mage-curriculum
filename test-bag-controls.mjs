import assert from 'node:assert/strict';
import {moveBag,bagHandles} from './dist/bag-controls.mjs';
import {JOINTS,samplePose,validateProject} from './dist/pose-data.mjs';
import {moveJoint} from './dist/pose-constraints.mjs';
const pose={...Object.fromEntries(JOINTS.map(n=>[n,[0,1,0]])),BagCenter:[-.5,1,0],BagDirection:[-.5,1.4,0]};
const moved=moveBag(pose,'BagCenter',[-1,1.8,1]);
const near=(a,b)=>a.forEach((v,i)=>assert.ok(Math.abs(v-b[i])<1e-9));
for(const joint of ['BagCenter','BagDirection']){
 const other=joint==='BagCenter'?'BagDirection':'BagCenter';
 let current=pose;
 for(let i=1;i<=30;i++){
  const before=bagHandles(current),target=[-.5+i*.02,before[joint][1],i*.005];
  current=moveBag(current,joint,target);const after=bagHandles(current);
  near(after[joint],target);
  assert.ok(Math.abs(Math.hypot(...after[other].map((v,j)=>v-after[joint][j]))-.4)<1e-9);
  assert.ok(after[other][0]<target[0],'free endpoint trails the dragged endpoint');
  assert.deepEqual(current.Hips,pose.Hips);
 }
 near(moveBag(pose,joint,bagHandles(pose)[joint]).BagCenter,pose.BagCenter);
 const overlap=moveBag(pose,joint,bagHandles(pose)[other]);
 assert.ok(overlap.BagDirection.every(Number.isFinite));
}
const action={name:'대기',frames:3,fps:12,keys:[{frame:0,ease:'smooth',pose},{frame:2,ease:'smooth',pose:moved}]};
const loaded=validateProject(JSON.parse(JSON.stringify({version:1,actions:[action]})));
near(samplePose(loaded.actions[0],1).BagCenter,pose.BagCenter.map((v,i)=>(v+moved.BagCenter[i])/2));
assert.deepEqual(moveJoint(pose,'Hips',[1,2,0]).BagCenter,[.5,2,0]);
console.log('PASS: bag translation, rigid spacing with trailing endpoint and rotation, unchanged drag, save/load, interpolation and pelvis following');
