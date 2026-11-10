export const BAG_POINTS=['BagCenter','BagDirection'];
export const BAG_LABELS={BagCenter:'가방 아래점',BagDirection:'가방 위점'};
// Keep the saved center/direction format so existing bag poses retain their angle.
export function bagHandles(pose){
 if(!pose.BagCenter||!pose.BagDirection)return {};
 const axis=pose.BagDirection.map((v,i)=>v-pose.BagCenter[i]);
 return Object.fromEntries(BAG_POINTS.map((n,index)=>[n,pose.BagCenter.map((v,i)=>v+axis[i]*(index===0?-.5:.5))]));
}
export function moveBag(pose,joint,target){
 const p=structuredClone(pose),handles=bagHandles(pose);
 const other=joint==='BagCenter'?'BagDirection':'BagCenter';
 const oldAxis=handles[other].map((v,i)=>v-handles[joint][i]);
 const length=Math.hypot(...oldAxis);
 if(length<1e-8)return p;
 // The grabbed endpoint follows the pointer. Move the free endpoint only as
 // far as needed to keep the rigid handle spacing, using its previous position.
 let axis=handles[other].map((v,i)=>v-target[i]),distance=Math.hypot(...axis);
 if(distance<1e-8){axis=oldAxis;distance=length;}
 handles[joint]=[...target];handles[other]=target.map((v,i)=>v+axis[i]*length/distance);
 p.BagCenter=handles.BagCenter.map((v,i)=>(v+handles.BagDirection[i])/2);
 p.BagDirection=p.BagCenter.map((v,i)=>v+handles.BagDirection[i]-handles.BagCenter[i]);
 return p;
}
