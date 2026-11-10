import assert from 'node:assert/strict';
import {pointsInBox,fitSelected} from './dist/pose-selection.mjs';
import {moveJoint} from './dist/pose-constraints.mjs';
import {demoMotion} from './dist/motion-puppet.mjs';
import {JOINTS} from './dist/pose-data.mjs';
import {Vector3} from './dist/three.module.js';
assert.deepEqual(pointsInBox({Head:{x:5,y:5},Neck:{x:4,y:4},Hips:{x:12,y:12}},{x:10,y:10},{x:0,y:0}),['Head']);
const {root}=demoMotion();root.updateMatrixWorld(true);const base=Object.fromEntries(JOINTS.map(n=>[n,root.getObjectByName(n).getWorldPosition(new Vector3()).toArray()]));
const targets={LeftHand:[-8,3,0],RightHand:[8,3,0]},result=fitSelected(base,targets,moveJoint,(p,n)=>p[n]);
for(const side of ['Left','Right'])for(const [a,b] of [['Arm','ForeArm'],['ForeArm','Hand']]){
 const length=p=>new Vector3(...p[side+a]).distanceTo(new Vector3(...p[side+b]));assert.ok(Math.abs(length(result)-length(base))<1e-6);
}
const score=p=>Object.entries(targets).reduce((s,[n,t])=>s+new Vector3(...p[n]).distanceToSquared(new Vector3(...t)),0);
assert.ok(score(result)<score(base));assert.deepEqual(base.Hips,result.Hips);
const reachable={Head:base.Head.map((v,i)=>v+(i===0?.15:0))};const moved=fitSelected(base,reachable,moveJoint,(p,n)=>p[n]);assert.ok(new Vector3(...moved.Head).distanceTo(new Vector3(...reachable.Head))<1e-6);
console.log('PASS: reversed marquee, hidden neck exclusion, multi-point constrained paste, bone lengths and reachable target');
