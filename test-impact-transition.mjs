import assert from 'node:assert/strict';
import * as T from './dist/three.module.js';
import {createWizard,animateWizard,projectWizard} from './dist/wizard.mjs';
import {ImpactFeedback} from './dist/impact-feedback.mjs';
import {PoseTransition} from './dist/pose-transition.mjs';
const scene=new T.Scene(),g=createWizard(scene,0,0),camera=new T.PerspectiveCamera();
camera.position.set(4,4,4);camera.lookAt(0,1,0);
const puppet=g.userData.puppet;puppet.chargeHand='left';
animateWizard(g,0,{charging:true});projectWizard(g,camera);
const source=Object.fromEntries(Object.entries(puppet.lastPositions).map(([n,v])=>[n,v.toArray()]));
const target=structuredClone(source);target.LeftHand[2]+=1;
puppet.motionReader={savedMotion:()=>null,savedPose:name=>name==='1륜 좌클릭 발사'?target:source};
const a={g,hp:100},f=new ImpactFeedback(scene,{watch:false,settings:{anticipation:800}});let emitted=0;
f.cast(a,new T.Vector3(0,0,1),()=>emitted++);
for(const [dt,weight] of [[0,0],[.4,.5],[.4,1]]){
 f.step(dt);projectWizard(g,camera);
 assert(Math.abs(puppet.lastPositions.LeftHand.z-(source.LeftHand[2]+weight))<1e-7);
 assert.equal(emitted,0);
}
f.flush();assert.equal(emitted,1);assert.equal(puppet.castTransition,null);
puppet.magic.reset();puppet.playBasicAttack('left');animateWizard(g,1/60,{charging:false,cast:.25});projectWizard(g,camera);
assert.equal(puppet.poseTransition.duration,0,'ice basic attacks must not add the default 180ms blend after preparation');
f.cast(a,new T.Vector3(0,0,1),()=>emitted++);a.frozen=1;f.flush();assert.equal(puppet.castTransition,null);assert.equal(emitted,1);
const blend=new PoseTransition(0),pose={Head:new T.Vector3(0,1,0)};blend.apply(pose,'release',0);assert(Number.isFinite(pose.Head.y));
console.log('PASS: charge-to-release interpolation at 0/400/800ms, emission at completion, interruption cleanup and zero duration');
