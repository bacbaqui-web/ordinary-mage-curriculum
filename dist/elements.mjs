import {damageNumber} from './damage-number.mjs?v=integer-damage-1';
import {fallsFromAbove,overheadDelivery,launchesOrb,orbTuning} from './delivery.mjs?v=zones1';
// First rune determines delivery; completed rings extend its reach.
export function elementalSpec(seq,power=1){
 const kind=seq[0];if(!'qil'.includes(kind))return null;
 const n=seq.length,mods=seq.slice(1),orb=launchesOrb(seq)?orbTuning(seq):null;
 return {kind,rings:n,projectile:!!orb,variant:orb?.variant,speed:orb?.speed,blast:orb?.blast,burnDamage:orb?.burnDamage||2,falling:fallsFromAbove(seq),overhead:overheadDelivery(seq),range:orb?.range||2.5+(n-1)*1.6,halfAngle:.52,
 damage:(kind==='q'?4:kind==='i'?6:10)*power*(orb?.damageScale||1),
 burn:kind==='q'?(orb?.burn||2):0,slow:kind==='i'?1.5+(n-1)*.5:0,
 force:mods.includes('g')?-.9:!orb&&mods.includes('w')?.9:0,
 shield:mods.includes('e')?12:0,echo:0,
 radius:orb?.radius||.38+(n-1)*.25,height:2.5+n*.9};
}
export function inElementCone(origin,target,dir,spec){const x=target.x-origin.x,z=target.z-origin.z,d=Math.hypot(x,z);return d<=spec.range&&(d<.01||(x*dir.x+z*dir.z)/d>=Math.cos(spec.halfAngle));}
export function lightningPoint(origin,target,range,random=Math.random){if(Math.hypot(target.x-origin.x,target.z-origin.z)<=range)return {x:target.x,z:target.z,targeted:true};const angle=random()*Math.PI*2,r=Math.sqrt(random())*range;return{x:origin.x+Math.cos(angle)*r,z:origin.z+Math.sin(angle)*r,targeted:false};}
export function elementalDescription(seq){const s=elementalSpec(seq);if(!s)return null;let text=s.kind==='q'?`전방 ${s.range}m에 화염을 뿜습니다. 직접 피해는 낮고, 2초 동안 화상 피해를 줍니다. 화상 중에는 몸이 붉어집니다.`:s.kind==='i'?`전방 ${s.range}m에 얼음을 뿜습니다. ${s.slow}초 동안 이동 속도가 45% 줄고 몸이 푸르게 변합니다. 지속 피해는 없습니다.`:`${s.range}m 안의 적에게 벼락을 떨어뜨립니다. 적이 없으면 범위 안의 임의 지점에 떨어집니다. 원이 늘수록 벼락도 커집니다.`;
 if(s.projectile)text=`${s.variant==='large'?'크고 느린 ':s.variant==='fast'?'작고 빠른 ':''}${s.kind==='q'?'화염구':s.kind==='i'?'얼음구':'전기구'}를 조준 방향으로 발사합니다. 속도 ${s.speed}m/s · 사거리 ${s.range}m · 구체 지름 ${(s.radius*2).toFixed(2)}m. 적이나 벽에 닿거나 사거리에 도달하면 반경 ${s.blast.toFixed(2)}m에 폭발합니다.${s.burn?` ${s.burn}초 동안 0.5초마다 ${damageNumber(s.burnDamage)}의 화상 피해를 줍니다.`:''}${s.slow?` ${s.slow}초 동안 이동 속도를 45% 낮춥니다.`:''}`;
 if(s.falling)text=`${s.range}m 안의 대상 머리 위에서 ${s.kind==='q'?'주황색 화염':'푸른 얼음'}이 떨어집니다. 시전 때 정해진 위치에 0.28초 뒤 적중하며, 작은 원 밖으로 이동하거나 구르면 피할 수 있습니다.${s.burn?' 2초 동안 화상을 남깁니다.':` ${s.slow}초 동안 이동 속도를 45% 낮춥니다.`} 대상이 없으면 사거리 안 임의 지점에 떨어집니다.`;
 if(s.force)text+=s.force<0?' 맞은 적을 끌어당깁니다.':' 맞은 적을 밀칩니다.';if(s.shield)text+=' 보호막을 얻습니다.';if(s.echo)text+=' 잠시 뒤 추가 피해를 줍니다.';return text;}

export function lightningHits(point,target,radius){return Math.hypot(target.x-point.x,target.z-point.z)<=radius;}
