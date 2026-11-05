export const FIRE_RECIPES={
 q:['불안개','근거리에 붉은 화염과 노란 불티를 뿜습니다. 닿으면 짧은 화상을 입힙니다.'],
 qq:['큰 불안개','화염의 크기와 사정거리가 커집니다.'],
 qi:['연막','전방에 넓고 짙은 회색 연막이 6초간 남습니다. 연막 안과 뒤쪽의 상대는 보이지 않습니다. 화상은 남기지 않습니다.'],
 ql:['붉은 낙뢰','조준한 곳에 붉은 번개가 떨어지고, 그을음과 작은 불꽃, 연기가 남습니다.'],
 qd:['잿불','많은 검은 재가 화염에 섞이고 맞은 몸에 검은 가루가 남습니다. 화상과 이동 속도 감소를 함께 남깁니다.'],
 qp:['독불','초록 불꽃이 맞은 몸에 붙습니다. 화상 피해와 지속 시간이 늘어납니다.'],
 qe:['화염 장벽','시전자 주위를 화염 장벽이 둘러쌉니다. 통행을 막고 닿은 적을 태웁니다.'],
 qt:['화염 장판','조준한 바닥에 화염을 남깁니다. 밟고 있는 적에게 계속 피해를 줍니다.'],
 qw:['화염구','전방으로 화염구를 발사합니다.'],
 qg:['화염 소용돌이','마우스 위치에 불기둥이 나선형으로 회전하는 불 회오리를 만듭니다. 적을 중심으로 빨아들입니다.'],
 qs:['화염 반달베기','근거리 전방을 벤 불꽃 반달이 순간적으로 나타났다 사라집니다. 닿은 적에게 화상을 남깁니다.'],
 qh:['불주먹','앞으로 전진하며 불주먹으로 공격하고 적을 크게 밀어냅니다. 벽을 통과하지 않습니다.']
};
export function fireSpec(seq,power=1){
 if(seq[0]!=='q')return null;
 const operations=seq.length===1?'q':seq.slice(1);let op='q';for(const k of operations)if(k!=='q')op=k;
 const growth=[...operations].filter(k=>k==='q').length-(seq.length===1?1:0),radius=op==='i'?4.8:2.8+growth*1.35;
 return {seq,op,power,radius,range:6+seq.length,life:op==='e'?4.5:op==='t'?4.5:op==='g'?3:op==='i'?6:.65,
 damage:(op==='i'?3:5)*power,burn:op==='i'?0:op==='p'?5:2,burnDamage:(op==='p'?4:2)*power,slow:op==='d'?2.5:0,ash:op==='d'?3:0,greenFire:op==='p'?5:0,
 speed:seq==='qww'?18:seq==='qqw'?6:9,orbRadius:seq==='qww'?.25:seq==='qqw'?.72:.42};
}

export const hasFireRecipe=seq=>!!FIRE_RECIPES[seq]||['qqq','qqw','qww'].includes(seq);
