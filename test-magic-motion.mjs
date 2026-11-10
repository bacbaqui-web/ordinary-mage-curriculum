import assert from 'node:assert/strict';
import * as T from './dist/three.module.js';
import {MagicMotion,chargeMoveScale} from './dist/magic-motion.mjs';
assert.equal(chargeMoveScale(true,1),.3);assert.equal(chargeMoveScale(true,2),0);assert.equal(chargeMoveScale(false,0),1);
const m=new MagicMotion();let shots=0;m.release(1,()=>shots++);m.update(1/12);assert.equal(shots,0);m.update(1/12);assert.equal(shots,1);m.update(.1);assert.equal(shots,1);
m.press();m.update(1.2,2);let p={};m.apply(p);const left=p.LeftFoot.clone();assert.ok(p.LeftHand.z>.6);assert.ok(p.RightHand.y>1.9);assert.ok(p.RightToe.x>p.RightFoot.x);assert.ok(p.RightToe.z<p.RightFoot.z);
m.release(2);m.update(.16);const travel=m.takeStep();assert.ok(travel>.47);p={};m.apply(p);assert.ok(p.LeftFoot.clone().add(new T.Vector3(0,0,travel)).distanceTo(left)<1e-9);assert.ok(p.RightHand.z>.6);assert.ok(p.LeftHand.z<0);assert.ok(p.RightFoot.z+travel>.6);
m.update(1);assert.equal(m.mode,'idle');console.log('PASS: 30 percent first-ring walk and stationary second ring, third-frame single emission, hand swap, planted left foot and forward right step');
