import test from 'node:test';
import assert from 'node:assert/strict';
import {Vector3} from './dist/three.module.js';
import {projectileGuideSpec,projectileGuidePoints} from './dist/projectile-guide.mjs';
test('projectile guides start at the emission point and end at actual travel distance at the same height',()=>{
 for(const seq of ['i','ii','iw','qw','qqw','qww','qiw','qlw','lw','lww']){
 const spec=projectileGuideSpec(seq),origin=new Vector3(3,1.42,-2),dir=new Vector3(.6,0,.8),points=projectileGuidePoints(origin,dir,spec);
 assert.deepEqual(points[0],origin,seq);assert.ok(Math.abs(points[0].distanceTo(points[1])-spec.range)<1e-8,seq);
 for(const p of points)assert.equal(p.y,origin.y,seq);
 assert.ok(points[1].clone().sub(origin).normalize().distanceTo(dir)<1e-8,seq);
 }
});
test('ground fields and installed walls never receive a projectile guide',()=>{
 for(const seq of ['it','qt','lt','ie','qe','le','il','ql','qil','qll','eew'])assert.equal(projectileGuideSpec(seq),null,seq);
 assert.equal(projectileGuideSpec('i','right'),null);assert.equal(projectileGuideSpec('ii','right'),null);
});
test('wall stops the guide before it reaches the blocked region',()=>{
 const p=projectileGuidePoints(new Vector3(1,1.4,2),new Vector3(1,0,0),{range:7,width:.16},p=>p.x>=4);
 assert.ok(p[1].x<4&&p[1].x>3.9);assert.equal(p[1].y,1.4);
});
