import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from './dist/three.module.js';
import {IceBasic} from './dist/ice-basic.mjs';
import {CastingFeedback} from './dist/casting-feedback.mjs';
test('ice mist has one ring between both hands, normal aligned with emission',()=>{
 const scene=new T.Scene(),ice=new IceBasic({scene,clearPath:()=>true}),owner={x:0,z:0},dir=new T.Vector3(.6,0,.8),positions={LeftHand:new T.Vector3(-.4,1.3,.6),RightHand:new T.Vector3(.4,1.5,.8)},puppet={lastPositions:positions},mid=positions.LeftHand.clone().add(positions.RightHand).multiplyScalar(.5);
 ice.cast(owner,dir,'right',null,1,true);ice.syncHands(owner,puppet);
 const ring=ice.effects.find(e=>e.type==='iceHandRing'),mist=ice.effects.find(e=>e.type==='iceMist'),flash=ice.effects.find(e=>e.type==='castFlash');assert.deepEqual(ring.mesh.position,mid);assert.deepEqual(flash.mesh.position,mid);assert.ok(new T.Vector3(0,0,1).applyQuaternion(ring.mesh.quaternion).distanceTo(dir)<1e-9);assert.equal(mist.mesh.children.some(c=>c.userData.halo),false);assert.ok(mist.mesh.position.clone().add(new T.Vector3(0,1.05,0)).distanceTo(mid)<1e-9);
 const key={g:{visible:true,userData:{puppet:{chargeUsesIce:true,chargeHand:'right',icePose:[{hand:'right',dir}]}}}},feedback=new CastingFeedback(scene);feedback.charge(key,true,1,['#8fe2ff'],positions,new T.PerspectiveCamera());const charge=feedback.actors.get(key);assert.deepEqual(charge.group.position,mid);assert.equal(charge.rings.filter(r=>r.visible).length,1);assert.ok(new T.Vector3(0,0,1).applyQuaternion(charge.group.quaternion).distanceTo(dir)<1e-9);feedback.clear();
});
