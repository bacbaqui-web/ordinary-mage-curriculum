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

rig.apply(rig.restPose);const headForward=rig.bones.Head.getWorldQuaternion(new T.Quaternion()).normalize();
const leaned=structuredClone(rig.restPose);leaned.Head[0]+=.2;leaned.Head[2]+=.25;rig.apply(leaned);
assert.ok(headForward.angleTo(rig.bones.Head.getWorldQuaternion(new T.Quaternion()).normalize())<1e-6);
for(const name of ['LeftHand','RightHand']){
 assert.ok(rig.handCenters[name],'actual hand skin has a control center');
 const controls=rig.controlPose(leaned);
 const handPoint=rig.bones[name].localToWorld(rig.handCenters[name].clone());
 const descendants=new Set();rig.bones[name].traverse(b=>descendants.add(b));
 const visibleCenter=new T.Vector3();let vertices=0;
 rig.root.traverse(mesh=>{if(!mesh.isSkinnedMesh)return;const weights=mesh.geometry.attributes.skinWeight,indices=mesh.geometry.attributes.skinIndex;
  for(let i=0;i<weights.count;i++){let w=0;for(let k=0;k<4;k++)if(descendants.has(mesh.skeleton.bones[indices.getComponent(i,k)]))w+=weights.getComponent(i,k);
   if(w>=.65){visibleCenter.add(mesh.localToWorld(mesh.getVertexPosition(i,new T.Vector3())));vertices++;}
  }
 });
 visibleCenter.divideScalar(vertices);
 assert.ok(visibleCenter.distanceTo(new T.Vector3(...controls[name]))<.03,'control stays inside deformed hand skin');
 assert.ok(handPoint.distanceTo(new T.Vector3(...leaned[name]))>.01,'palm control is distinct from wrist');
}
console.log('PASS: face stays forward when torso leans, both hand controls follow palm skin');

// Old files gain only Neck; every previously authored coordinate survives.
const legacy=structuredClone(original);for(const a of legacy.actions)for(const k of a.keys)delete k.pose.Neck;
const legacyBefore=structuredClone(legacy);validateProject(legacy);
assert.ok(legacy.actions[0].keys[0].pose.Neck);
for(const n of JOINTS.filter(n=>n!=='Neck'))assert.deepEqual(legacy.actions[0].keys[0].pose[n],legacyBefore.actions[0].keys[0].pose[n]);
rig.apply(rig.restPose);
const neckMoved=moveJoint(rig.restPose,'Neck',[.15,rig.restPose.Neck[1],.15]);
assert.notDeepEqual(neckMoved.Head,rig.restPose.Head);assert.deepEqual(neckMoved.Spine,rig.restPose.Spine);
rig.apply(neckMoved);assert.ok(new T.Vector3(...rig.positions().Neck).distanceTo(new T.Vector3(...neckMoved.Neck))<1e-6);
// Shoe vertices below the cuff are attached to a single ankle, not stretched by the shin.
let shoeVertices=0;rig.apply(rig.restPose);
rig.root.traverse(mesh=>{if(!mesh.isSkinnedMesh)return;const pos=mesh.geometry.attributes.position,w=mesh.geometry.attributes.skinWeight,ix=mesh.geometry.attributes.skinIndex;
 for(let i=0;i<pos.count;i++){const p=mesh.localToWorld(mesh.getVertexPosition(i,new T.Vector3()));if(p.y>.12)continue;
  let ankleWeight=0;for(let k=0;k<4;k++)if(/Foot$/.test(mesh.skeleton.bones[ix.getComponent(i,k)].name))ankleWeight+=w.getComponent(i,k);
  assert.ok(ankleWeight>.999);shoeVertices++;
 }
});assert.ok(shoeVertices>100);
const {GarmentCollision}=await import('./dist/garment-collision.mjs');
rig.garment=new GarmentCollision(rig,CHARACTERS.find(c=>c.id==='ice').garment);assert.ok(rig.garment.parts.length);
rig.apply(rig.restPose);const neutral=rig.garment.parts.map(({mesh})=>Array.from(mesh.geometry.attributes.position.array));
const highKnee=moveJoint(rig.restPose,'LeftLeg',[.11,.86,.35]);rig.apply(highKnee);
assert.ok(rig.garment.pushed>0,'raised leg pushes coat vertices');
for(const {mesh,vertices} of rig.garment.parts){const p=mesh.geometry.attributes.position;assert.ok(vertices.some(({index,original})=>new T.Vector3().fromBufferAttribute(p,index).distanceTo(original)>.0001));assert.ok(Array.from(p.array).every(Number.isFinite));}
rig.apply(rig.restPose);for(const [i,{mesh}] of rig.garment.parts.entries())assert.deepEqual(Array.from(mesh.geometry.attributes.position.array),neutral[i],'coat recovers deterministically');
console.log('PASS: legacy Neck migration, independent neck edit, rigid ankle skin and reversible coat collision');

