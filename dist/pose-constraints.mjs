import {withNeck} from './pose-data.mjs?v=neck-ankle-1';
import {Vector3} from './three.module.js';
export const BONES=[['Hips','Spine'],['Spine','Neck'],['Neck','Head'],['Spine','LeftArm'],['Spine','RightArm'],['LeftArm','LeftForeArm'],['LeftForeArm','LeftHand'],['RightArm','RightForeArm'],['RightForeArm','RightHand'],['Hips','LeftUpLeg'],['Hips','RightUpLeg'],['LeftUpLeg','LeftLeg'],['LeftLeg','LeftFoot'],['RightUpLeg','RightLeg'],['RightLeg','RightFoot']];
const v=a=>new Vector3(...a);
function shiftChildren(p,n,delta){for(const [a,b] of BONES)if(a===n){p[b]=v(p[b]).add(delta).toArray();shiftChildren(p,b,delta);}}
function solveJoint(base,joint,target,preferredBend=null,footClearance=.10){
 let p=structuredClone(base);const end=v(target),old=v(base[joint]);
 if(joint==='Hips'){
  const d=end.clone().sub(old);p[joint]=end.toArray();shiftChildren(p,joint,d);
  // The pelvis carries the body. Ground contact consumes downward travel
  // through leg bending instead of stopping the entire hierarchy.
  for(const side of ['Left','Right']){
   const foot=side+'Foot';
   if(p[foot][1]<footClearance){
    const target=[p[foot][0],footClearance,p[foot][2]];
    p=solveJoint(p,foot,target,new Vector3(0,0,1),footClearance);
   }
  }
  return p;
 }
 const chain={LeftHand:['LeftArm','LeftForeArm'],RightHand:['RightArm','RightForeArm'],LeftFoot:['LeftUpLeg','LeftLeg'],RightFoot:['RightUpLeg','RightLeg']}[joint];
 if(chain){
  const [root,mid]=chain,a=v(base[root]),b=v(base[mid]),l1=a.distanceTo(b),l2=b.distanceTo(old),axis=end.clone().sub(a);
  if(axis.lengthSq()<1e-12)axis.copy(old).sub(a);if(axis.lengthSq()<1e-12)axis.set(0,-1,0);
  const d=Math.max(Math.abs(l1-l2)+1e-8,Math.min(l1+l2-1e-8,end.distanceTo(a)));axis.normalize();
  const hint=preferredBend?.clone()||b.clone().sub(a),bend=hint.addScaledVector(axis,-hint.dot(axis));
  if(bend.lengthSq()<1e-10){bend.set(0,0,1).addScaledVector(axis,-axis.z);if(bend.lengthSq()<1e-10)bend.set(1,0,0).addScaledVector(axis,-axis.x);}
  const x=(l1*l1-l2*l2+d*d)/(2*d),h=Math.sqrt(Math.max(0,l1*l1-x*x));
  p[mid]=a.clone().addScaledVector(axis,x).addScaledVector(bend.normalize(),h).toArray();p[joint]=a.clone().addScaledVector(axis,d).toArray();return p;
 }
 const parent=BONES.find(([,b])=>b===joint)?.[0];if(!parent)return p;
 const anchor=v(base[parent]),dir=end.sub(anchor);if(dir.lengthSq()<1e-12)dir.copy(old).sub(anchor);
 const next=anchor.add(dir.normalize().multiplyScalar(old.distanceTo(v(base[parent]))));p[joint]=next.toArray();shiftChildren(p,joint,next.sub(old));return p;
}

// Stop at the floor along the drag path without stretching any bones.
export function moveJoint(base,joint,target,{footClearance=.10}={}){
 base=withNeck(base);
 const clearance=n=>n==='Head'?.215:n.includes('Foot')?footClearance:0;
 const valid=p=>Object.entries(p).every(([n,a])=>a[1]>=Math.min(clearance(n),base[n][1])-1e-9);
 // Slide ankle targets along the floor instead of rejecting the entire diagonal drag.
 if(joint.endsWith('Foot'))target=[target[0],Math.max(target[1],Math.min(footClearance,base[joint][1])),target[2]];
 const result=solveJoint(base,joint,target,null,footClearance);if(valid(result))return result;
 let low=0,high=1,best=structuredClone(base);
 for(let i=0;i<36;i++){const t=(low+high)/2,p=solveJoint(base,joint,base[joint].map((a,k)=>a+(target[k]-a)*t),null,footClearance);if(valid(p)){best=p;low=t;}else high=t;}
 return best;
}
