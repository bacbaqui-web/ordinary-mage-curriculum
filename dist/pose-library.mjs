import {BASIC_ATTACKS,FIRST_RING_CLIPS} from './motion-catalog.mjs?v=run-walk-1';
import {MAGIC_CLIPS} from './magic-clips.mjs?v=smooth-motion-1';
const builtins=new Set(['대기','기본 걷기','베기','주먹 타격','방어','마법 시전',...MAGIC_CLIPS,...BASIC_ATTACKS,...FIRST_RING_CLIPS]);
export const motionKey=a=>a.binding||(builtins.has(a.name)?a.name:null);
export function uniqueMotions(actions){
 const result=[],slots=new Map();
 for(const action of actions){const key=motionKey(action);if(!key){result.push(action);continue;}
  if(!slots.has(key)){slots.set(key,result.length);result.push(action);}
  else{const i=slots.get(key);if((action.updatedAt||0)>=(result[i].updatedAt||0))result[i]=action;}
 }
 return result;
}
export function mergeMotions(existing,incoming){
 const result=uniqueMotions(existing),additions=uniqueMotions(incoming);
 for(const action of additions){const key=motionKey(action),i=key?result.findIndex(a=>motionKey(a)===key):-1;if(i>=0)result[i]=action;else result.push(action);}
 return result;
}
