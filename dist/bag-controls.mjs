export const BAG_POINTS=['BagCenter','BagDirection'];
export const BAG_LABELS={BagCenter:'가방 위치',BagDirection:'가방 방향'};
export function moveBag(pose,joint,target){
 const p=structuredClone(pose);
 if(joint==='BagCenter'){
  const delta=target.map((v,i)=>v-p.BagCenter[i]);
  p.BagCenter=[...target];p.BagDirection=p.BagDirection.map((v,i)=>v+delta[i]);
 }else{
  const d=target.map((v,i)=>v-p.BagCenter[i]),length=Math.hypot(...d);
  if(length>1e-6){const radius=Math.hypot(...p.BagDirection.map((v,i)=>v-p.BagCenter[i]));p.BagDirection=d.map((v,i)=>p.BagCenter[i]+v/length*radius);}
 }
 return p;
}
