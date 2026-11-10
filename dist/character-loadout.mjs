import {CHARACTERS} from './characters.mjs';
import {KEYS,RUNES,validLoadout,assignRune} from './live-loadout.mjs?v=filled-tells-1';
export {CHARACTERS};
export const characterFor=loadout=>CHARACTERS.find(c=>c.rune===loadout.q)||CHARACTERS[0];
// Preserve the two support choices where possible when the main rune changes.
export function chooseCharacter(loadout,id){
 const character=CHARACTERS.find(c=>c.id===id);
 if(!character||!validLoadout(loadout))throw Error('캐릭터나 마법 배치를 확인하세요.');
 const available=[loadout.w,loadout.e,loadout.q,...Object.keys(RUNES)].filter((r,i,a)=>r!==character.rune&&a.indexOf(r)===i);
 return {q:character.rune,w:available[0],e:available[1]};
}
export function chooseSupport(loadout,slot,rune){
 if(!KEYS.slice(1).includes(slot)||rune===loadout.q)return {...loadout};
 return assignRune(loadout,slot,rune);
}
