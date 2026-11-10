import {test} from 'node:test';
import assert from 'node:assert/strict';
import {wheelZoomSpan as zoom} from './dist/camera-zoom.mjs';
test('wheel direction, inverse zoom and all wheel units',()=>{
 assert.ok(zoom(24,{deltaY:-100})<24);assert.ok(zoom(24,{deltaY:100})>24);
 assert.ok(Math.abs(zoom(zoom(24,{deltaY:-100}),{deltaY:100})-24)<1e-10);
 assert.equal(zoom(24,{deltaY:48}),zoom(24,{deltaY:3,deltaMode:1}));
 assert.equal(zoom(24,{deltaY:180}),zoom(24,{deltaY:.2,deltaMode:2},900));
});
test('bounded combat and overview zoom, large or invalid wheel events',()=>{
 let near=24,far=24;for(let i=0;i<100;i++){near=zoom(near,{deltaY:-1e6});far=zoom(far,{deltaY:1e6});}
 assert.equal(near,14);assert.equal(far,60);
 assert.equal(zoom(64,{deltaY:-100},900,{min:64,max:180}),64);
 assert.equal(zoom(180,{deltaY:100},900,{min:64,max:180}),180);
 assert.equal(zoom(24,{deltaY:NaN}),24);assert.equal(zoom(24,{deltaY:0}),24);
});
