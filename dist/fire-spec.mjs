import {RED_LIGHTNING_RECIPES,isRedLightning,redLightningSpec} from './red-lightning-spec.mjs?v=bolt16';
import {STEAM_RECIPES,isSteam,steamSpec} from './steam-spec.mjs?v=bolt16';
export const FIRE_RECIPES={
 ...RED_LIGHTNING_RECIPES,
 ...STEAM_RECIPES,
 q:['불안개','근거리에 붉은 화염과 노란 불티를 뿜습니다. 닿으면 짧은 화상을 입힙니다.'],
 qq:['화염지대','넓게 화염을 뿜고 바닥에 탄 자국과 짙은 연기를 남깁니다.'],
 qi:['연막','전방에 짙은 회색 연막이 6초간 남습니다. 연막 안과 뒤쪽의 상대는 보이지 않습니다. 화상은 남기지 않습니다.'],
 ql:['붉은 낙뢰','조준한 곳에 붉은 번개가 떨어지고, 그을음과 작은 불꽃, 연기가 남습니다.'],
 qd:['잿불','많은 검은 재가 화염에 섞이고 맞은 몸에 검은 가루가 남습니다. 화상과 이동 속도 감소를 함께 남깁니다.'],
 qp:['독불','초록 불꽃이 맞은 몸에 붙습니다. 화상 피해와 지속 시간이 늘어납니다.'],
 qe:['화염 장벽','시전자 주위를 화염 장벽이 둘러쌉니다. 통행을 막고 닿은 적을 태웁니다.'],
 qt:['화염 장판','조준한 바닥에 화염을 남깁니다. 밟고 있는 적에게 계속 피해를 줍니다.'],
 qw:['화염구','전방으로 화염구를 발사합니다.'],
 qg:['화염 소용돌이','마우스 위치에 불기둥이 나선형으로 회전하는 불 회오리를 만듭니다. 적을 중심으로 빨아들입니다.'],
 qs:['화염 반달베기','근거리 전방을 벤 불꽃 반달이 순간적으로 나타났다 사라집니다. 닿은 적에게 화상을 남깁니다.'],
 qqq:['불바다','화염지대보다 훨씬 넓게 불안개를 펼칩니다. 넓은 탄 자국과 많은 연기가 남습니다.'],
 qqi:['불안개','연막과 같은 크기의 안개에 붉은 불빛이 감돕니다. 안의 적을 태우며 시야를 가립니다.'],
 qql:['불벼락','더 굵고 큰 붉은 낙뢰가 떨어집니다. 넓은 불길과 탄 자국, 연기를 남깁니다.'],
 qqd:['화산재','더 넓고 강한 잿불과 많은 회색 재를 뿜습니다. 불꽃이 꺼진 뒤에도 재가 천천히 떨어져 바닥에 남습니다. 화상과 감속을 입힙니다.'],
 qqp:['독화염','더 넓고 강한 초록 화염을 뿜습니다. 몸에 독불이 붙어 강한 화상 피해를 줍니다.'],
 qqe:['대형 화염 장벽','더 큰 화염 장벽으로 주위를 둘러쌉니다. 불길과 접촉 피해가 커집니다.'],
 qqt:['대형 화염 장판','더 넓은 바닥을 큰 불길로 덮습니다. 밟고 있는 적에게 더 큰 피해를 줍니다.'],
 qqw:['화염탄','화염구보다 크고 느린 불덩이를 발사합니다.'],
 qqg:['불오름','더 크고 높은 불 회오리가 적을 빨아들이며 태웁니다.'],
 qqs:['불가르기','더 넓은 근거리를 큰 불꽃 반달로 베어냅니다. 반달은 날아가지 않고 빠르게 사라집니다.'],
 qqh:['화염돌격','거대한 불주먹으로 더 멀리 돌진합니다. 피해가 커지고 맞은 적을 더 멀리 밀어냅니다.'],
 qh:['불주먹','앞으로 전진하며 불주먹으로 공격하고 적을 크게 밀어냅니다. 벽을 통과하지 않습니다.']
};
export function fireSpec(seq,power=1){
 if(seq[0]!=='q')return null;if(isSteam(seq))return steamSpec(seq,power);if(isRedLightning(seq))return redLightningSpec(seq,power);
 const operations=seq.length===1?'q':seq.slice(1);let op='q';for(const k of operations)if(k!=='q')op=k;
 const upgraded=seq.length===3&&seq.startsWith('qq');
 const scale=upgraded?1.5:1,radius=op==='i'?3:op==='q'?(seq==='qqq'?6.6:seq==='qq'?4.5:2.8):op==='l'?1.5*scale:op==='e'?2*scale:op==='g'?2.8*scale:op==='s'?2.6*scale:2.8*scale;
 const damageScale=upgraded?1.55:1;
 return {seq,op,power,upgraded,scale,radius,range:6+seq.length,life:op==='e'||op==='t'?4.5:op==='g'?3:op==='i'?6:.65,
 damage:(op==='i'&&!upgraded?0:5)*power*damageScale,tickDamage:1.2*power*damageScale,burn:op==='i'&&!upgraded?0:op==='p'?5:2,burnDamage:(op==='p'?4:2)*power*damageScale,slow:op==='d'?2.5:0,ash:op==='d'?3:0,greenFire:op==='p'?5:0,
 dashDistance:upgraded?5:3,dashSpeed:upgraded?10:7.5,dashDuration:upgraded?.5:.4,knockback:upgraded?7:4.5,
 speed:seq==='qww'?18:seq==='qqw'?6:9,orbRadius:seq==='qww'?.25:seq==='qqw'?.85:.42};
}

export const hasFireRecipe=seq=>!!FIRE_RECIPES[seq]||seq==='qww';
