import {loopFrame} from './motion-timing.mjs';
import {ensureFirstRingClips,ensureLocomotion} from './motion-catalog.mjs?v=run-walk-1';
import {validateProject,samplePose} from './pose-data.mjs?v=bag-side-1';
import {motionStorageKey,characterProfile} from './character-profiles.mjs?v=heel-free-1';
import {migrateAnklePivot} from './ankle-pivot.mjs?v=heel-free-1';
let storage=motionStorageKey('default'),ankleLift=0,ankleBack=0;
export function useMotionCharacter(id){storage=motionStorageKey(id);ankleLift=characterProfile(id).ankleLift||0;ankleBack=characterProfile(id).ankleBack||0;refresh();}
let project=null;
function refresh(){try{const raw=globalThis.localStorage?.getItem(storage);project=raw?validateProject(JSON.parse(raw)):null;if(project){migrateAnklePivot(project,ankleLift,ankleBack);ensureFirstRingClips(project);ensureLocomotion(project);}}catch{project=null;}}
refresh();
globalThis.addEventListener?.('storage',e=>{if(e.key===storage||e.key===null)refresh();});
globalThis.addEventListener?.('focus',refresh);
export function savedMotion(name){return project?.actions.reduce((chosen,a)=>{if((a.binding||a.name)!==name)return chosen;return !chosen||(a.updatedAt||0)>=(chosen.updatedAt||0)?a:chosen;},null);}
export function savedPose(name,time,{loop=false,hold=false}={}){const a=savedMotion(name);if(!a)return null;let frame=time*a.fps;if(hold)frame=Math.min(frame,1);else if(loop)frame=loopFrame(a,frame);return samplePose(a,Math.min(a.frames-1,frame));}

// Game actors need separate character stores; choosing one must not change another.
export function createMotionReader(id,{fallback=true}={}){
 const profile=characterProfile(id),key=motionStorageKey(profile.id),defaultKey=motionStorageKey('default');
 let lastRaw,lastFallback,current=null,legacy=null;
 const parse=raw=>{try{const p=raw?validateProject(JSON.parse(raw)):null;if(p){ensureFirstRingClips(p);ensureLocomotion(p);}return p;}catch{return null;}};
 function refreshActor(){
  try{
   const raw=globalThis.localStorage?.getItem(key)??null;
   if(raw!==lastRaw){lastRaw=raw;current=parse(raw);if(current)migrateAnklePivot(current,profile.ankleLift||0,profile.ankleBack||0);}
   const old=fallback&&key!==defaultKey?(globalThis.localStorage?.getItem(defaultKey)??null):null;
   if(old!==lastFallback){lastFallback=old;legacy=parse(old);}
  }catch{current=null;legacy=null;}
 }
 const find=(p,name)=>p?.actions.reduce((chosen,a)=>(a.binding||a.name)!==name?chosen:!chosen||(a.updatedAt||0)>=(chosen.updatedAt||0)?a:chosen,null);
 const motion=name=>{refreshActor();return find(current,name)||find(legacy,name)||null;};
 return {savedMotion:motion,savedPose(name,time,{loop=false,hold=false}={}){
  const a=motion(name);if(!a)return null;let frame=time*a.fps;
  if(hold)frame=Math.min(frame,1);else if(loop)frame=loopFrame(a,frame);
  return samplePose(a,Math.min(a.frames-1,frame));
 }};
}
