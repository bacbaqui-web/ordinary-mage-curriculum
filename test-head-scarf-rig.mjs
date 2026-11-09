import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import * as T from './dist/three.module.js';
import {GLTFLoader} from './dist/vendor/GLTFLoader.js';
import {CharacterRig} from './dist/character-rig.mjs';
globalThis.ProgressEvent ||= class {constructor(type,values){Object.assign(this,values);}};
async function load(path){
 const bytes=await fs.readFile(path),length=bytes.readUInt32LE(12),json=JSON.parse(bytes.subarray(20,20+length)),offset=28+length,size=bytes.readUInt32LE(20+length);
 json.buffers=[{byteLength:size,uri:'data:application/octet-stream;base64,'+bytes.subarray(offset,offset+size).toString('base64')}];delete json.images;delete json.textures;json.materials=[{}];
 const scene=(await new GLTFLoader().parseAsync(JSON.stringify(json),'')).scene;let mesh;scene.traverse(o=>{if(o.isSkinnedMesh)mesh=o;});const rawWeights=mesh.geometry.attributes.skinWeight.clone(),rawIndices=mesh.geometry.attributes.skinIndex.clone();const rig=new CharacterRig(scene);return {rig,mesh,rawWeights,rawIndices};
}
const old=await load('dist/assets/characters/ice.glb'),fixed=await load('dist/assets/characters/ice-rigged.glb');
const point=(mesh,i)=>mesh.localToWorld(mesh.getVertexPosition(i,new T.Vector3()));
assert.deepEqual(Array.from(old.mesh.geometry.attributes.position.array),Array.from(fixed.mesh.geometry.attributes.position.array));
assert.deepEqual(Array.from(old.mesh.geometry.attributes.uv.array),Array.from(fixed.mesh.geometry.attributes.uv.array));
assert.deepEqual(Array.from(old.mesh.geometry.index.array),Array.from(fixed.mesh.geometry.index.array));
const weights=fixed.mesh.geometry.attributes.skinWeight,indices=fixed.mesh.geometry.attributes.skinIndex,oldWeights=old.mesh.geometry.attributes.skinWeight,oldIndices=old.mesh.geometry.attributes.skinIndex;
const checked=[];let head=0,scarf=0;
for(let i=0;i<weights.count;i++){
 assert.ok(point(old.mesh,i).distanceTo(point(fixed.mesh,i))<1e-5,'rest shape must not change');
 const changed=[0,1,2,3].some(k=>fixed.rawWeights.getComponent(i,k)!==old.rawWeights.getComponent(i,k)||fixed.rawIndices.getComponent(i,k)!==old.rawIndices.getComponent(i,k));
 if(!changed)continue;
 const bone=fixed.mesh.skeleton.bones[indices.getX(i)];assert.ok(bone===fixed.rig.bones.Head||bone===fixed.rig.bones.Neck,'only head/scarf weights changed');
 assert.equal(weights.getX(i),1);assert.equal(weights.getY(i)+weights.getZ(i)+weights.getW(i),0);
 const part=bone===fixed.rig.bones.Head?'Head':'Neck';if(part==='Head')head++;else scarf++;
 checked.push({i,part,rest:point(fixed.mesh,i)});
}
assert.ok(head>6000&&scarf>1500);
for(const lean of [0,.12,-.12]){
 const pose=structuredClone(fixed.rig.restPose);pose.Neck[0]+=lean;pose.Head[0]+=lean*1.5;
 for(const side of ['Left','Right']){pose[side+'ForeArm'][1]-=.3;pose[side+'Hand'][1]-=.55;pose[side+'Hand'][2]+=.3;}
 fixed.rig.apply(pose);
 for(const {i,part,rest} of checked){const expected=rest.clone().add(new T.Vector3(lean*(part==='Head'?1.5:1),0,0));assert.ok(point(fixed.mesh,i).distanceTo(expected)<1e-5,'head/scarf keeps its shape while arms and neck move');}
}
console.log(`PASS: unchanged rest mesh/UVs, ${head} head and ${scarf} scarf weights isolated, left/right leaning and arm movement do not distort either part`);
