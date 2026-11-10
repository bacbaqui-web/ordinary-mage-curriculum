import * as T from './three.module.js';
export function readGLB(buffer){
 const d=new DataView(buffer);if(d.getUint32(0,true)!==0x46546c67||d.getUint32(4,true)!==2)throw Error('GLB 2.0 파일을 선택해 주세요.');
 let json,bin;for(let p=12;p<buffer.byteLength;){const n=d.getUint32(p,true),type=d.getUint32(p+4,true);if(type===0x4e4f534a)json=JSON.parse(new TextDecoder().decode(new Uint8Array(buffer,p+8,n)));if(type===0x004e4942)bin=new Uint8Array(buffer.slice(p+8,p+8+n));p+=8+n;}
 if(!json||!bin||!json.skins?.length)throw Error('뼈가 포함된 GLB가 아닙니다. 리깅된 모델을 선택해 주세요.');return {json,bin};
}
export function writeRigGLB(original,nodeMatrices,worldBefore,worldAfter){
 const json=structuredClone(original.json),bin=original.bin.slice(),view=new DataView(bin.buffer);
 for(const [i,m] of nodeMatrices){const node=json.nodes[i];delete node.translation;delete node.rotation;delete node.scale;node.matrix=m.toArray();}
 for(const skin of json.skins){const a=json.accessors[skin.inverseBindMatrices];if(!a||a.componentType!==5126||a.type!=='MAT4'||a.sparse)throw Error('이 파일의 뼈 저장 형식은 아직 지원하지 않습니다.');const b=json.bufferViews[a.bufferView];for(let j=0;j<skin.joints.length;j++){const id=skin.joints[j],offset=(b.byteOffset||0)+(a.byteOffset||0)+j*(b.byteStride||64),values=Array.from({length:16},(_,k)=>view.getFloat32(offset+k*4,true));const before=worldBefore.get(id),after=worldAfter.get(id);if(!before||!after)throw Error('관절 정보를 찾지 못했습니다. 파일을 다시 열어 주세요.');const inv=after.clone().invert().multiply(before).multiply(new T.Matrix4().fromArray(values));inv.elements.forEach((v,k)=>view.setFloat32(offset+k*4,v,true));}}
 // This export is an edited bind pose. Old animation tracks target the old bind pose.
 delete json.animations;const encoded=new TextEncoder().encode(JSON.stringify(json)),jl=Math.ceil(encoded.length/4)*4,bl=Math.ceil(bin.length/4)*4,out=new ArrayBuffer(28+jl+bl),dv=new DataView(out),u=new Uint8Array(out);dv.setUint32(0,0x46546c67,true);dv.setUint32(4,2,true);dv.setUint32(8,out.byteLength,true);dv.setUint32(12,jl,true);dv.setUint32(16,0x4e4f534a,true);u.fill(32,20,20+jl);u.set(encoded,20);dv.setUint32(20+jl,bl,true);dv.setUint32(24+jl,0x004e4942,true);u.set(bin,28+jl);return out;
}
