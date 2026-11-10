import * as T from './three.module.js';
import {GLTFLoader} from './vendor/GLTFLoader.js';
import {mergeGeometries} from './vendor/BufferGeometryUtils.js';

// Source models retain their original UVs and Kenney palette textures.
export async function loadTownAssets(root){
 const base=new URL('./assets/kenney/',import.meta.url);
 const response=await fetch(new URL('manifest.json',base));
 if(!response.ok)throw new Error('맵 에셋 목록을 불러오지 못했습니다. 새로고침해 주세요.');
 const manifest=await response.json(),loader=new GLTFLoader(),models=new Map(),batches=new Map();
 await Promise.all(manifest.filter(p=>['nature-kit','car-kit','city-kit-roads'].includes(p.pack)).flatMap(p=>p.models.filter(n=>!n.startsWith('electricity-pole')).map(async name=>{
  const key=p.pack+'/'+name,gltf=await loader.loadAsync(new URL(key+'.glb',base).href);
  gltf.scene.updateMatrixWorld(true);models.set(key,gltf.scene);
 })));
 let instances=0;
 function place(key,x,z,{w,d,h,scale=1,rotation=0,y=.1}={}){
  const model=models.get(key).clone(true),bounds=new T.Box3().setFromObject(model),size=bounds.getSize(new T.Vector3()),center=bounds.getCenter(new T.Vector3());
  const holder=new T.Group();holder.add(model);model.position.set(-center.x,-bounds.min.y,-center.z);
  holder.scale.set(w?w/size.x:scale,h?h/size.y:scale,d?d/size.z:scale);holder.rotation.y=rotation;holder.position.set(x,y,z);holder.updateMatrixWorld(true);
  model.traverse(obj=>{if(!obj.isMesh)return;const mats=Array.isArray(obj.material)?obj.material:[obj.material];
   // Kenney GLBs use a single material per mesh; retain groups if future assets differ.
   if(mats.length!==1)throw new Error('지원하지 않는 복합 재질: '+key);
   let mat=mats[0];
   if(mat.name==='leafsGreen')mat.color.setHex(0x73964e);if(mat.name==='woodBark')mat.color.setHex(0x8c6b4a);
   mat.roughness=.9;mat.metalness=0;
   const geo=obj.geometry.clone();geo.applyMatrix4(obj.matrixWorld);geo.setIndex(geo.index);
   const non=geo.index?geo.toNonIndexed():geo;for(const attr of Object.keys(non.attributes))if(!['position','normal','uv'].includes(attr))non.deleteAttribute(attr);
   if(!non.attributes.uv)non.setAttribute('uv',new T.BufferAttribute(new Float32Array(non.attributes.position.count*2),2));
   if(!batches.has(mat))batches.set(mat,[]);batches.get(mat).push(non);if(non!==geo)geo.dispose();
  });instances++;
 }
 function finish(){for(const [material,geos]of batches){const geometry=mergeGeometries(geos,false);if(!geometry)throw new Error('맵 모델을 합치지 못했습니다.');const mesh=new T.Mesh(geometry,material);mesh.castShadow=true;mesh.receiveShadow=true;mesh.name='Kenney · '+material.name;root.add(mesh);for(const g of geos)g.dispose();}root.userData.kenney={models:models.size,instances,batches:batches.size};}
 return {place,finish};
}
