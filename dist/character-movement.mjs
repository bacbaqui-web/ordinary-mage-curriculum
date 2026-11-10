import {motionStorageKey} from './character-profiles.mjs';
export const DEFAULT_MOVEMENT={moveSpeed:1,headSpeed:0,chestSpeed:0,pelvisSpeed:0};
export function normalizeMovement(value={}){
 const result={...DEFAULT_MOVEMENT};
 for(const key of Object.keys(result)){const n=value?.[key];if(typeof n==='number'&&Number.isFinite(n))result[key]=Math.max(key==='moveSpeed'?.5:0,Math.min(key==='moveSpeed'?2:1440,n));}
 return result;
}
const cache=new Map();
export function readMovement(id){
 const key=motionStorageKey(id);let raw=null;try{raw=globalThis.localStorage?.getItem(key)||globalThis.localStorage?.getItem(key+':movement')||null;}catch{}
 if(cache.get(key)?.raw===raw)return cache.get(key).value;
 let value;try{value=normalizeMovement(JSON.parse(raw)?.movementSettings);}catch{value=normalizeMovement();}
 cache.set(key,{raw,value});return value;
}
export function writeMovement(id,value){
 const key=motionStorageKey(id),raw=globalThis.localStorage?.getItem(key),project=raw?JSON.parse(raw):{};
 project.movementSettings=normalizeMovement(value);globalThis.localStorage?.setItem(raw?key:key+':movement',JSON.stringify(project));return project.movementSettings;
}
