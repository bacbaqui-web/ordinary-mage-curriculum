import {samplePose} from './pose-data.mjs?v=smooth-motion-1';
export const loopEndpoint=(action,frame)=>!!action.loop&&(frame===0||frame===action.frames-1);
export function syncLoop(action,editedFrame=0){
 if(!action.loop)return;
 const last=action.frames-1,source=editedFrame===last?last:0;
 const pose=samplePose(action,source);
 for(const frame of [0,last]){
  let key=action.keys.find(k=>k.frame===frame);
  if(!key){key={frame,ease:'smooth',pose:null};action.keys.push(key);}
  key.pose=structuredClone(pose);
 }
 action.keys.sort((a,b)=>a.frame-b.frame);
}
export function resizeLoop(action,frames){
 const oldLast=action.frames-1;
 if(action.keys.some(k=>k.frame>=frames&&!(action.loop&&k.frame===oldLast)))return false;
 if(action.loop)action.keys=action.keys.filter(k=>k.frame!==oldLast);
 action.frames=frames;syncLoop(action);return true;
}
