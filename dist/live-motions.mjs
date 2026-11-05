import {validateProject,samplePose} from './pose-data.mjs';
const storage='ordinary-mage-pose-editor-v1';
let project=null;
function refresh(){try{const raw=globalThis.localStorage?.getItem(storage);project=raw?validateProject(JSON.parse(raw)):null;}catch{project=null;}}
refresh();
globalThis.addEventListener?.('storage',e=>{if(e.key===storage||e.key===null)refresh();});
globalThis.addEventListener?.('focus',refresh);
export function savedMotion(name){return project?.actions.reduce((chosen,a)=>{if((a.binding||a.name)!==name)return chosen;return !chosen||(a.updatedAt||0)>=(chosen.updatedAt||0)?a:chosen;},null);}
export function savedPose(name,time,{loop=false,hold=false}={}){const a=savedMotion(name);if(!a)return null;let frame=time*a.fps;if(hold)frame=Math.min(frame,1);else if(loop)frame%=a.frames;return samplePose(a,Math.min(a.frames-1,frame));}
