import {raisedAnkle} from './ankle-pivot.mjs';
import {GarmentCollision} from './garment-collision.mjs';
import * as T from './three.module.js';
import {GLTFLoader} from './vendor/GLTFLoader.js';
import {JOINTS,withNeck} from './pose-data.mjs?v=neck-ankle-1';
import {ModelFoot} from './model-foot.mjs';
import {BONES} from './pose-constraints.mjs?v=neck-ankle-1';
const V=a=>new T.Vector3(...a);
const world=o=>o.getWorldPosition(new T.Vector3());
const qworld=o=>o.getWorldQuaternion(new T.Quaternion());
const normalizeName=n=>n.replace(/^mixamorig[:_]?/i,'').replace(/[^a-z0-9]/gi,'').toLowerCase();
// All coordinates exposed to the editor are in the normalized model's world space.
export class CharacterRig{
 static async load(url,accessories=[],garment=null,ankleLift=0){
  const loader=new GLTFLoader(),rig=new CharacterRig((await loader.loadAsync(url)).scene,{ankleLift});
  try{if(garment)rig.garment=new GarmentCollision(rig,garment);for(const config of accessories)rig.addAccessory((await loader.loadAsync(config.model)).scene,config);return rig;}
  catch(error){rig.dispose();throw error;}
 }
 addAccessory(root,{id,joint='Hips',width=.6,offset=[0,0,0],rotation=[0,0,0],strap=null}){
  // Normalize the separate prop before attaching it; character proportions stay unchanged.
  const bounds=new T.Box3().setFromObject(root,true),size=bounds.getSize(new T.Vector3()),center=bounds.getCenter(new T.Vector3());
  const scale=width/Math.max(size.x,.001),pivot=new T.Group(),model=new T.Group();
  root.position.sub(center);model.add(root);model.scale.setScalar(scale);model.rotation.set(...rotation);
  model.position.set(...offset);pivot.add(model);pivot.name=id;
  this.group.updateMatrixWorld(true);pivot.position.copy(world(this.bones[joint]));
  // Start in normalized world axes, then retain the attachment in the bone's local frame.
  pivot.updateMatrixWorld(true);
  this.bones[joint].attach(pivot);this.accessories??=new Map();this.accessories.set(id,pivot);
  if(strap){
   const mesh=new T.Mesh(new T.BufferGeometry(),new T.MeshStandardMaterial({color:strap.color,roughness:1}));
   pivot.add(mesh);pivot.userData.strap={mesh,joint:strap.joint,offset,halfDepth:width*.37,top:offset[1]+size.y*scale*.5};
   this.updateStraps();
  }
 }

