import * as T from './three.module.js';
import {GLTFLoader} from './vendor/GLTFLoader.js';
import {JOINTS} from './pose-data.mjs';
import {PassiveFoot,ANKLE_CLEARANCE} from './passive-foot.mjs';
import {BONES} from './pose-constraints.mjs';
const V=a=>new T.Vector3(...a);
const world=o=>o.getWorldPosition(new T.Vector3());
const qworld=o=>o.getWorldQuaternion(new T.Quaternion());
const normalizeName=n=>n.replace(/^mixamorig[:_]?/i,'').replace(/[^a-z0-9]/gi,'').toLowerCase();
// All coordinates exposed to the editor are in the normalized model's world space.
export class CharacterRig{
 static async load(url,accessories=[]){
  const loader=new GLTFLoader(),rig=new CharacterRig((await loader.loadAsync(url)).scene);
  try{for(const config of accessories)rig.addAccessory((await loader.loadAsync(config.model)).scene,config);return rig;}
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

 constructor(root){
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
  this.restPose=this.positions();
  this.feet={LeftFoot:new PassiveFoot(),RightFoot:new PassiveFoot()};
  this.rest=new Map(this.all.map(b=>[b,{position:b.position.clone(),quaternion:b.quaternion.clone(),world:qworld(b)}]));
  this.directions=new Map();
  const links=[['Hips','Spine'],['Spine','Head'],['LeftArm','LeftForeArm'],['LeftForeArm','LeftHand'],['RightArm','RightForeArm'],['RightForeArm','RightHand'],['LeftUpLeg','LeftLeg'],['LeftLeg','LeftFoot'],['RightUpLeg','RightLeg'],['RightLeg','RightFoot']];
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
 apply(pose,dt=0){
  for(const b of this.all){const r=this.rest.get(b);b.position.copy(r.position);b.quaternion.copy(r.quaternion);}
  this.group.updateMatrixWorld(true);
  for(const name of this.ordered){
   const bone=this.bones[name],r=this.rest.get(bone),link=this.directions.get(name);
   if(link){
    const target=V(pose[link.child]).sub(V(pose[name]));
    if(target.lengthSq()>1e-10){const q=new T.Quaternion().setFromUnitVectors(link.dir,target.normalize()).multiply(r.world);bone.quaternion.copy(qworld(bone.parent).invert().multiply(q)).normalize();}
   }
   if(this.feet[name]){
    // Foot rotation is a world-space ankle hinge, not inherited shin rotation.
    // Match the old contact solver to this model's actual ankle-to-sole height.
    const ankle=[...pose[name]];ankle[1]+=ANKLE_CLEARANCE-this.restPose[name][1];
    const angle=dt>0?this.feet[name].update(ankle,dt).angle:0;
    const desired=new T.Quaternion().setFromAxisAngle(new T.Vector3(1,0,0),-angle).multiply(r.world);
    bone.quaternion.copy(qworld(bone.parent).invert().multiply(desired)).normalize();
   }
   // Editor coordinates keep handles and visible skeleton in the same place.
   bone.parent.updateWorldMatrix(true,false);bone.position.copy(bone.parent.worldToLocal(V(pose[name])));
   bone.updateWorldMatrix(false,true);
  }
  this.group.updateMatrixWorld(true);this.updateStraps();
 }
 dispose(){this.group.traverse(o=>{o.geometry?.dispose();for(const m of [o.material].flat().filter(Boolean)){for(const val of Object.values(m))if(val?.isTexture)val.dispose();m.dispose();}});this.group.removeFromParent();}
}
// Seed a character with the common motions, preserving each edge's own length.
export function fitProjectToRig(project,rest,sourceRest){
 const result=structuredClone(project),hipDelta=V(rest.Hips).sub(V(sourceRest.Hips));
 for(const a of result.actions)for(const k of a.keys){const old=structuredClone(k.pose);if((rest.LeftArm[0]-rest.RightArm[0])*(sourceRest.LeftArm[0]-sourceRest.RightArm[0])<0)for(const n of JOINTS)old[n][0]*=-1;const next={Hips:V(old.Hips).add(hipDelta).toArray()};
  for(const [parent,child] of BONES){const len=V(rest[child]).distanceTo(V(rest[parent]));let dir=V(old[child]).sub(V(old[parent]));if(dir.lengthSq()<1e-10)dir=V(rest[child]).sub(V(rest[parent]));next[child]=V(next[parent]).add(dir.normalize().multiplyScalar(len)).toArray();}
  const minFoot=Math.min(next.LeftFoot[1],next.RightFoot[1]);if(minFoot<.10)for(const n of JOINTS)next[n][1]+=.10-minFoot;
  k.pose=next;
 }
 result.rigVersion=2;return result;
}
