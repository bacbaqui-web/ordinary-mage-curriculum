import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import * as T from './dist/three.module.js';
import {GLTFLoader} from './dist/vendor/GLTFLoader.js';
import {CharacterRig} from './dist/character-rig.mjs';
import {createWizard,setWizardCharacter,animateWizard,projectWizard} from './dist/wizard.mjs';
import {BodyFollow,angleDelta} from './dist/body-follow.mjs';
import {motionStorageKey} from './dist/character-profiles.mjs';
globalThis.ProgressEvent ||= class {constructor(t,v){Object.assign(this,v);}};
async function scene(path){const b=await fs.readFile('dist/'+path),size=b.readUInt32LE(12),j=JSON.parse(b.subarray(20,20+size)),binSize=b.readUInt32LE(20+size);j.buffers=[{byteLength:binSize,uri:'data:application/octet-stream;base64,'+b.subarray(28+size,28+size+binSize).toString('base64')}];delete j.images;delete j.textures;j.materials=[{}];return (await new GLTFLoader().parseAsync(JSON.stringify(j),'')).scene;}
let loads=0;
const load=async(url,accessories,garment,lift,back)=>{loads++;const rig=new CharacterRig(await scene(url),{ankleLift:lift,ankleBack:back});for(const a of accessories)rig.addAccessory(await scene(a.model),a);return rig;};
const stores=new Map();globalThis.localStorage={getItem:k=>stores.get(k)||null};
const actor=createWizard(new T.Scene(),0,0),camera=new T.PerspectiveCamera();camera.position.set(4,4,4);camera.lookAt(0,1,0);
const rig=await setWizardCharacter(actor,'ice',{load});assert.ok(rig.accessories.has('ice-bag'));assert.equal(actor.userData.puppet.visual.visible,false);
await setWizardCharacter(actor,'ice',{load});assert.equal(loads,1);
const pose=structuredClone(rig.restPose);pose.LeftHand[2]+=.2;rig.apply(pose);Object.assign(pose,rig.bagControls());pose.BagCenter[0]-=.2;pose.BagDirection=new T.Vector3(.2,.34,0).normalize().multiplyScalar(.4).add(new T.Vector3(...pose.BagCenter)).toArray();
const project={version:1,rigVersion:7,characterId:'ice',actions:[{name:'기본 걷기',frames:2,fps:12,keys:[{frame:0,ease:'hold',pose}]}]};
stores.set(motionStorageKey('ice'),JSON.stringify(project));
for(const angle of [0,.7,Math.PI,-2]){
 actor.position.set(5,0,-3);actor.rotation.y=angle;animateWizard(actor,1/60,{speed:2});projectWizard(actor,camera);
 for(const n of ['Head','LeftHand','RightFoot'])assert.ok(rig.bones[n].getWorldPosition(new T.Vector3()).distanceTo(actor.userData.puppet.lastPositions[n])<1e-5,'model follows saved joints under actor translation/rotation');
 for(const [name,point] of Object.entries(rig.bagControls()))assert.ok(new T.Vector3(...point).distanceTo(actor.userData.puppet.lastPositions[name])<1e-5,'saved bag controls follow actor transforms');
 const bag=rig.accessories.get('ice-bag');assert.equal(bag.parent,rig.bones.Hips);assert.ok(bag.userData.strap.mesh.geometry.attributes.position.count>0);
}
pose.Head[1]+=.1;stores.set(motionStorageKey('ice'),JSON.stringify(project));projectWizard(actor,camera);
assert.ok(Math.abs(rig.bones.Head.getWorldPosition(new T.Vector3()).y-pose.Head[1])<1e-6);
delete pose.BagCenter;delete pose.BagDirection;stores.set(motionStorageKey('ice'),JSON.stringify(project));
// Dynamic strap ends stay attached to the swinging bag and its shoulder route.
const bag=rig.accessories.get('ice-bag'),strap=bag.userData.strap;
let maxSwing=0;
for(let i=0;i<120;i++){
 actor.position.z+=4.4/120;animateWizard(actor,1/120,{speed:4.4});projectWizard(actor,camera);
 maxSwing=Math.max(maxSwing,Math.abs(bag.userData.bagMotion.carrier.rotation.x));
 const positions=strap.mesh.geometry.attributes.position;
 for(const [start,sign] of [[0,1],[positions.count-5,-1]]){
  const center=new T.Vector3();for(let j=0;j<4;j++)center.add(new T.Vector3().fromBufferAttribute(positions,start+j));center.multiplyScalar(.25);strap.mesh.localToWorld(center);
  const anchor=strap.carrier.localToWorld(new T.Vector3(0,strap.top,sign*strap.halfDepth));
  assert.ok(center.distanceTo(anchor)<1e-5,'strap stays attached to both bag corners while moving');
 }
}
assert.ok(maxSwing>.03,'actual game movement drives bag rotation');
// Check visible bone orientation, not just the controller's angle counters.
stores.clear();actor.position.set(0,0,0);actor.rotation.set(0,0,0);
const follow=new BodyFollow({headSpeed:360,chestSpeed:180,pelvisSpeed:90});
actor.userData.puppet.bodyFollow=follow;
follow.update(0,{aim:0});animateWizard(actor,0,{speed:0});projectWizard(actor,camera);
const restFacing=Object.fromEntries(['Head','Spine','Hips','LeftFoot','RightFoot'].map(n=>[n,rig.bones[n].getWorldQuaternion(new T.Quaternion())]));
actor.rotation.y=Math.PI/2;follow.update(.1,{aim:Math.PI/2});projectWizard(actor,camera);
for(const [name,degrees] of [['Head',36],['Spine',18],['Hips',9],['LeftFoot',9],['RightFoot',9]]){
 const delta=rig.bones[name].getWorldQuaternion(new T.Quaternion()).multiply(restFacing[name].clone().invert()),forward=new T.Vector3(0,0,1).applyQuaternion(delta);
 assert.ok(Math.abs(angleDelta(Math.atan2(forward.x,forward.z),degrees*Math.PI/180))<.035,name+' visible rotation follows configured speed');
}
for(let i=0;i<120;i++){follow.update(1/60,{aim:Math.PI/2});projectWizard(actor,camera);}
for(const name of ['Head','Spine','Hips','LeftFoot','RightFoot']){
 const forward=new T.Vector3(0,0,1).applyQuaternion(rig.bones[name].getWorldQuaternion(new T.Quaternion()).multiply(restFacing[name].clone().invert()));
 assert.ok(Math.abs(angleDelta(Math.atan2(forward.x,forward.z),Math.PI/2))<.035,name+' converges to aim');
}
actor.userData.puppet.bodyFollow=null;
await setWizardCharacter(actor,'fire',{load});assert.equal(actor.userData.characterRig,null);assert.equal(actor.userData.puppet.visual.visible,true);assert.ok(actor.userData.palette.every(p=>!p.rig));
let resolve;const pending=setWizardCharacter(actor,'ice',{load:()=>new Promise(r=>resolve=r)});await setWizardCharacter(actor,'fire',{load});let disposed=false;resolve({dispose(){disposed=true;}});await pending;assert.ok(disposed);assert.equal(actor.userData.characterRig,null);
console.log('PASS: actual ice model/bag, saved pose and live update, transformed world joints, one load per selection, switch cleanup and stale-load protection');
