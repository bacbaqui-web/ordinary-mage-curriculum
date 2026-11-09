import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import * as T from './dist/three.module.js';
import {GLTFLoader} from './dist/vendor/GLTFLoader.js';
import {CharacterRig} from './dist/character-rig.mjs';
import {createWizard,setWizardCharacter,animateWizard,projectWizard} from './dist/wizard.mjs';
import {motionStorageKey} from './dist/character-profiles.mjs';
globalThis.ProgressEvent ||= class {constructor(t,v){Object.assign(this,v);}};
async function scene(path){const b=await fs.readFile('dist/'+path),size=b.readUInt32LE(12),j=JSON.parse(b.subarray(20,20+size)),binSize=b.readUInt32LE(20+size);j.buffers=[{byteLength:binSize,uri:'data:application/octet-stream;base64,'+b.subarray(28+size,28+size+binSize).toString('base64')}];delete j.images;delete j.textures;j.materials=[{}];return (await new GLTFLoader().parseAsync(JSON.stringify(j),'')).scene;}
let loads=0;
const load=async(url,accessories,garment,lift,back)=>{loads++;const rig=new CharacterRig(await scene(url),{ankleLift:lift,ankleBack:back});for(const a of accessories)rig.addAccessory(await scene(a.model),a);return rig;};
const stores=new Map();globalThis.localStorage={getItem:k=>stores.get(k)||null};
const actor=createWizard(new T.Scene(),0,0),camera=new T.PerspectiveCamera();camera.position.set(4,4,4);camera.lookAt(0,1,0);
const rig=await setWizardCharacter(actor,'ice',{load});assert.ok(rig.accessories.has('ice-bag'));assert.equal(actor.userData.puppet.visual.visible,false);
await setWizardCharacter(actor,'ice',{load});assert.equal(loads,1);
const pose=structuredClone(rig.restPose);pose.LeftHand[2]+=.2;
const project={version:1,rigVersion:7,characterId:'ice',actions:[{name:'기본 걷기',frames:2,fps:12,keys:[{frame:0,ease:'hold',pose}]}]};
stores.set(motionStorageKey('ice'),JSON.stringify(project));
for(const angle of [0,.7,Math.PI,-2]){
 actor.position.set(5,0,-3);actor.rotation.y=angle;animateWizard(actor,1/60,{speed:2});projectWizard(actor,camera);
 for(const n of ['Head','LeftHand','RightFoot'])assert.ok(rig.bones[n].getWorldPosition(new T.Vector3()).distanceTo(actor.userData.puppet.lastPositions[n])<1e-5,'model follows saved joints under actor translation/rotation');
 const bag=rig.accessories.get('ice-bag');assert.equal(bag.parent,rig.bones.Hips);assert.ok(bag.userData.strap.mesh.geometry.attributes.position.count>0);
}
pose.Head[1]+=.1;stores.set(motionStorageKey('ice'),JSON.stringify(project));projectWizard(actor,camera);
assert.ok(Math.abs(rig.bones.Head.getWorldPosition(new T.Vector3()).y-pose.Head[1])<1e-6);
await setWizardCharacter(actor,'fire',{load});assert.equal(actor.userData.characterRig,null);assert.equal(actor.userData.puppet.visual.visible,true);assert.ok(actor.userData.palette.every(p=>!p.rig));
let resolve;const pending=setWizardCharacter(actor,'ice',{load:()=>new Promise(r=>resolve=r)});await setWizardCharacter(actor,'fire',{load});let disposed=false;resolve({dispose(){disposed=true;}});await pending;assert.ok(disposed);assert.equal(actor.userData.characterRig,null);
console.log('PASS: actual ice model/bag, saved pose and live update, transformed world joints, one load per selection, switch cleanup and stale-load protection');
