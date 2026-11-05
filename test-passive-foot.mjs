import assert from 'node:assert/strict';
import {PassiveFoot,FOOT_LENGTH} from './dist/passive-foot.mjs';
const foot=new PassiveFoot();let p;
for(let i=0;i<600;i++)p=foot.update([0,.8,0],1/120);
assert.ok(Math.abs(p.angle+Math.PI/2)<.01,'lifted foot hangs down');
for(let i=0;i<240;i++){
 p=foot.update([0,.1+.7*(1-i/239),Math.sin(i*.05)*.2],1/120);
 assert.ok(p.heel[1]-p.radius>=-1e-9);assert.ok(p.toe[1]-p.radius>=-1e-9);
 assert.ok(Math.abs(Math.hypot(...p.toe.map((v,j)=>v-p.heel[j]))-FOOT_LENGTH)<1e-9);
}
for(let i=0;i<120;i++)p=foot.update([0,.1,0],1/120);
assert.ok(Math.abs(p.angle)<.001,'ground contact lays foot flat');
const atRest=p.angle;for(let i=0;i<10;i++)p=foot.update([0,.8,i*.01],1/120);
assert.notEqual(p.angle,atRest);
console.log('PASS: gravity, ankle motion, fixed foot length, sole contact, stable landing');
