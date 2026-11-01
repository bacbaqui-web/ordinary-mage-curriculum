export const RUNES={
 q:{name:'화염',color:'#ff9c45',icon:'✦',role:'공격',hint:'태우기 · 폭발',desc:'불꽃을 짧게 뿜습니다. 조합에 열과 폭발을 더합니다.'},
 i:{name:'냉기',color:'#72dce8',icon:'❄',role:'감속',hint:'냉각 · 감속',desc:'냉기탄으로 적을 느리게 합니다. 조합에 감속을 더합니다.'},
 l:{name:'전격',color:'#f3d56b',icon:'ϟ',role:'속공',hint:'빠른 타격 · 방전',desc:'빠른 전격탄을 쏩니다. 조합에 추가 방전을 더합니다.'},
 w:{name:'밀기',color:'#b4e676',icon:'↗',role:'거리 조절',hint:'밀치기 · 추진',desc:'가까운 적을 밀칩니다. 조합에 추진력과 반발을 더합니다.'},
 g:{name:'당김',color:'#c49ff1',icon:'↙',role:'끌어오기',hint:'견인 · 집결',desc:'앞쪽 적을 끌어옵니다. 조합에 흡인 효과를 더합니다.'},
 e:{name:'장막',color:'#a8dcff',icon:'◇',role:'방어',hint:'막기 · 보호',desc:'짧게 방어합니다. 조합에 보호막과 지속 구역을 더합니다.'}
};
export const KEYS=['q','w','e'],DEFAULT_LOADOUT={q:'q',w:'w',e:'e'};
export function validLoadout(value){return !!value&&KEYS.every(k=>Object.hasOwn(RUNES,value[k]))&&new Set(KEYS.map(k=>value[k])).size===3}
export function assignRune(value,slot,rune){if(!KEYS.includes(slot)||!RUNES[rune]||!validLoadout(value))throw new Error('잘못된 마법 배치');const next={...value},other=KEYS.find(k=>next[k]===rune);if(other)next[other]=next[slot];next[slot]=rune;return next}
export function mapSequence(parts,loadout=DEFAULT_LOADOUT){if(!validLoadout(loadout)||!parts.every(k=>KEYS.includes(k)))throw new Error('잘못된 주문 입력');return parts.map(k=>loadout[k]).join('')}
const PAIRS={qi:'증기 폭발',ql:'뇌화탄',qg:'화염 소용돌이',iq:'열충격탄',ii:'급속 냉각',il:'서리 전류',iw:'냉기 파동',ig:'서리 소용돌이',ie:'서리 결계',lq:'과열 전격',li:'둔화 전격',ll:'연속 전격',lw:'관통 뇌창',lg:'집속 방전',le:'뇌전 구체',wi:'서리 충격파',wl:'전격 충격파',wg:'왕복 충격파',gq:'불꽃 견인',gi:'얼음 갈고리',gl:'전격 견인',gw:'끌어 던지기',gg:'흡인장',ge:'포획 고리',ei:'얼음 방패',el:'방전 방패',eg:'흡인 방패'};
const BASIC={q:'불꽃',i:'냉기탄',l:'전격탄',w:'충격파',g:'견인',e:'순간 장막'};
const MODS={q:'작열',i:'한파',l:'방전',w:'추진',g:'흡인',e:'결계'};
export function spellName(seq,legacy={}){if(legacy[seq])return legacy[seq];if(seq.length===1)return BASIC[seq];const base=PAIRS[seq.slice(0,2)]||legacy[seq.slice(0,2)]||RUNES[seq[0]].name;return seq.length===3?base+' · '+MODS[seq[2]]:base}
// A shared composition model makes every selectable sequence executable.
export function composition(seq,power=1){const first=seq[0],second=seq[1],count=k=>[...seq].filter(x=>x===k).length;return{
 shape:first==='e'?'shield':first==='g'||first==='w'?(second==='e'||second===first?'field':'cone'):second==='e'||second==='g'?'field':'projectile',
 color:RUNES[first].color,damage:(first==='i'?8:first==='g'?5:12)*power+(count('q')>0?3:0),
 slow:count('i')?Math.min(3,.9+count('i')*.6):0,
 force:count('g')?-Math.min(1.6,.6+count('g')*.35):count('w')?Math.min(1.8,.5+count('w')*.4):0,
 echo:count('l')&&seq.length>1?4*power:0,burn:count('q')&&seq.length>1?2:0,
 speed:first==='l'?19:count('w')?15:10,
 radius:first==='g'?3.6:first==='w'?3:2,
 duration:2.4+count('e')*.6,shield:Math.min(70,23*power),
 pierce:first==='l'&&count('w')>0,blast:count('q')>0&&seq.length>1?1.4:0
}}
