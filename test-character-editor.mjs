import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import * as T from './dist/three.module.js';
import {GLTFLoader} from './dist/vendor/GLTFLoader.js';
import {CharacterRig,fitProjectToRig} from './dist/character-rig.mjs';
import {CHARACTERS,motionStorageKey,projectForCharacter,assertCharacterImport} from './dist/character-profiles.mjs';
import {demoMotion} from './dist/motion-puppet.mjs';
import {JOINTS,validateProject} from './dist/pose-data.mjs';
import {moveJoint} from './dist/pose-constraints.mjs';
assert.equal(motionStorageKey('default'),'ordinary-mage-pose-editor-v1');
assert.equal(new Set(CHARACTERS.map(c=>motionStorageKey(c.id))).size,CHARACTERS.length);
const {root}=demoMotion();root.updateMatrixWorld(true);const pose=Object.fromEntries(JOINTS.map(n=>[n,root.getObjectByName(n).getWorldPosition(new T.Vector3()).toArray()]));
const original={version:1,actions:[{name:'걷기',frames:12,fps:12,keys:[{frame:0,ease:'linear',pose}]}]};
const ice=projectForCharacter(original,'ice');ice.actions[0].name='빙결 걷기';assert.equal(original.actions[0].name,'걷기');
assert.throws(()=>assertCharacterImport(ice,'fire'),/캐릭터/);assert.doesNotThrow(()=>assertCharacterImport(original,'ice'));
// Load the user's actual rig in Node without its browser-only image decoding.
const b=await fs.readFile('dist/assets/characters/ice.glb');const size=b.readUInt32LE(12),json=JSON.parse(b.subarray(20,20+size));let off=20+size;const binSize=b.readUInt32LE(off);off+=8;
json.buffers=[{byteLength:binSize,uri:'data:application/octet-stream;base64,'+b.subarray(off,off+binSize).toString('base64')}];delete json.images;delete json.textures;json.materials=[{}];
globalThis.ProgressEvent ||= class {constructor(type,values){Object.assign(this,values);}};
const gltf=await new GLTFLoader().parseAsync(JSON.stringify(json),'');const rig=new CharacterRig(gltf.scene);
const rest=rig.positions();console.log('Normalized rig:',Object.fromEntries(['Hips','Spine','Head','LeftArm','RightArm','LeftFoot'].map(n=>[n,rest[n]])));
const fitted=fitProjectToRig(ice,rest,pose);validateProject(fitted);rig.apply(fitted.actions[0].keys[0].pose);
for(const n of JOINTS)assert.ok(new T.Vector3(...rig.positions()[n]).distanceTo(new T.Vector3(...fitted.actions[0].keys[0].pose[n]))<1e-5,n+' handle matches skeleton');
const before=rig.bones.LeftArm.quaternion.clone();const p=fitted.actions[0].keys[0].pose;const changed=moveJoint(p,'LeftHand',[p.LeftHand[0],p.LeftHand[1]+.3,p.LeftHand[2]+.3]);rig.apply(changed);assert.ok(before.angleTo(rig.bones.LeftArm.quaternion)>.05);
for(const n of JOINTS)assert.ok(rig.positions()[n].every(Number.isFinite));
// Pose application must be deterministic, not accumulate rotations.
rig.apply(p);const first=rig.bones.LeftArm.quaternion.clone();rig.apply(changed);rig.apply(p);assert.ok(first.angleTo(rig.bones.LeftArm.quaternion)<1e-6);
console.log('PASS: isolated character keys, original preservation, import guard, actual GLB mapping, deformation and deterministic pose replay');

