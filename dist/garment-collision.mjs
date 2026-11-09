import * as T from './three.module.js';
const world=b=>b.getWorldPosition(new T.Vector3());
export function pushOutsideCapsule(point,a,b,radius){
 const axis=b.clone().sub(a),t=T.MathUtils.clamp(point.clone().sub(a).dot(axis)/Math.max(axis.lengthSq(),1e-9),0,1);
 const closest=a.clone().addScaledVector(axis,t),offset=point.clone().sub(closest),distance=offset.length();
 if(distance>=radius)return point;
 if(distance<1e-8)offset.set(0,0,1);else offset.divideScalar(distance);
 return closest.addScaledVector(offset,radius);
}
// A small collision envelope for the coat hem, not a full cloth simulation.
export class GarmentCollision{
 constructor(rig,{hemDepth=.30,thighRadius=.145,shinRadius=.12}={}){
  this.rig=rig;this.thighRadius=thighRadius;this.shinRadius=shinRadius;this.parts=[];
  const hip=rig.restPose.Hips[1];
  rig.root.traverse(mesh=>{
   if(!mesh.isSkinnedMesh)return;
   const position=mesh.geometry.attributes.position,weights=mesh.geometry.attributes.skinWeight,indices=mesh.geometry.attributes.skinIndex,vertices=[];
   for(let i=0;i<position.count;i++){
    const p=mesh.localToWorld(mesh.getVertexPosition(i,new T.Vector3()));
    if(p.y<hip-hemDepth||p.y>hip+.15)continue;
    let torso=0;for(let k=0;k<4;k++)if(/hips|spine/i.test(mesh.skeleton.bones[indices.getComponent(i,k)].name))torso+=weights.getComponent(i,k);
    if(torso<.45)continue;
    vertices.push({index:i,original:new T.Vector3().fromBufferAttribute(position,i),front:p.z>rig.restPose.Hips[2]+.04});
   }
   if(vertices.length)this.parts.push({mesh,vertices});
  });
 }
 apply(){
  const {rig}=this,legs=['Left','Right'].map(side=>[world(rig.bones[side+'UpLeg']),world(rig.bones[side+'Leg']),world(rig.bones[side+'Foot'])]);
  const signature=rig.all.flatMap(b=>b.matrixWorld.elements).map(n=>n.toFixed(5)).join(',');
  if(signature===this.signature)return;this.signature=signature;this.pushed=0;
  for(const {mesh,vertices} of this.parts){
   const position=mesh.geometry.attributes.position,weights=mesh.geometry.attributes.skinWeight,indices=mesh.geometry.attributes.skinIndex;
   const matrices=mesh.skeleton.bones.map((bone,i)=>new T.Matrix4().multiplyMatrices(bone.matrixWorld,mesh.skeleton.boneInverses[i]));
   for(const {index,original,front} of vertices){
    const blend=new T.Matrix4();blend.elements.fill(0);
    for(let k=0;k<4;k++){const w=weights.getComponent(index,k),m=matrices[indices.getComponent(index,k)];for(let j=0;j<16;j++)blend.elements[j]+=m.elements[j]*w;}
    const skin=mesh.matrixWorld.clone().multiply(mesh.bindMatrixInverse).multiply(blend).multiply(mesh.bindMatrix);
    const before=original.clone().applyMatrix4(skin);let after=before.clone();
    // A few projections resolve contact with both legs when they cross.
    for(let step=0;step<4;step++)for(const [hip,knee,ankle] of legs){after=pushOutsideCapsule(after,hip,knee,this.thighRadius);after=pushOutsideCapsule(after,knee,ankle,this.shinRadius);}
    // Keep the front panel in front of a raised knee. Pure nearest-surface
    // projection can otherwise send adjacent vertices to opposite sides of a leg.
    if(front)for(const [hip,knee] of legs)for(const [a,b,r] of [[hip,knee,this.thighRadius]]){
     for(let sample=0;sample<=10;sample++){
      const c=a.clone().lerp(b,sample/10),d2=(before.x-c.x)**2+(before.y-c.y)**2;
      if(d2<r*r)after.z=Math.max(after.z,c.z+Math.sqrt(r*r-d2)+.008);
     }
    }
    if(after.distanceToSquared(before)>1e-10)this.pushed++;
    const local=after.applyMatrix4(skin.invert());position.setXYZ(index,local.x,local.y,local.z);
   }
   position.needsUpdate=true;
  }
 }
}
