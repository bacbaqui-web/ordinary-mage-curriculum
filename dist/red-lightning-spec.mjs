export const RED_LIGHTNING_RECIPES={
 qlq:['갈래불벼락','붉은 낙뢰가 꽂힌 뒤 세 갈래 불길이 주변으로 뻗습니다. 중심과 갈래에 닿으면 화상을 입습니다.'],
 qli:['응축벼락','가늘고 밝은 낙뢰를 한곳에 응축합니다. 범위는 좁지만 순간 피해가 큽니다.'],
 qll:['연쇄불벼락','미리 표시한 세 지점에 붉은 낙뢰가 차례로 떨어집니다. 낙하 위치는 시전할 때 정해집니다.'],
 qld:['운석낙하','검은 돌과 붉은 용암 덩어리가 떨어집니다. 넓은 충격과 돌 파편, 갈라진 그을음과 불씨를 남깁니다.'],
 qlp:['독벼락','녹색 가지가 섞인 붉은 낙뢰가 떨어집니다. 맞은 몸에 초록 불씨가 붙고 화상과 중독이 남습니다.'],
 qle:['벼락장벽','주위에 붉은 낙뢰 기둥이 꽂혀 장벽을 이룹니다. 이동과 시야를 막고 닿은 적에게 화상을 줍니다.'],
 qlt:['낙뢰지대','붉은 균열이 생긴 영역을 만듭니다. 안의 적 발밑을 잠깐 표시한 뒤 작은 불벼락을 떨어뜨립니다.'],
 qlw:['벼락창','가늘고 빠른 붉은 번개 창을 앞으로 발사합니다. 적이나 벽에 닿으면 터집니다.'],
 qlg:['끌벼락','붉은 전류가 주변 적을 중심으로 짧게 끌어당긴 뒤 낙뢰가 떨어집니다. 낙하 전에 구르기로 피할 수 있습니다.'],
 qls:['벼락가르기','근거리를 갈라진 붉은 번개 칼날로 벱니다. 칼자국이 번쩍 나타났다 빠르게 사라집니다.'],
 qlh:['벼락주먹','붉은 전류를 두른 주먹으로 짧게 돌진합니다. 적중 순간 낙뢰가 꽂히고 적을 크게 밀어냅니다.']
};
export const isRedLightning=seq=>!!RED_LIGHTNING_RECIPES[seq];
export function redLightningSpec(seq,power=1){const op=seq[2];return{seq,op,power,lightning:true,scale:1,radius:({q:1.5,i:.65,l:1.2,d:2.3,p:1.5,e:2.2,t:3.5,w:.4,g:1.6,s:3,h:.7})[op],range:8,life:5,damage:({q:8,i:19,l:6,d:13,p:6,e:2,t:5,w:10,g:10,s:9,h:14})[op]*power,burn:op==='p'?3:1.5,burnDamage:(op==='p'?1.5:1)*power,greenFire:op==='p'?3:0,knockback:op==='h'?3.5:op==='d'?1.2:0,dashDistance:3.2,dashDuration:.4,dashSpeed:8,orbRadius:.4};}
export function redLightningPlacement(s,caster,dir,target){if(['e','s','w','h'].includes(s.op))return{x:caster.x,z:caster.z};const dx=target.x-caster.x,dz=target.z-caster.z,k=Math.min(1,s.range/(Math.hypot(dx,dz)||1));return{x:caster.x+dx*k,z:caster.z+dz*k};}
