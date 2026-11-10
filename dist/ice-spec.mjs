export const ICE_RECIPES={
 iq:['서리안개','넓은 흰 안개와 얼음가루를 뿜습니다. 피해 없이 안에 있는 적의 이동 속도를 낮춥니다.'],
 ii:['고드름','빠르고 날카로운 고드름을 직선으로 발사합니다. 빙결 숙련 2부터 좌클릭 1륜 충전을 마치면 사용할 수 있습니다.'],
 il:['얼음벼락','예고 원이 나타난 뒤 위에서 얼음이 빠르게 꽂힙니다. 적중하면 느려집니다.'],
 id:['빙산','전방에 빙산이 솟아 적을 밀어내고 잠시 길을 막습니다.'],
 ip:['동상','초록빛 냉기를 뿜습니다. 맞은 몸에 녹색 서리가 오래 남아 둔화가 지속됩니다.'],
 ie:['얼음장벽','조준한 위치에 두꺼운 얼음벽을 세웁니다. 이동과 투사체를 막고 닿은 적을 느리게 합니다.'],
 it:['빙판','밟은 적을 미끄러뜨려 넘어뜨립니다. 넘어지는 순간 충전과 진행 중인 시전을 취소하고 피해를 줍니다. 같은 적은 2.5초 동안 다시 넘어지지 않습니다.'],
 iw:['얼음탄','둥근 눈덩이를 발사합니다. 적에 닿으면 깨지며 주변에 피해와 둔화를 줍니다. 벽에 닿으면 부서집니다.'],
 ig:['눈보라','조준한 곳에 눈보라를 만듭니다. 적을 중심으로 끌어당기고 느리게 하며, 오래 머문 적은 잠깐 발이 얼어붙습니다.'],
 is:['서리베기','전방 근거리에 푸른 반달 칼자국이 나타났다 사라집니다. 피해와 짧은 둔화를 줍니다.'],
 ih:['빙결주먹','얼음 주먹을 내밀며 짧게 돌진합니다. 맞은 적을 조금 밀고 잠깐 이동을 막습니다.']
};
export const hasIceRecipe=seq=>Object.hasOwn(ICE_RECIPES,seq);
export function iceSpec(seq,power=1){if(!hasIceRecipe(seq))return null;const op=seq[1];return {seq,op,name:ICE_RECIPES[seq][0],power,damage:({q:0,i:12,l:10,d:8,p:4,e:0,t:5,w:7,g:1,s:9,h:12}[op])*power,range:({q:3.8,i:8.5,l:7,d:2.5,p:3,e:6,t:6,w:8,g:6,s:3,h:3}[op]),radius:({q:3.8,i:.16,l:1.25,d:1.5,p:3,e:1.8,t:2.6,w:1.35,g:2.8,s:3,h:.7}[op]),life:({q:3,e:4.5,t:4,g:3,p:.55}[op]||.6),slow:({q:.8,i:2,l:2.5,d:1,p:5,e:1,t:.8,w:1.8,g:1,s:1.2,h:1}[op]),speed:op==='i'?30:op==='w'?8:9};}
export function promoteIceBasic(spell,{hand='left',rank=1,completedRings=0}={}){if(spell.sequence!=='i'||hand!=='left'||rank<2||completedRings<1)return spell;return {...spell,sequence:'ii',name:'고드름',power:1.76,cost:15,tap:false,iceHand:undefined,upgradedIce:true};}