// Moving the actual bind pivot preserves rest geometry, then rotates the shoe around the cuff.
const oldCuffRig=new CharacterRig((await new GLTFLoader().parseAsync(JSON.stringify(json),'')).scene);
const cuffRig=new CharacterRig((await new GLTFLoader().parseAsync(JSON.stringify(json),'')).scene,{ankleLift:.075});
let oldMesh,cuffMesh;oldCuffRig.root.traverse(m=>{if(m.isSkinnedMesh)oldMesh=m;});cuffRig.root.traverse(m=>{if(m.isSkinnedMesh)cuffMesh=m;});
for(let i=0;i<oldMesh.geometry.attributes.position.count;i+=17){
 const a=oldMesh.localToWorld(oldMesh.getVertexPosition(i,new T.Vector3())),b=cuffMesh.localToWorld(cuffMesh.getVertexPosition(i,new T.Vector3()));
 assert.ok(a.distanceTo(b)<1e-5,'raising bind pivot keeps rest mesh unchanged');
}
assert.ok(cuffRig.restPose.LeftFoot[1]-oldCuffRig.restPose.LeftFoot[1]>.07);
const weights=cuffMesh.geometry.attributes.skinWeight,indices=cuffMesh.geometry.attributes.skinIndex;
let shoeIndex=-1;for(let i=0;i<weights.count;i++)if(cuffMesh.skeleton.bones[indices.getX(i)]===cuffRig.bones.LeftFoot&&weights.getX(i)>.999){shoeIndex=i;break;}
assert.ok(shoeIndex>=0);
const shoeBefore=cuffMesh.localToWorld(cuffMesh.getVertexPosition(shoeIndex,new T.Vector3())),pivotBefore=new T.Vector3(...cuffRig.restPose.LeftFoot),radius=shoeBefore.distanceTo(pivotBefore);
const liftedCuff=structuredClone(cuffRig.restPose);for(const n of JOINTS)liftedCuff[n][1]+=.6;
for(let i=0;i<360;i++)cuffRig.apply(liftedCuff,1/120);
const pivotAfter=cuffRig.bones.LeftFoot.getWorldPosition(new T.Vector3()),shoeAfter=cuffMesh.localToWorld(cuffMesh.getVertexPosition(shoeIndex,new T.Vector3()));
assert.ok(Math.abs(shoeAfter.distanceTo(pivotAfter)-radius)<1e-5,'shoe rotates at a fixed radius around new ankle');
assert.ok(shoeAfter.clone().sub(pivotAfter).distanceTo(shoeBefore.clone().sub(pivotBefore))>.03,'shoe really rotates, not only handle movement');
assert.ok(pivotAfter.distanceTo(new T.Vector3(...liftedCuff.LeftFoot))<1e-5);
const {migrateAnklePivot}=await import('./dist/ankle-pivot.mjs');
const legacyCuff={...structuredClone(original),rigVersion:2};const oldCuff=structuredClone(legacyCuff);
assert.ok(migrateAnklePivot(legacyCuff,.075));assert.equal(migrateAnklePivot(legacyCuff,.075),false);
for(const n of JOINTS.filter(n=>!n.endsWith('Foot')))assert.deepEqual(legacyCuff.actions[0].keys[0].pose[n],oldCuff.actions[0].keys[0].pose[n]);
assert.ok(legacyCuff.actions[0].keys[0].pose.LeftFoot[1]>oldCuff.actions[0].keys[0].pose.LeftFoot[1]);
console.log('PASS: cuff bind pivot, unchanged rest geometry, actual shoe rotation about new pivot and one-time saved pose migration');
const cuffClearance=Math.max(cuffRig.restPose.LeftFoot[1],cuffRig.restPose.RightFoot[1]);
const cuffCrouch=moveJoint(cuffRig.restPose,'Hips',[0,cuffRig.restPose.Hips[1]-.4,0],{footClearance:cuffClearance});
for(const side of ['Left','Right'])assert.ok(cuffCrouch[side+'Foot'][1]>=cuffClearance-1e-6,'new ankle height governs ground contact');
