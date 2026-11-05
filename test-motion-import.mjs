import assert from 'node:assert/strict';
import * as T from './dist/three.module.js';
import {demoMotion,readMotion,MotionPuppet} from './dist/motion-puppet.mjs';
const source=demoMotion(),bones=[];let hierarchy='HIERARCHY\n';
function emit(b,root=false){bones.push(b);let s=`${root?'ROOT':'JOINT'} ${b.name}\n{\nOFFSET ${b.position.toArray().join(' ')}\nCHANNELS 6 Xposition Yposition Zposition Zrotation Xrotation Yrotation\n`;for(const c of b.children)s+=emit(c);if(!b.children.length)s+='End Site\n{\nOFFSET 0 -0.1 0\n}\n';return s+'}\n';}
hierarchy+=emit(source.root.children[0],true);const zero=bones.flatMap(()=>[0,0,0,0,0,0]),pose=[...zero];pose[bones.findIndex(b=>b.name==='LeftUpLeg')*6+4]=40;
const text=hierarchy+'MOTION\nFrames: 2\nFrame Time: 0.5\n'+zero.join(' ')+'\n'+pose.join(' ')+'\n';
const imported=await readMotion({name:'test.bvh',text:async()=>text});const p=new MotionPuppet(new T.Scene(),imported);p.update(.4);assert.ok(Math.abs(p.bones.LeftUpLeg.rotation.x)>.3);
await assert.rejects(()=>readMotion({name:'test.fbx'}),/GLB/);
assert.throws(()=>p.setMotion({root:new T.Group(),clips:[]}),/관절/);
// A minimal self-contained glTF animation checks the same import path used by GLB.
globalThis.ProgressEvent ||= class {constructor(type,values){Object.assign(this,values);}};
const data=new Float32Array([0,1,0,0,0,1,Math.sin(.3),0,0,Math.cos(.3)]),nodes=bones.map(b=>({name:b.name,translation:b.position.toArray(),children:b.children.map(c=>bones.indexOf(c))}));
const json={asset:{version:'2.0'},scene:0,scenes:[{nodes:[0]}],nodes,buffers:[{byteLength:data.byteLength,uri:'data:application/octet-stream;base64,'+Buffer.from(data.buffer).toString('base64')}],bufferViews:[{buffer:0,byteOffset:0,byteLength:8},{buffer:0,byteOffset:8,byteLength:32}],accessors:[{bufferView:0,componentType:5126,count:2,type:'SCALAR',min:[0],max:[1]},{bufferView:1,componentType:5126,count:2,type:'VEC4'}],animations:[{name:'test',samplers:[{input:0,output:1}],channels:[{sampler:0,target:{node:bones.findIndex(b=>b.name==='LeftUpLeg'),path:'rotation'}}]}]};
const gltf=await readMotion({name:'test.gltf',text:async()=>JSON.stringify(json)});p.setMotion(gltf);p.update(.5);assert.ok(p.bones.LeftUpLeg.rotation.x>.1);
console.log('PASS: BVH and embedded glTF motion import, mapped animation, missing bones and unsupported format errors');
