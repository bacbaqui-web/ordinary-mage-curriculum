import * as T from './three.module.js';
import {GLTFLoader} from './vendor/GLTFLoader.js';
import {JOINTS} from './pose-data.mjs';
import {BONES} from './pose-constraints.mjs';
const V=a=>new T.Vector3(...a);
const world=o=>o.getWorldPosition(new T.Vector3());
const qworld=o=>o.getWorldQuaternion(new T.Quaternion());
const normalizeName=n=>n.replace(/^mixamorig[:_]?/i,'').replace(/[^a-z0-9]/gi,'').toLowerCase();
// All coordinates exposed to the editor are in the normalized model's world space.
export class CharacterRig{
 static async load(url){return new CharacterRig((await new GLTFLoader().loadAsync(url)).scene);}
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
  this.rest=new Map(this.all.map(b=>[b,{position:b.position.clone(),quaternion:b.quaternion.clone(),world:qworld(b)}]));
  this.directions=new Map();
  const links=[['Hips','Spine'],['Spine','Head'],['LeftArm','LeftForeArm'],['LeftForeArm','LeftHand'],['RightArm','RightForeArm'],['RightForeArm','RightHand'],['LeftUpLeg','LeftLeg'],['LeftLeg','LeftFoot'],['RightUpLeg','RightLeg'],['RightLeg','RightFoot']];
  for(const [a,b] of links)this.directions.set(a,{child:b,dir:V(this.restPose[b]).sub(V(this.restPose[a])).normalize()});
  this.ordered=JOINTS.slice().sort((a,b)=>this.depth(this.bones[a])-this.depth(this.bones[b]));
 }
 depth(b){let n=0;while(b.parent){n++;b=b.parent;}return n;}
 positions(){this.group.updateMatrixWorld(true);return Object.fromEntries(JOINTS.map(n=>[n,world(this.bones[n]).toArray()]));}
 apply(pose){
  for(const b of this.all){const r=this.rest.get(b);b.position.copy(r.position);b.quaternion.copy(r.quaternion);}
  this.group.updateMatrixWorld(true);
  for(const name of this.ordered){
   const bone=this.bones[name],r=this.rest.get(bone),link=this.directions.get(name);
   if(link){
    const target=V(pose[link.child]).sub(V(pose[name]));
    if(target.lengthSq()>1e-10){const q=new T.Quaternion().setFromUnitVectors(link.dir,target.normalize()).multiply(r.world);bone.quaternion.copy(qworld(bone.parent).invert().multiply(q)).normalize();}
   }
   // Editor coordinates keep handles and visible skeleton in the same place.
   bone.parent.updateWorldMatrix(true,false);bone.position.copy(bone.parent.worldToLocal(V(pose[name])));
   bone.updateWorldMatrix(false,true);
  }
  this.group.updateMatrixWorld(true);
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
