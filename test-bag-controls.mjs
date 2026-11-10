import assert from 'node:assert/strict';
import {moveBag,bagHandles} from './dist/bag-controls.mjs';
import {JOINTS,samplePose,validateProject} from './dist/pose-data.mjs';
import {moveJoint} from './dist/pose-constraints.mjs';
const pose={...Object.fromEntries(JOINTS.map(n=>[n,[0,1,0]])),BagCenter:[-.5,1,0],BagDirection:[-.5,1.4,0]};
const moved=moveBag(pose,'BagCenter',[-1,1.8,1]);
assert.deepEqual(moved.BagCenter,[-1,2,1]);assert.deepEqual(moved.BagDirection,[-1,2.4,1]);
for(const joint of ['BagCenter','BagDirection']){
 const start=bagHandles(pose)[joint],target=start.map(v=>v+.5),shifted=moveBag(pose,joint,target);
 for(const name of ['BagCenter','BagDirection'])for(let i=0;i<3;i++)assert.ok(Math.abs(shifted[name][i]-pose[name][i]-.5)<1e-10);
 assert.deepEqual(shifted.Hips,pose.Hips);
 assert.deepEqual(moveBag(pose,joint,start),pose);
}
const action={name:'대기',frames:3,fps:12,keys:[{frame:0,ease:'smooth',pose},{frame:2,ease:'smooth',pose:moved}]};
const loaded=validateProject(JSON.parse(JSON.stringify({version:1,actions:[action]})));
assert.deepEqual(samplePose(loaded.actions[0],1).BagCenter,[-.75,1.5,.5]);
assert.deepEqual(moveJoint(pose,'Hips',[1,2,0]).BagCenter,[.5,2,0]);
console.log('PASS: bag translation, both handles move together without rotation, unchanged drag, save/load, interpolation and pelvis following');
