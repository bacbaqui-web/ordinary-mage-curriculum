export const BAG_POINTS=['BagCenter','BagDirection'];
export const BAG_LABELS={BagCenter:'가방 아래점',BagDirection:'가방 위점'};
// Keep the saved center/direction format so existing bag poses retain their angle.
export function bagHandles(pose){
 if(!pose.BagCenter||!pose.BagDirection)return {};
 const axis=pose.BagDirection.map((v,i)=>v-pose.BagCenter[i]);
 return Object.fromEntries(BAG_POINTS.map((n,index)=>[n,pose.BagCenter.map((v,i)=>v+axis[i]*(index===0?-.5:.5))]));
}
export function moveBag(pose,joint,target){
 const p=structuredClone(pose),start=bagHandles(pose)[joint];
 const delta=target.map((v,i)=>v-start[i]);
 for(const name of BAG_POINTS)p[name]=p[name].map((v,i)=>v+delta[i]);
 return p;
}
