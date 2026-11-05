import assert from 'node:assert/strict';
import * as T from './dist/three.module.js';
import {createWizard,animateWizard} from './dist/wizard.mjs';
const g=createWizard(new T.Scene(),0,0xffffff),j=g.userData.joints;
assert.equal(new Set(g.userData.palette.slice(0,6).map(p=>p.color.getHex())).size,6);
for(let i=0;i<20;i++)animateWizard(g,1/60,{speed:4.4});
assert.ok(Math.abs(j.leftLeg.rotation.x)>.1);assert.ok(j.leftLeg.rotation.x*j.rightLeg.rotation.x<0);
animateWizard(g,.016,{charging:true});assert.ok(j.rightArm.rotation.x<-1);
animateWizard(g,.016,{rolling:true,rollProgress:.5});assert.ok(j.leftLegBend.rotation.x>1);
for(let i=0;i<120;i++)animateWizard(g,1/60,{});
assert.ok(Math.abs(j.leftLeg.rotation.x)<.001);assert.equal(j.rightArmBend.rotation.x,-.12);
g.updateMatrixWorld(true);g.traverse(o=>assert.ok(o.matrixWorld.elements.every(Number.isFinite)));
console.log('PASS: distinct colors, alternating stride, charging, roll tuck, idle recovery, finite joint transforms');
const {projectWizard}=await import('./dist/wizard.mjs');
const camera=new T.PerspectiveCamera(38,1,.1,100);camera.position.set(6,7,9);camera.lookAt(0,1,0);
for(let i=0;i<16;i++){g.rotation.y=i*Math.PI/8;animateWizard(g,.1,{speed:4.4});projectWizard(g,camera);g.updateMatrixWorld(true);for(const p of g.userData.puppet.parts){const normal=new T.Vector3(0,0,1).transformDirection(p.mesh.matrixWorld),cam=new T.Vector3(0,0,1).applyQuaternion(camera.quaternion);assert.ok(normal.dot(cam)>.999);assert.ok(p.mesh.scale.y>0);}}
console.log('PASS: 2D skin follows animated skeleton through 16 headings');
