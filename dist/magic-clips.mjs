import {samplePose} from './pose-data.mjs';
export const magicClipName=(stage,mode)=>`${Math.max(1,Math.min(3,stage||1))}륜 ${mode==='hold'?'충전':'발사'}`;
export const MAGIC_CLIPS=[1,2,3].flatMap(n=>[magicClipName(n,'hold'),magicClipName(n,'release')]);
export function ensureMagicClips(project){
 const source=project.actions.filter(a=>(a.binding||a.name)==='마법 시전').sort((a,b)=>(a.updatedAt||0)-(b.updatedAt||0)).at(-1);
 if(!source)return false;let changed=false;
 for(const name of MAGIC_CLIPS){
  if(project.actions.some(a=>(a.binding||a.name)===name))continue;
  const action=structuredClone(source);action.name=action.binding=name;delete action.updatedAt;
  if(name.endsWith('충전'))action.keys=[{frame:0,ease:'smooth',pose:samplePose(source,0)},{frame:Math.min(1,action.frames-1),ease:'hold',pose:samplePose(source,1)}];
  project.actions.push(action);changed=true;
 }
 return changed;
}
