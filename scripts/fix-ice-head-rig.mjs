import fs from 'node:fs/promises';
import * as T from '../dist/three.module.js';
import {GLTFLoader} from '../dist/vendor/GLTFLoader.js';
import {CharacterRig} from '../dist/character-rig.mjs';
const source=new URL('../dist/assets/characters/ice.glb',import.meta.url),target=new URL('../dist/assets/characters/ice-rigged.glb',import.meta.url);
const bytes=await fs.readFile(source),jsonLength=bytes.readUInt32LE(12),json=JSON.parse(bytes.subarray(20,20+jsonLength)),binStart=28+jsonLength,binLength=bytes.readUInt32LE(20+jsonLength);
const parse=structuredClone(json);parse.buffers=[{byteLength:binLength,uri:'data:application/octet-stream;base64,'+bytes.subarray(binStart,binStart+binLength).toString('base64')}];delete parse.images;delete parse.textures;parse.materials=[{}];
globalThis.ProgressEvent ||= class {constructor(type,values){Object.assign(this,values);}};
const rig=new CharacterRig((await new GLTFLoader().parseAsync(JSON.stringify(parse),'')).scene);
let mesh;rig.root.traverse(o=>{if(o.isSkinnedMesh){if(mesh)throw Error('Expected a single source mesh');mesh=o;}});
const count=mesh.geometry.attributes.position.count,parent=Array.from({length:count},(_,i)=>i),points=[];
const find=i=>{while(parent[i]!==i){parent[i]=parent[parent[i]];i=parent[i];}return i;};const join=(a,b)=>parent[find(a)]=find(b);
const welded=new Map();for(let i=0;i<count;i++){const p=mesh.localToWorld(mesh.getVertexPosition(i,new T.Vector3()));points.push(p);const key=p.toArray().map(n=>n.toFixed(5)).join(',');if(welded.has(key))join(i,welded.get(key));else welded.set(key,i);}
const indices=mesh.geometry.index.array;for(let i=0;i<indices.length;i+=3){join(indices[i],indices[i+1]);join(indices[i],indices[i+2]);}
const groups=new Map();for(let i=0;i<count;i++){const root=find(i);if(!groups.has(root))groups.set(root,[]);groups.get(root).push(i);}
const primitive=json.meshes[0].primitives[0];
function writeAttribute(accessorIndex,index,values){const a=json.accessors[accessorIndex],v=json.bufferViews[a.bufferView],size={5121:1,5123:2,5126:4}[a.componentType];if(!size)throw Error('Unsupported skin attribute');const offset=binStart+(v.byteOffset||0)+(a.byteOffset||0)+index*(v.byteStride||size*4);values.forEach((n,k)=>{if(a.componentType===5126)bytes.writeFloatLE(n,offset+k*size);else if(size===2)bytes.writeUInt16LE(n,offset+k*size);else bytes.writeUInt8(n,offset+k*size);});}
let headVertices=0,scarfVertices=0;
for(const vertices of groups.values()){
 const box=new T.Box3().setFromPoints(vertices.map(i=>points[i]));
 if(box.min.y<1.30||Math.max(Math.abs(box.min.x),Math.abs(box.max.x))>.36)continue;
 const scarf=box.max.y<1.62&&box.min.z>-.25,bone=rig.bones[scarf?'Neck':'Head'],boneIndex=mesh.skeleton.bones.indexOf(bone);
 for(const index of vertices){writeAttribute(primitive.attributes.JOINTS_0,index,[boneIndex,0,0,0]);writeAttribute(primitive.attributes.WEIGHTS_0,index,[1,0,0,0]);}
 if(scarf)scarfVertices+=vertices.length;else headVertices+=vertices.length;
}
// Fail closed if the source model changes instead of silently classifying a new mesh.
if(headVertices!==7394||scarfVertices!==1788)throw Error(`Unexpected component counts: head=${headVertices}, scarf=${scarfVertices}`);
await fs.writeFile(target,bytes);console.log(`Wrote ice-rigged.glb: ${headVertices} head/hair/hat vertices, ${scarfVertices} scarf vertices. Original preserved.`);
