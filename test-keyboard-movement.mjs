import test from 'node:test';
import assert from 'node:assert/strict';
import {movementDirection} from './dist/keyboard-movement.mjs';
test('WASD follows the screen axes without diagonal speed gain',()=>{
 const direction=(...keys)=>movementDirection(new Set(keys));
 assert.deepEqual(direction('KeyW','KeyS','KeyA','KeyD'),{x:0,z:0});
 for(const keys of [['KeyW'],['KeyA'],['KeyS'],['KeyD'],['KeyW','KeyD']]){
 const d=direction(...keys);assert.ok(Math.abs(Math.hypot(d.x,d.z)-1)<1e-12);
 }
 assert.ok(direction('KeyW').x<0&&direction('KeyW').z<0);
 assert.ok(direction('KeyD').x>0&&direction('KeyD').z<0);
});
