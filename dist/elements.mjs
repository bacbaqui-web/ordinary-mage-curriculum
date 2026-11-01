// First rune determines delivery; completed rings extend its reach.
export function elementalSpec(seq,power=1){
 const kind=seq[0];if(!'qil'.includes(kind))return null;
 const n=seq.length,mods=seq.slice(1);
 return {kind,rings:n,range:2.5+(n-1)*1.6,halfAngle:.52,
 damage:(kind==='q'?4:kind==='i'?6:10)*power,
 burn:kind==='q'?2:0,slow:kind==='i'?1.5+(n-1)*.5:0,
 force:mods.includes('g')?-.9:mods.includes('w')?.9:0,
 shield:mods.includes('e')?12:0,echo:kind!=='l'&&mods.includes('l')?3:0,
 radius:.38+(n-1)*.25,height:2.5+n*.9};
}
export function inElementCone(origin,target,dir,spec){const x=target.x-origin.x,z=target.z-origin.z,d=Math.hypot(x,z);return d<=spec.range&&(d<.01||(x*dir.x+z*dir.z)/d>=Math.cos(spec.halfAngle));}
export function lightningPoint(origin,target,range,random=Math.random){if(Math.hypot(target.x-origin.x,target.z-origin.z)<=range)return {x:target.x,z:target.z,targeted:true};const angle=random()*Math.PI*2,r=Math.sqrt(random())*range;return{x:origin.x+Math.cos(angle)*r,z:origin.z+Math.sin(angle)*r,targeted:false};}
export function elementalDescription(seq){const s=elementalSpec(seq);if(!s)return null;let text=s.kind==='q'?`전방 ${s.range}m에 화염을 뿜습니다. 직접 피해는 낮고, 2초 동안 화상 피해를 줍니다. 화상 중에는 몸이 붉어집니다.`:s.kind==='i'?`전방 ${s.range}m에 얼음을 뿜습니다. ${s.slow}초 동안 이동 속도가 45% 줄고 몸이 푸르게 변합니다. 지속 피해는 없습니다.`:`${s.range}m 안의 적에게 벼락을 떨어뜨립니다. 적이 없으면 범위 안의 임의 지점에 떨어집니다. 원이 늘수록 벼락도 커집니다.`;
 if(s.force)text+=s.force<0?' 맞은 적을 끌어당깁니다.':' 맞은 적을 밀칩니다.';if(s.shield)text+=' 보호막을 얻습니다.';if(s.echo)text+=' 잠시 뒤 추가 피해를 줍니다.';return text;}

export function lightningHits(point,target,radius){return Math.hypot(target.x-point.x,target.z-point.z)<=radius;}
