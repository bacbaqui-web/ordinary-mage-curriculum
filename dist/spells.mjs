import {RUNES,DEFAULT_LOADOUT,mapSequence,spellName} from './loadout.mjs?v=growthfall1';
export const ELEMENTS=RUNES;
export const NAMES={q:'불꽃',w:'충격파',e:'순간 장막',qq:'집중 화염',qw:'화염탄',qe:'불꽃 구체',wq:'열풍',ww:'대충격파',we:'반발장',eq:'화염 방패',ew:'방패 돌진',ee:'이중 장막',qqq:'작열 분사',qqw:'폭열탄',qqe:'응축 화구',qwq:'폭열탄',qww:'관통 화염탄',qwe:'잔류 화구',qeq:'응축 화구',qew:'화염 수레',qee:'화염 감옥',wqq:'폭염 파동',wqw:'폭풍 추진',wqe:'작열 방패',wwq:'폭풍 추진',www:'대충격파',wwe:'공성 충격파',weq:'작열 방패',wew:'공성 충격파',wee:'반발 진지',eqq:'보복의 방패',eqw:'화염 방벽',eqe:'화염 성채',ewq:'화염 방벽',eww:'돌격 방패',ewe:'이동 방벽',eeq:'화염 성채',eew:'이동 방벽',eee:'다층 결계'};
export const RING_SECONDS=1.2;
export class Charge {
 constructor(){this.clear()}
 clear(){this.held=[];this.parts=[];this.progress=0;this.elapsed=0;this.active=false}
 down(key){if(!['q','w','e'].includes(key)||this.held.includes(key))return;this.held.push(key);if(!this.active){this.active=true;this.parts=[key];this.progress=0;this.elapsed=0}}
 up(key){if(!this.held.includes(key))return null;this.held=this.held.filter(k=>k!==key);if(this.held.length)return null;const result={parts:[...this.parts],progress:this.progress,tap:this.elapsed<.15};this.clear();return result}
 tick(dt){if(!this.active)return;this.elapsed+=dt;this.progress+=dt/RING_SECONDS;while(this.progress>=1&&this.parts.length<3){this.progress-=1;this.parts.push(this.held.at(-1));}this.progress=Math.min(this.progress,1)}
 next(){return this.held.at(-1)}
}
export function resolveSpell(result,loadout=DEFAULT_LOADOUT){
 const parts=result.tap?[result.parts[0]]:result.parts;const complete=parts.length>1&&result.progress<.99?parts.slice(0,-1):parts;
 const sequence=mapSequence(complete,loadout);const power=1+Math.max(0,complete.length-1)*.48+(result.tap?0:result.progress*.28);
 return {sequence,name:spellName(sequence,NAMES),power,cost:result.tap?4:7+complete.length*4+result.progress*2,parts:complete,keys:complete.join(''),tap:result.tap};
}
