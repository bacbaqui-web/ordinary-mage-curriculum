export const STEAM_RECIPES={
 qiq:['열안개','연막을 넓게 퍼뜨립니다. 회색 안개에 옅은 붉은빛이 섞이고, 안에 머문 적에게 약한 화상을 남깁니다.'],
 qii:['서리안개','좁고 짙은 연막에 하얀 서리가 떠다닙니다. 안의 적을 크게 느리게 하고 바닥에 성에를 남깁니다.'],
 qil:['증기폭발','조준한 곳에 굵은 증기 기둥이 순간적으로 내리꽂힙니다. 충격과 함께 피해를 주고 연막이 폭발하듯 퍼집니다.'],
 qid:['분진구름','무거운 회색 가루가 섞인 연막을 만듭니다. 적을 느리게 하고 몸과 바닥에 분진을 남깁니다.'],
 qip:['독안개','녹색 독이 섞인 연막을 만듭니다. 안에 머물수록 중독 시간이 늘고, 벗어나도 잠시 독 피해가 이어집니다.'],
 qie:['증기장벽','주위에 짙은 증기 장벽을 세웁니다. 이동과 시야를 막으며, 깨진 벽에서 남은 증기가 흩어집니다.'],
 qit:['안개늪','바닥에 낮고 넓은 안개를 깝니다. 밟으면 느려지지만 캐릭터를 가리지는 않습니다.'],
 qiw:['연막탄','압축 안개를 발사합니다. 적이나 벽에 닿거나 최대 거리에 도달하면 터져 연막을 만듭니다.'],
 qig:['안개소용돌이','조준한 곳에 회색 회오리를 만듭니다. 적을 중심으로 끌어당기며 시야를 가립니다.'],
 qis:['안개가르기','근거리를 회백색 반달로 벱니다. 피해를 주고 칼이 지나간 곡선을 따라 짧게 연막을 남깁니다.'],
 qih:['증기돌격','압축 증기를 두른 주먹으로 돌진합니다. 적중한 적을 밀어내고 충돌 지점에 연막이 터집니다.']
};
export const isSteam=seq=>!!STEAM_RECIPES[seq];
export function steamSpec(seq,power=1){const op=seq[2];return {seq,op,steam:true,power,scale:1,upgraded:false,radius:({q:4.3,i:2,l:2.7,d:3,p:3,e:2.2,t:4,w:2.7,g:3,s:3,h:2.4})[op],range:8,life:op==='s'?2.5:op==='e'?4.5:5,damage:({l:9,s:7,h:10}[op]||0)*power,burn:op==='q'?1.1:0,burnDamage:.7*power,slow:['i','d','t'].includes(op)?1:0,ash:op==='d'?2:0,dust:op==='d'?2:0,frost:op==='i'?1:0,dashDistance:3.5,dashDuration:.5,dashSpeed:7,knockback:3.5,orbRadius:.5};}
// Shared by player/enemy tells and the runtime.
export function steamPlacement(s,caster,dir,target){if(['q','i','d','p'].includes(s.op))return{x:caster.x+dir.x*3,z:caster.z+dir.z*3};if(['e','s','w','h'].includes(s.op))return{x:caster.x,z:caster.z};const dx=target.x-caster.x,dz=target.z-caster.z,k=Math.min(1,s.range/(Math.hypot(dx,dz)||1));return{x:caster.x+dx*k,z:caster.z+dz*k};}
