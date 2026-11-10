import {resolveSpell} from './live-charge-spells.mjs?v=shift-trajectory-1';
import {ICE_BASIC} from './ice-basic.mjs?v=ring-origin-2';
import {describe} from './combo-design.mjs?v=shift-trajectory-1';
export const basicKey=(seq,hand='left',charged=false)=>`${seq}:${hand}:${charged?'charged':'tap'}`;
export function plannerSpell(sequence,{hand='left',charged=false}={}){
 if(sequence==='ii'&&hand==='right')return {sequence,power:1.76,name:'집중 얼음안개',color:describe(sequence).color,iceVariant:'beam'};
 if(sequence.length>1)return {sequence,power:1+(sequence.length-1)*.48+.28,name:describe(sequence).name,color:describe(sequence).color};
 const supports=['q','w','e','i'].filter(k=>k!==sequence);
 const spell=resolveSpell({parts:['q'],completedRings:charged?1:0},{q:sequence,w:supports[0],e:supports[1]});
 spell.name=describe(sequence).name;spell.color=describe(sequence).color;
 if(sequence==='i'){spell.iceHand=hand;spell.name=ICE_BASIC[hand].name;spell.cost=ICE_BASIC[hand].cost;}
 return spell;
}