 constructor(root,{ankleLift=0}={}){
  this.group=new T.Group();this.group.add(root);this.root=root;this.all=[];const named={};
  root.traverse(o=>{if(o.isBone){this.all.push(o);named[normalizeName(o.name)]=o;}if(o.isMesh)o.frustumCulled=false;});
  this.bones=Object.fromEntries(JOINTS.map(n=>[n,named[n==='Spine'?'spine2':n.toLowerCase()]||named[n.toLowerCase()]]));
  const missing=JOINTS.filter(n=>!this.bones[n]);if(missing.length)throw Error('모델의 관절을 찾지 못했습니다: '+missing.join(', '));
  this.group.updateMatrixWorld(true);
  // Align the rig's lateral and vertical axes, including exporter root transforms.
  const x=world(this.bones.RightArm).sub(world(this.bones.LeftArm)).normalize();
  const y=world(this.bones.Head).sub(world(this.bones.Hips)).normalize();
  const z=new T.Vector3().crossVectors(x,y).normalize();y.crossVectors(z,x).normalize();
  this.group.quaternion.setFromRotationMatrix(new T.Matrix4().makeBasis(x,y,z)).invert();
  // The editor's +Z camera must see the face. Toe direction disambiguates forward.
  this.group.updateMatrixWorld(true);
  const toe=named.lefttoebase;
  if(toe){const forward=world(toe).sub(world(this.bones.LeftFoot));if(forward.z<0)this.group.quaternion.premultiply(new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),Math.PI));}
  this.group.updateMatrixWorld(true);
  const bounds=new T.Box3().setFromObject(this.group,true),size=bounds.getSize(new T.Vector3());
  this.group.scale.setScalar(2.15/size.y);this.group.updateMatrixWorld(true);
  const floor=new T.Box3().setFromObject(this.group,true);const hip=world(this.bones.Hips);
  this.group.position.set(-hip.x,-floor.min.y,-hip.z);this.group.updateMatrixWorld(true);
  // Pick the visible palm center from vertices weighted to the hand/fingers.
  this.handCenters={};
  for(const name of ['LeftHand','RightHand']){
   const hand=this.bones[name],descendants=new Set();hand.traverse(b=>{if(b.isBone)descendants.add(b);});
   const sum=new T.Vector3();let count=0;
   root.traverse(mesh=>{
    if(!mesh.isSkinnedMesh)return;
    const weights=mesh.geometry.attributes.skinWeight,indices=mesh.geometry.attributes.skinIndex;
    for(let i=0;i<weights.count;i++){
     let weight=0;for(let k=0;k<4;k++)if(descendants.has(mesh.skeleton.bones[indices.getComponent(i,k)]))weight+=weights.getComponent(i,k);
     if(weight<.65)continue;
     sum.add(mesh.localToWorld(mesh.getVertexPosition(i,new T.Vector3())));count++;
    }
   });
   if(count)this.handCenters[name]=hand.worldToLocal(sum.divideScalar(count));
  }
  // Generated boot weights blend into the shin. Make each shoe pivot as a single
  // piece at its ankle, with a short blend at the cuff to keep the leg seam smooth.
  root.traverse(mesh=>{
   if(!mesh.isSkinnedMesh)return;
   const weights=mesh.geometry.attributes.skinWeight,indices=mesh.geometry.attributes.skinIndex;
   for(let i=0;i<weights.count;i++){
    const point=mesh.localToWorld(mesh.getVertexPosition(i,new T.Vector3()));
    const name=point.x>=0?'LeftFoot':'RightFoot',ankle=world(this.bones[name]);
    const blend=T.MathUtils.clamp((ankle.y+.07-point.y)/.05,0,1);if(blend===0)continue;
    const footIndex=mesh.skeleton.bones.indexOf(this.bones[name]);
    // Only touch vertices already weighted to this leg, never props or other limbs.
    let legWeight=0;for(let k=0;k<4;k++){const b=mesh.skeleton.bones[indices.getComponent(i,k)];if(b===this.bones[name]||b===this.bones[name.replace('Foot','Leg')]||b?.parent===this.bones[name])legWeight+=weights.getComponent(i,k);}
    if(legWeight<.9)continue;
    const combined=new Map([[footIndex,blend]]);
    for(let k=0;k<4;k++){const index=indices.getComponent(i,k);combined.set(index,(combined.get(index)||0)+weights.getComponent(i,k)*(1-blend));}
    const slots=[...combined].sort((a,b)=>b[1]-a[1]).slice(0,4),sum=slots.reduce((n,a)=>n+a[1],0);
    for(let k=0;k<4;k++){indices.setComponent(i,k,slots[k]?.[0]||0);weights.setComponent(i,k,(slots[k]?.[1]||0)/sum);}
   }
   weights.needsUpdate=true;indices.needsUpdate=true;
  });
  this.ankleLift=ankleLift;
  this.originalAnkles=Object.fromEntries(['LeftFoot','RightFoot'].map(n=>[n,world(this.bones[n]).toArray()]));
  if(ankleLift)for(const side of ['Left','Right']){
   const bone=this.bones[side+'Foot'],before=bone.matrixWorld.clone();
   const children=bone.children.map(child=>[child,child.matrixWorld.clone()]);
   const next=raisedAnkle(world(bone).toArray(),world(this.bones[side+'Leg']).toArray(),ankleLift);
   bone.position.copy(bone.parent.worldToLocal(V(next)));bone.updateWorldMatrix(false,true);
   for(const [child,matrix] of children){
    const local=bone.matrixWorld.clone().invert().multiply(matrix);local.decompose(child.position,child.quaternion,child.scale);
   }
   bone.updateWorldMatrix(false,true);
   // Preserve B * inverseBind at rest: relocating the pivot must not move the shoe.
   const correction=bone.matrixWorld.clone().invert().multiply(before),seen=new Set();
   root.traverse(mesh=>{if(!mesh.isSkinnedMesh||seen.has(mesh.skeleton))return;seen.add(mesh.skeleton);
    const index=mesh.skeleton.bones.indexOf(bone);if(index>=0)mesh.skeleton.boneInverses[index].premultiply(correction);
   });
  }
  this.group.updateMatrixWorld(true);
  this.restPose=this.positions();
  this.feet={};
  for(const name of ['LeftFoot','RightFoot']){
   const points=[],ankle=world(this.bones[name]);
   root.traverse(mesh=>{
    if(!mesh.isSkinnedMesh)return;
    const {skinWeight:weights,skinIndex:indices}=mesh.geometry.attributes;
    for(let i=0;i<weights.count;i++){
     let weight=0;for(let k=0;k<4;k++)if(mesh.skeleton.bones[indices.getComponent(i,k)]===this.bones[name])weight+=weights.getComponent(i,k);
     if(weight>.99)points.push(mesh.localToWorld(mesh.getVertexPosition(i,new T.Vector3())).sub(ankle).toArray());
    }
   });
   this.feet[name]=new ModelFoot(points);
  }
  this.rest=new Map(this.all.map(b=>[b,{position:b.position.clone(),quaternion:b.quaternion.clone(),world:qworld(b)}]));
  this.directions=new Map();
  const links=[['Hips','Spine'],['Spine','Neck'],['Neck','Head'],['LeftArm','LeftForeArm'],['LeftForeArm','LeftHand'],['RightArm','RightForeArm'],['RightForeArm','RightHand'],['LeftUpLeg','LeftLeg'],['LeftLeg','LeftFoot'],['RightUpLeg','RightLeg'],['RightLeg','RightFoot']];
  for(const [a,b] of links)this.directions.set(a,{child:b,dir:V(this.restPose[b]).sub(V(this.restPose[a])).normalize()});
  this.ordered=JOINTS.slice().sort((a,b)=>this.depth(this.bones[a])-this.depth(this.bones[b]));
 }
 updateStraps(){
  for(const pivot of this.accessories?.values()||[]){
   const strap=pivot.userData.strap;if(!strap)continue;
   const shoulder=world(this.bones[strap.joint]),chest=world(this.bones.Spine);
   const points=[
    new T.Vector3(strap.offset[0],strap.top,strap.halfDepth),
    pivot.worldToLocal(new T.Vector3(chest.x,chest.y,chest.z+.23)),
    pivot.worldToLocal(shoulder.clone().add(new T.Vector3(.035,.07,.16))),
    pivot.worldToLocal(shoulder.clone().add(new T.Vector3(.035,.09,0))),
    pivot.worldToLocal(shoulder.clone().add(new T.Vector3(.035,.07,-.16))),
    pivot.worldToLocal(new T.Vector3(chest.x,chest.y,chest.z-.22)),
    new T.Vector3(strap.offset[0],strap.top,-strap.halfDepth)
   ];
   // Build in normalized units: the attachment has inverse bone scale from attach().
   const signature=points.flatMap(p=>p.toArray()).map(n=>n.toFixed(5)).join(',');
   if(signature===strap.signature)continue;strap.signature=signature;
   const curve=new T.CatmullRomCurve3(points);strap.mesh.geometry.dispose();
   strap.mesh.geometry=new T.TubeGeometry(curve,32,.018,4,false);
  }
 }
 depth(b){let n=0;while(b.parent){n++;b=b.parent;}return n;}
 positions(){this.group.updateMatrixWorld(true);return Object.fromEntries(JOINTS.map(n=>[n,world(this.bones[n]).toArray()]));}
 controlPose(pose){
  const controls={...withNeck(pose)};
  for(const name of ['LeftFoot','RightFoot'])controls[name]=world(this.bones[name]).toArray();
  for(const [name,center] of Object.entries(this.handCenters))controls[name]=this.bones[name].localToWorld(center.clone()).toArray();
  return controls;
 }
 apply(pose,dt=0){
  pose=withNeck(pose);
  for(const b of this.all){const r=this.rest.get(b);b.position.copy(r.position);b.quaternion.copy(r.quaternion);}
  this.group.updateMatrixWorld(true);
  for(const name of this.ordered){
   const bone=this.bones[name],r=this.rest.get(bone),link=this.directions.get(name);
   if(link){
    const target=V(pose[link.child]).sub(V(pose[name]));
    if(target.lengthSq()>1e-10){const q=new T.Quaternion().setFromUnitVectors(link.dir,target.normalize()).multiply(r.world);bone.quaternion.copy(qworld(bone.parent).invert().multiply(q)).normalize();}
   }
   // The bulky scarf follows Neck translation, with an upright frame like the head.
   if(name==='Head'||name==='Neck')bone.quaternion.copy(qworld(bone.parent).invert().multiply(r.world)).normalize();
   if(this.feet[name]){
    // Foot rotation is a world-space ankle hinge, not inherited shin rotation.
    // Use the actual shoe outline and center below the raised cuff.
    const angle=dt>0?this.feet[name].update(pose[name],dt).angle:0;
    const desired=new T.Quaternion().setFromAxisAngle(new T.Vector3(1,0,0),-angle).multiply(r.world);
    bone.quaternion.copy(qworld(bone.parent).invert().multiply(desired)).normalize();
   }
   // Editor coordinates keep handles and visible skeleton in the same place.
   bone.parent.updateWorldMatrix(true,false);bone.position.copy(bone.parent.worldToLocal(V(pose[name])));
   bone.updateWorldMatrix(false,true);
  }
  this.group.updateMatrixWorld(true);this.garment?.apply();this.updateStraps();
 }
 dispose(){this.group.traverse(o=>{o.geometry?.dispose();for(const m of [o.material].flat().filter(Boolean)){for(const val of Object.values(m))if(val?.isTexture)val.dispose();m.dispose();}});this.group.removeFromParent();}
}
// Seed a character with the common motions, preserving each edge's own length.
export function fitProjectToRig(project,rest,sourceRest){
 const result=structuredClone(project),hipDelta=V(rest.Hips).sub(V(sourceRest.Hips));
 for(const a of result.actions)for(const k of a.keys){const old=structuredClone(withNeck(k.pose));if((rest.LeftArm[0]-rest.RightArm[0])*(sourceRest.LeftArm[0]-sourceRest.RightArm[0])<0)for(const n of JOINTS)old[n][0]*=-1;const next={Hips:V(old.Hips).add(hipDelta).toArray()};
  for(const [parent,child] of BONES){const len=V(rest[child]).distanceTo(V(rest[parent]));let dir=V(old[child]).sub(V(old[parent]));if(dir.lengthSq()<1e-10)dir=V(rest[child]).sub(V(rest[parent]));next[child]=V(next[parent]).add(dir.normalize().multiplyScalar(len)).toArray();}
  const minFoot=Math.min(next.LeftFoot[1],next.RightFoot[1]);if(minFoot<.10)for(const n of JOINTS)next[n][1]+=.10-minFoot;
  k.pose=next;
 }
 result.rigVersion=3;return result;
}
