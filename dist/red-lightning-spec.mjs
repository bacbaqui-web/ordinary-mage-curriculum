export const RED_LIGHTNING_RECIPES={
 qlq:['불벼락 웅덩이','낙뢰의 순간 피해는 작지만 착탄 지점에 넓은 화염 지역이 4.5초간 남습니다. 안에 머무르면 계속 피해를 받고, 벗어난 뒤 화상은 짧게 끝납니다.'],
 qli:['서리벼락','붉은 낙뢰와 함께 차가운 서리가 터집니다. 맞은 적에게 푸른 서리가 붙어 2.5초간 이동 속도를 낮춥니다.'],
 qll:['연쇄불벼락','미리 표시한 세 지점에 붉은 낙뢰가 차례로 떨어집니다. 낙하 위치는 시전할 때 정해집니다.'],
 qld:['운석낙하','낙하 영역을 0.9초간 표시한 뒤 운석이 떨어집니다. 맞은 적을 충격 중심에서 멀리 밀어내고 파편과 균열을 남깁니다.'],
 qlp:['독벼락','순간 피해는 낮지만 초록 불씨가 몸에 6초간 붙어 화상과 중독 피해를 줍니다.'],
 qle:['벼락장벽','조준한 곳을 잠깐 표시한 뒤 붉은 낙뢰 장벽이 내려와 안의 적을 가둡니다. 장벽은 이동과 시야를 막으며 부술 수 있습니다.'],
 qlt:['낙뢰지대','시전할 때 자신의 주변에 낙뢰지대를 만듭니다. 안의 적 발밑에 예고 원을 표시한 뒤 낙뢰가 떨어집니다.'],
 qlw:['벼락창','가늘고 빠른 붉은 번개 창을 앞으로 발사합니다. 적이나 벽에 닿으면 터집니다.'],
 qlg:['끌벼락','붉은 전류가 주변 적을 중심으로 짧게 끌어당긴 뒤 낙뢰가 떨어집니다. 낙하 전에 구르기로 피할 수 있습니다.'],
 qls:['벼락가르기','근거리를 갈라진 붉은 번개 칼날로 벱니다. 칼자국이 번쩍 나타났다 빠르게 사라집니다.'],
 qlh:['벼락주먹','붉은 벼락처럼 순식간에 전방을 치고 들어가 주먹을 꽂습니다. 맞은 적을 밀어내며, 벽은 통과하지 않습니다.']
};
export const isRedLightning=seq=>!!RED_LIGHTNING_RECIPES[seq];
export function redLightningSpec(seq,power=1){const op=seq[2];return{seq,op,power,lightning:true,scale:1,radius:({q:1.5,i:1.5,l:1.2,d:2.3,p:1.5,e:2.2,t:3.5,w:.4,g:1.6,s:3,h:.7})[op],range:8,life:5,damage:({q:4,i:8,l:6,d:12,p:4,e:2,t:5,w:10,g:10,s:9,h:14})[op]*power,burn:op==='p'?6:op==='q'?1:op==='i'?0:1.5,burnDamage:(op==='p'?.65:op==='q'?.35:1)*power,greenFire:op==='p'?6:0,slow:op==='i'?2.5:0,frost:op==='i'?2.5:0,poisonDuration:6,poisonDamage:.65*power,fieldRadius:3.5,fieldDuration:4.5,fieldTick:.5,fieldDamage:.75*power,knockback:op==='h'?3.5:op==='d'?2.5:0,dashDistance:3.2,dashDuration:.06,dashSpeed:3.2/.06,orbRadius:.4};}
export function redLightningPlacement(s,caster,dir,target){if(['t','s','w','h'].includes(s.op))return{x:caster.x,z:caster.z};const dx=target.x-caster.x,dz=target.z-caster.z,k=Math.min(1,s.range/(Math.hypot(dx,dz)||1));return{x:caster.x+dx*k,z:caster.z+dz*k};}
