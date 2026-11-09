import {validateProject,samplePose} from './pose-data.mjs?v=neck-ankle-1';
import {motionStorageKey,characterProfile} from './character-profiles.mjs?v=lower-cuff-1';
import {migrateAnklePivot} from './ankle-pivot.mjs?v=lower-cuff-1';
let storage=motionStorageKey('default'),ankleLift=0;
export function useMotionCharacter(id){storage=motionStorageKey(id);ankleLift=characterProfile(id).ankleLift||0;refresh();}
let project=null;
function refresh(){try{const raw=globalThis.localStorage?.getItem(storage);project=raw?validateProject(JSON.parse(raw)):null;if(project)migrateAnklePivot(project,ankleLift);}catch{project=null;}}
refresh();
globalThis.addEventListener?.('storage',e=>{if(e.key===storage||e.key===null)refresh();});
globalThis.addEventListener?.('focus',refresh);
export function savedMotion(name){return project?.actions.reduce((chosen,a)=>{if((a.binding||a.name)!==name)return chosen;return !chosen||(a.updatedAt||0)>=(chosen.updatedAt||0)?a:chosen;},null);}
export function savedPose(name,time,{loop=false,hold=false}={}){const a=savedMotion(name);if(!a)return null;let frame=time*a.fps;if(hold)frame=Math.min(frame,1);else if(loop)frame%=a.frames;return samplePose(a,Math.min(a.frames-1,frame));}