const records=new Map([[motionStorageKey('default'),JSON.stringify(original)],[motionStorageKey('ice'),JSON.stringify(ice)]]);
globalThis.localStorage={getItem:key=>records.get(key)};
const {useMotionCharacter,savedMotion}=await import('./dist/live-motions.mjs?v=character-editor-1');
useMotionCharacter('ice');assert.equal(savedMotion('빙결 걷기').name,'빙결 걷기');assert.equal(savedMotion('걷기'),null);
useMotionCharacter('fire');assert.ok(savedMotion('빙결 걷기')==null);
useMotionCharacter('default');assert.equal(savedMotion('걷기').name,'걷기');assert.equal(records.get(motionStorageKey('default')),JSON.stringify(original));
console.log('PASS: preview storage switches between characters without changing legacy data');

// The separate bag must follow the hip without resizing or changing the body rig.
const bagBytes=await fs.readFile('dist/assets/characters/ice-bag.glb');
const bagJSONLength=bagBytes.readUInt32LE(12),bagJSON=JSON.parse(bagBytes.subarray(20,20+bagJSONLength));
const bagBinOffset=28+bagJSONLength,bagBinLength=bagBytes.readUInt32LE(20+bagJSONLength);
bagJSON.buffers=[{byteLength:bagBinLength,uri:'data:application/octet-stream;base64,'+bagBytes.subarray(bagBinOffset,bagBinOffset+bagBinLength).toString('base64')}];
delete bagJSON.images;delete bagJSON.textures;bagJSON.materials=[{}];
const bagScene=(await new GLTFLoader().parseAsync(JSON.stringify(bagJSON),'')).scene;
rig.apply(rig.restPose);const restBefore=structuredClone(rig.restPose);
rig.addAccessory(bagScene,CHARACTERS.find(c=>c.id==='ice').accessories[0]);
const bag=rig.accessories.get('ice-bag'),box=()=>new T.Box3().setFromObject(bag.children[0],true);
const centerBefore=box().getCenter(new T.Vector3()),sizeBefore=box().getSize(new T.Vector3());
assert.ok(centerBefore.x<-.3,'bag is on character right');
assert.ok(Math.abs(sizeBefore.z-.6)<.001,'bag broad face points sideways');
const lifted=structuredClone(rig.restPose);for(const n of JOINTS)lifted[n][1]+=.3;rig.apply(lifted);
assert.ok(Math.abs(box().getCenter(new T.Vector3()).y-centerBefore.y-.3)<1e-5);
assert.ok(box().getSize(new T.Vector3()).distanceTo(sizeBefore)<1e-5);
assert.deepEqual(rig.restPose,restBefore);
assert.ok(Array.from(bag.userData.strap.mesh.geometry.attributes.position.array).every(Number.isFinite));
console.log('PASS: actual bag dimensions, right-side placement, hip follow, strap geometry and unchanged character proportions');

// The GLB ankle must not remain rigidly attached to a bent shin.
rig.apply(rig.restPose);const flat=rig.bones.LeftFoot.getWorldQuaternion(new T.Quaternion()).normalize();
const bent=structuredClone(rig.restPose);bent.LeftLeg[2]+=.2;rig.apply(bent);
assert.ok(flat.angleTo(rig.bones.LeftFoot.getWorldQuaternion(new T.Quaternion()).normalize())<1e-6);
const airborne=structuredClone(rig.restPose);for(const n of JOINTS)airborne[n][1]+=.8;
for(let i=0;i<360;i++)rig.apply(airborne,1/120);
assert.ok(Math.abs(rig.feet.LeftFoot.angle+Math.PI/2)<.02,'raised GLB foot hangs down');
assert.ok(flat.angleTo(rig.bones.LeftFoot.getWorldQuaternion(new T.Quaternion()).normalize())>1.4);
for(let i=0;i<180;i++)rig.apply(rig.restPose,1/120);
assert.ok(Math.abs(rig.feet.LeftFoot.angle)<.001,'landing returns foot to flat');
assert.ok(flat.angleTo(rig.bones.LeftFoot.getWorldQuaternion(new T.Quaternion()).normalize())<1e-5);
console.log('PASS: GLB ankle independence, airborne gravity and flat landing');
