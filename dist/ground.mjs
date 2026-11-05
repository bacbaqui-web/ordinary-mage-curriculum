export function groundSpec(seq){
 if(!seq.includes('t'))return null;
 const count=k=>[...seq].filter(x=>x===k).length,n=count('t'),element=[...seq].find(k=>'qilwg'.includes(k))||'t';
 return {ground:true,kind:element,range:6,radius:1.6+(n-1)*.6,duration:4+(n-1)*2+count('e')*2,interval:.5,damage:seq.includes('q')?3:seq.includes('l')?5:seq.includes('i')?1:2,burn:seq.includes('q')?1:0,slow:seq.includes('i')?1:0,shock:seq.includes('l')?1:0,force:seq.includes('g')?-.35:seq.includes('w')?.35:0};
}
export function groundName(seq){const s=groundSpec(seq);return ({q:'화염',i:'빙결',l:'전격',w:'밀기',g:'당김',t:'마법'})[s.kind]+' 장판'+(seq.length>1?' · '+seq.length+'원':'');}
export function groundDescription(seq){const s=groundSpec(seq);if(!s)return null;return `조준한 바닥에 반경 ${s.radius.toFixed(1)}m의 장판을 설치합니다. 설치 거리 ${s.range}m · ${s.duration}초 유지. 이동과 투사체를 막지 않고, 영역 안의 적에게 ${s.interval}초마다 ${s.damage}의 기본 피해를 줍니다.${s.burn?' 화상을 남깁니다.':''}${s.slow?' 적을 느리게 합니다.':''}${s.shock?' 전격 효과가 반복됩니다.':''}${s.force<0?' 중심으로 끌어당깁니다.':s.force>0?' 중심에서 밀어냅니다.':''} 시전자마다 장판 하나를 유지하며 다시 설치하면 교체합니다. 장판이 들어간 조합은 바닥 설치 방식이 됩니다.`;}
export function groundPoint(caster,target,range,blocked=()=>false){const dx=target.x-caster.x,dz=target.z-caster.z,d=Math.hypot(dx,dz),length=Math.min(range,d);let point={x:caster.x,z:caster.z};if(d<1e-8)return point;for(let t=.1;t<length+.1;t+=.1){const step=Math.min(t,length),x=caster.x+dx/d*step,z=caster.z+dz/d*step;if(blocked(x,z,.05))break;point={x,z};}return point;}
export function inGround(point,target,radius){return Math.hypot(target.x-point.x,target.z-point.z)<=radius;}
// No tick at or after expiry. Catch up elapsed pulses without extending lifetime.
export function advanceGround(field,dt,hit){const elapsed=Math.min(dt,Math.max(0,field.life));field.life=Math.max(0,field.life-dt);field.tick-=elapsed;while(field.tick<-1e-9){hit();field.tick+=field.spec.interval;}return field.life>0;}
