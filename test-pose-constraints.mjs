import assert from 'node:assert/strict';
import {demoMotion} from './dist/motion-puppet.mjs';
import {Vector3} from './dist/three.module.js';
import {JOINTS} from './dist/pose-data.mjs';
import {BONES,moveJoint} from './dist/pose-constraints.mjs';
const {root}=demoMotion();root.updateMatrixWorld(true);
const base=Object.fromEntries(JOINTS.map(n=>[n,root.getObjectByName(n).getWorldPosition(new Vector3()).toArray()]));
const dist=(p,a,b)=>new Vector3(...p[a]).distanceTo(new Vector3(...p[b]));
for(const joint of JOINTS)for(const target of [[1,1,1],[0,0,0],[20,20,20],base[BONES.find(([,b])=>b===joint)?.[0]||'Hips']]){
 const p=moveJoint(base,joint,target);
 for(const [a,b] of BONES)assert.ok(Math.abs(dist(p,a,b)-dist(base,a,b))<1e-6,`${joint}: ${a} ${b}`);
 assert.deepEqual(base.Hips,[0,1,0]);
}
const target=[-.4,1.3,.3],p=moveJoint(base,'LeftHand',target);
assert.ok(new Vector3(...p.LeftHand).distanceTo(new Vector3(...target))<1e-6);
assert.deepEqual(p.LeftArm,base.LeftArm);
console.log('관절 이동: 모든 부위 길이 유지, 손 목표 도달, 어깨 고정 확인');
for(const joint of JOINTS){
 const p=moveJoint(base,joint,[base[joint][0],-5,base[joint][2]]);
 for(const a of Object.values(p))assert.ok(a[1]>=-1e-8,'바닥 아래로 내려가면 안 됩니다.');
 for(const [a,b] of BONES)assert.ok(Math.abs(dist(p,a,b)-dist(base,a,b))<1e-6);
}
console.log('바닥 충돌과 부위 길이 유지 확인');
const crouch=moveJoint(base,'Hips',[0,.5,0]);
assert.ok(Math.abs(crouch.Hips[1]-.5)<1e-8,'pelvis reaches crouch target');
for(const side of ['Left','Right']){
 assert.ok(Math.abs(crouch[side+'Foot'][1]-.1)<1e-6,'ankle stops at floor');
 assert.ok(Math.abs(crouch[side+'Foot'][0]-base[side+'Foot'][0])<1e-6);
 assert.ok(Math.abs(crouch[side+'Foot'][2]-base[side+'Foot'][2])<1e-6);
 assert.ok(crouch[side+'Leg'][2]>crouch[side+'UpLeg'][2]+.1,'knee bends forward');
}
assert.ok(Math.abs(crouch.Head[1]-base.Head[1]+.5)<1e-8,'upper body follows pelvis');
const lifted=moveJoint(base,'Hips',[.3,1.5,.2]);
for(const n of JOINTS)assert.ok(new Vector3(...lifted[n]).distanceTo(new Vector3(...base[n]).add(new Vector3(.3,.5,.2)))<1e-6);
console.log('골반 이동: 상체 따라가기, 발 접지, 무릎 굽힘, 몸 전체 들어올리기 확인');
