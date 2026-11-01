import assert from 'node:assert/strict';
import * as T from './dist/three.module.js';
import {LowPolyVFX} from './dist/lowpoly-vfx.mjs';
const scene=new T.Scene(),vfx=new LowPolyVFX(scene),d=new T.Vector3(1,0,0),a={x:0,z:0};
for(let i=0;i<15;i++){
 vfx.burst({kind:i%2?'i':'q',rings:3,halfAngle:.52,range:5.7},d,a,()=>false);
 vfx.bolt(2,2,{rings:3,height:5.2,radius:.88});
 vfx.force({force:i%2?-3:3,halfAngle:.76,range:6,speed:10},d,a);
}
assert.ok(vfx.stats().particles<=700);
for(let i=0;i<180;i++)vfx.update(1/60);
assert.deepEqual(vfx.stats(),{particles:0,effects:0,style:'lowpoly-v1'});
assert.equal(scene.children.length,2);
vfx.burst({kind:'q',rings:3,halfAngle:.52,range:5.7},d,a,()=>true);assert.equal(vfx.stats().particles,0);
vfx.bolt(0,0,{rings:1,height:3.4,radius:.38});vfx.clear();assert.equal(scene.children.length,2);
console.log('PASS: particle cap, effect expiry, transient cleanup, blocked cone, reset');
