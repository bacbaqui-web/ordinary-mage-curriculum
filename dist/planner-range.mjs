import {iceSpec,hasIceRecipe} from './ice-spec.mjs?v=shift-trajectory-1';
import {plannerSpell} from './planner-spell.mjs?v=mist-ring-1';
import {ICE_BASIC} from './ice-basic.mjs?v=mist-ring-1';
import {fireSpec,hasFireRecipe} from './fire-spec.mjs?v=bolt17';
import {compileSpell,spellReach} from './live-spells.mjs?v=integer-damage-1';
// Distances follow the runtime's delivery rule, not the decorative particles.
export function plannerRange(seq,options={}){
 const spell=plannerSpell(seq,options),scale=spell.rangeScale||1;
 if(spell.iceVariant==='beam')return {value:5.5,kind:'직선 분사 거리'};
 if(spell.iceHand)return {value:ICE_BASIC[spell.iceHand].range*scale,kind:spell.iceHand==='left'?'투사체 이동 거리':'분사 거리'};
 if(hasIceRecipe(seq)){const s=iceSpec(seq,spell.power);return {value:s.range,kind:['i','w'].includes(s.op)?'투사체 이동 거리':['q','p','s'].includes(s.op)?'공격 범위 반경':s.op==='h'?'돌진 거리':'설치·낙하 중심까지의 조준 거리'};}
 if(hasFireRecipe(seq)){
  const s=fireSpec(seq,spell.power),op=s.op;
  if(op==='h')return {value:s.dashDistance,kind:'돌진 거리'};
  if(op==='w')return {value:s.range,kind:'투사체 이동 거리'};
  if(s.steam&&['q','i','d','p'].includes(op)||!s.steam&&!s.lightning&&op==='i')return {value:3,kind:'안개 중심까지의 거리'};
  if(s.lightning?['s','t'].includes(op):s.steam?['e','s'].includes(op):['q','d','p','e','s'].includes(op))return {value:s.radius*scale,kind:'공격 범위 반경'};
  return {value:Math.min(s.range,6*scale),kind:'설치·낙하 중심까지의 조준 거리'};
 }
 let n=compileSpell(seq,spell.power),range=spellReach(seq)*scale,radius=(1.2+seq.length*.25)*scale;
 while(['q','i','d'].includes(n.op)){if(n.op==='q'){radius*=1.6;range*=1.2;}if(n.op==='i')radius*=.6;n=n.inner;}
 if(n.op==='s')return {value:radius*1.6,kind:'공격 범위 반경'};
 if(n.op==='base')return {value:radius,kind:'공격 범위 반경'};
 if(n.op==='w'){if(n.inner?.op==='e')return {value:7,kind:'장벽 이동 거리'};if(n.inner?.op==='t')return {value:3.8*(3+n.inner.depth),kind:'장판 이동 거리'};return {value:range,kind:'투사체 이동 거리'};}
 if(['e','t'].includes(n.op)&&n.inner?.op==='w')return {value:range,kind:'투사체 이동 거리'};
 return {value:Math.min(range,6*scale),kind:'설치·낙하 중심까지의 조준 거리'};
}
