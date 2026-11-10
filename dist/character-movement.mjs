import {motionStorageKey} from './character-profiles.mjs';
export const DEFAULT_MOVEMENT={moveSpeed:1,headSpeed:0,chestSpeed:0,pelvisSpeed:0};
export function normalizeMovement(value={}){
 const result={...DEFAULT_MOVEMENT};
 for(const key of Object.keys(result)){const n=value?.[key];if(typeof n==='number'&&Number.isFinite(n))result[key]=Math.max(key==='moveSpeed'?.5:0,Math.min(key==='moveSpeed'?2:1440,n));}
 return result;
}
const cache=new Map();
export function readMovement(id){
 const key=motionStorageKey(id);let raw=null,standalone=null;try{raw=globalThis.localStorage?.getItem(key)||null;standalone=globalThis.localStorage?.getItem(key+':movement')||null;}catch{}
 if(cache.get(key)?.raw===raw&&cache.get(key)?.standalone===standalone)return cache.get(key).value;
 const parse=value=>{try{return JSON.parse(value)?.movementSettings;}catch{return undefined;}};
 const value=normalizeMovement(parse(raw)??parse(standalone));
 cache.set(key,{raw,standalone,value});return value;
}
export function writeMovement(id,value){
 const key=motionStorageKey(id),raw=globalThis.localStorage?.getItem(key),project=raw?JSON.parse(raw):{};
 project.movementSettings=normalizeMovement(value);globalThis.localStorage?.setItem(raw?key:key+':movement',JSON.stringify(project));return project.movementSettings;
}
