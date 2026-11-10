import {samplePose} from './pose-data.mjs?v=foot-lock-1';
export const magicClipName=(stage,mode)=>`${Math.max(1,Math.min(3,stage||1))}륜 ${mode==='hold'?'충전':'발사'}`;
export const MAGIC_CLIPS=[1,2,3].flatMap(n=>[magicClipName(n,'hold'),magicClipName(n,'release')]);
const displayName=name=>name.replace(/^3륜 (충전|발사)$/, '2륜 복합 $1');
export function ensureMagicClips(project){
 let changed=false;
 for(const action of project.actions){
  const name=displayName(action.name);
  if(name!==action.name){action.binding??=action.name;action.name=name;changed=true;}
 }
 const source=project.actions.filter(a=>(a.binding||a.name)==='마법 시전').sort((a,b)=>(a.updatedAt||0)-(b.updatedAt||0)).at(-1);
 if(!source)return changed;
 for(const name of MAGIC_CLIPS){
  if(project.actions.some(a=>(a.binding||a.name)===name))continue;
  const action=structuredClone(source);action.binding=name;action.name=displayName(name);delete action.updatedAt;
  if(name.endsWith('충전'))action.keys=[{frame:0,ease:'smooth',pose:samplePose(source,0)},{frame:Math.min(1,action.frames-1),ease:'hold',pose:samplePose(source,1)}];
  project.actions.push(action);changed=true;
 }
 return changed;
}
