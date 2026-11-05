import {RUNES as DEFINITIONS,describe} from './combo-design.mjs?v=fire1';
export const RUNES=Object.fromEntries(Object.entries(DEFINITIONS).map(([k,r])=>[k,{...r,role:'1륜',hint:r.body+' · '+r.action,desc:'대상: '+r.body+' / 동작: '+r.action}]));
export const KEYS=['q','w','e'],DEFAULT_LOADOUT={q:'q',w:'w',e:'e'};
export function validLoadout(v){return !!v&&KEYS.every(k=>Object.hasOwn(RUNES,v[k]))&&new Set(KEYS.map(k=>v[k])).size===3;}
export function assignRune(v,slot,rune){if(!KEYS.includes(slot)||!RUNES[rune]||!validLoadout(v))throw Error('잘못된 마법 배치');const next={...v},other=KEYS.find(k=>next[k]===rune);if(other)next[other]=next[slot];next[slot]=rune;return next;}
export function mapSequence(parts,loadout=DEFAULT_LOADOUT){if(!validLoadout(loadout)||!parts.every(k=>KEYS.includes(k)))throw Error('잘못된 주문');return parts.map(k=>loadout[k]).join('');}
export const spellName=seq=>describe(seq).name;
export const composition=()=>({});
