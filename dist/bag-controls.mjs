import {Vector3,Quaternion} from './three.module.js';
export const BAG_POINTS=['BagCenter','BagDirection'];
export const BAG_LABELS={BagCenter:'가방 점 1',BagDirection:'가방 점 2'};
export function bagSide(pose){
 const center=new Vector3(...pose.BagCenter),up=new Vector3(...pose.BagDirection).sub(center).normalize();
 return pose.BagSide?new Vector3(...pose.BagSide).sub(center):new Vector3(.4,0,0).applyQuaternion(new Quaternion().setFromUnitVectors(new Vector3(0,1,0),up));
}
export function bagHandles(pose){
 if(!pose.BagCenter||!pose.BagDirection)return {};
 const side=bagSide(pose),up=new Vector3(...pose.BagDirection).sub(new Vector3(...pose.BagCenter)).normalize();
 // Turn the handle line 90 degrees around the bag's vertical axis.
 const axis=side.clone().cross(up).normalize().multiplyScalar(side.length()).toArray();
 return Object.fromEntries(BAG_POINTS.map((n,index)=>[n,pose.BagCenter.map((v,i)=>v+axis[i]*(index===0?-.5:.5))]));
}
export function moveBag(pose,joint,target){
 const p=structuredClone(pose),handles=bagHandles(pose);
 const before=new Vector3(...handles.BagDirection).sub(new Vector3(...handles.BagCenter));
 handles[joint]=[...target];
 const after=new Vector3(...handles.BagDirection).sub(new Vector3(...handles.BagCenter));
 // Coincident endpoints have no orientation; keep the last valid pose.
 if(after.lengthSq()<1e-10||before.lengthSq()<1e-10)return p;
 const turn=new Quaternion().setFromUnitVectors(before.normalize(),after.clone().normalize());
 p.BagCenter=handles.BagCenter.map((v,i)=>(v+handles.BagDirection[i])/2);
 const center=new Vector3(...p.BagCenter);
 p.BagDirection=new Vector3(...pose.BagDirection).sub(new Vector3(...pose.BagCenter)).applyQuaternion(turn).add(center).toArray();
 p.BagSide=bagSide(pose).applyQuaternion(turn).normalize().multiplyScalar(after.length()).add(center).toArray();
 return p;
}
