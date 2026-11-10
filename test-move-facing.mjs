import assert from 'node:assert/strict';
import {BodyFollow,angleDelta} from './dist/body-follow.mjs';
import {movementDirection} from './dist/keyboard-movement.mjs';
const b=new BodyFollow({headSpeed:540,chestSpeed:360,pelvisSpeed:120});
for(const key of ['KeyW','KeyA','KeyS','KeyD'])for(const aim of [-3,-1,0,1,3]){
 const d=movementDirection(new Set([key])),facing=Math.atan2(d.x,d.z);
 for(let i=0;i<60;i++)b.updateLocomotion(1/60,{aim,facing});
 assert.ok(Math.abs(angleDelta(b.pelvis,facing))<1e-9);
 assert.ok(Math.abs(angleDelta(b.head,facing))<=Math.PI/2+1e-9);
 assert.ok(Math.abs(angleDelta(b.chest,facing))<=Math.PI/4+1e-9);
 b.updateLocomotion(0,{aim,facing,casting:true});
 for(const part of ['pelvis','chest','head'])assert.ok(Math.abs(angleDelta(b[part],aim))<1e-9);
 assert.deepEqual(b.orientation(),{headYaw:0,chestYaw:0,pelvisYaw:0});
}
console.log('PASS: WASD facing, head 90/chest 45 limits, wraparound and immediate skill facing');
