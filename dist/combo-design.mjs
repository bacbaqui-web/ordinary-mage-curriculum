export const RUNES={
q:{name:'화염',icon:'✦',color:'#ff9869',body:'불꽃',action:'불태웁니다',effect:'짧은 화상을 남깁니다'},
i:{name:'빙결',icon:'❄',color:'#8fe2ff',body:'냉기',action:'얼립니다',effect:'이동 속도를 낮춥니다'},
l:{name:'전격',icon:'ϟ',color:'#f4df78',body:'전기',action:'전기를 흐르게 합니다',effect:'닿은 대상에 전기 피해를 줍니다'},
d:{name:'대지',icon:'◆',color:'#c4a083',body:'돌덩이',action:'돌로 굳힙니다',effect:'단단한 물체를 만듭니다'},
p:{name:'독',icon:'☠',color:'#afd67d',body:'독 안개',action:'독을 입힙니다',effect:'독 피해를 남기고 머무를 공간을 제한합니다'},
a:{name:'물',icon:'≈',color:'#66bde5',body:'물줄기',action:'적십니다',effect:'대상과 바닥을 적셔 다음 원소와 반응하게 합니다'},
e:{name:'장벽',icon:'▥',color:'#c4b5ff',body:'마력 벽',action:'벽으로 세웁니다',effect:'이동과 공격을 막습니다'},
t:{name:'장판',icon:'◎',color:'#9be2c0',body:'마력 영역',action:'바닥에 깔고 유지합니다',effect:'이동을 막지 않고 영역 안에 효과를 줍니다'},
w:{name:'밀기',icon:'→',color:'#e9c891',body:'밀어내는 충격파',action:'앞으로 보냅니다',effect:'대상이나 만들어진 마법을 앞으로 움직입니다'},
g:{name:'당김',icon:'↙',color:'#c99fe5',body:'끌어당기는 파동',action:'중심으로 끌어모읍니다',effect:'범위 안의 적을 중심으로 당깁니다'},
s:{name:'베기',icon:'╱',color:'#d5e0ed',body:'마력 칼날',action:'얇고 긴 날로 만듭니다',effect:'얇은 범위를 가로질러 벱니다'},
h:{name:'타격',icon:'✹',color:'#f0ac93',body:'마력 충격',action:'한곳에서 터뜨립니다',effect:'좁은 범위에 순간 피해를 줍니다'},
n:{name:'낙하',icon:'↓',color:'#b4b9ef',body:'떨어지는 마력 덩어리',action:'위에서 떨어뜨립니다',effect:'바닥에 위치를 예고한 뒤 떨어집니다'},
r:{name:'회전',icon:'↻',color:'#e7b5d5',body:'회전하는 마력 고리',action:'회전시킵니다',effect:'중심 주위를 돌며 닿은 적에게 효과를 줍니다'}
};
const reactions={qa:['증기','불꽃을 식혀 증기로 바꿉니다. 안쪽의 시야와 조준을 방해합니다.'],aq:['뜨거운 증기','물을 가열해 증기로 바꿉니다. 처음 닿을 때 열 피해를 주고 시야를 가립니다.'],ai:['얼음','물을 얼려 얼음으로 만듭니다. 바닥에 남으면 미끄러운 빙판이 됩니다.'],ia:['서리 물결','냉기에 물을 보태 넓게 퍼뜨립니다. 젖음과 감속을 남깁니다.'],qi:['증기 구름','불꽃을 급히 식혀 시야를 가리는 증기로 바꿉니다.'],iq:['열 충격','냉기를 급히 가열해 터뜨립니다. 감속 대신 순간 피해를 줍니다.'],al:['전류가 흐르는 물','물에 전기를 흘립니다. 연결된 젖은 범위로 전류가 퍼집니다.'],la:['퍼지는 전류','전기를 물에 실어 넓게 퍼뜨립니다. 개별 대상의 피해는 낮아집니다.'],da:['진흙','돌을 물로 풀어 진흙으로 만듭니다. 밟은 적을 느리게 합니다.'],ad:['굳는 진흙','물을 흙과 섞어 굳힙니다. 짧은 지연 뒤 이동을 방해합니다.'],dq:['용암','돌을 가열해 용암으로 만듭니다. 이동은 느리지만 열 피해를 남깁니다.'],qd:['불붙은 바위','불꽃을 돌 안에 담습니다. 충돌 피해와 화상을 줍니다.'],ap:['독물','물에 독을 섞습니다. 젖은 영역에 독 효과를 남깁니다.'],pa:['묽은 독물','독을 물로 퍼뜨립니다. 피해 농도는 낮아지고 범위가 넓어집니다.']};
export function valid(seq){return typeof seq==='string'&&seq.length>0&&seq.length<=3&&[...seq].every(k=>RUNES[k]);}
const object=s=>s+(((s.charCodeAt(s.length-1)-44032)%28===0)?'를':'을');
export function describe(seq){if(!valid(seq))throw Error('잘못된 조합');let name=RUNES[seq[0]].body;const steps=[`${object(name)} 만듭니다. ${RUNES[seq[0]].effect}.`];let shape=seq[0]==='e'?'wall':seq[0]==='t'?'field':seq[0]==='s'?'blade':'orb',motion=seq[0]==='n'?'fall':seq[0]==='r'?'spin':'still';
for(let j=1;j<seq.length;j++){const k=seq[j],r=RUNES[k],old=name;
if(k===seq[j-1]){const repeat={w:'더 빠르고 멀리 보냅니다',g:'더 넓고 강하게 끌어모읍니다',e:'더 튼튼하고 오래 유지합니다',t:'영역을 넓히고 더 오래 유지합니다',n:'낙하체의 크기와 충돌 범위를 키웁니다',r:'회전 반경과 지속 시간을 늘립니다',s:'칼날의 폭과 절단력을 높입니다',h:'충돌 범위와 순간 피해를 높입니다'};steps.push(`${object(old)} ${repeat[k]||'더 크고 짙게 만듭니다'}.`);name=old.startsWith('강화된 ')?old.replace('강화된 ','극대화한 '):'강화된 '+old;continue;}
const reaction=(j===1||seq[0]===seq[1])&&reactions[seq[j-1]+k];if(reaction){name=reaction[0];steps.push(reaction[1]);continue;}
if(k==='w'){name=shape==='wall'?'전진하는 '+old:shape==='field'?'이동하는 '+old:'발사되는 '+old;motion='forward';}
else if(k==='n'){name='낙하하는 '+old;motion='fall';}
else if(k==='r'){name='회전하는 '+old;motion='spin';}
else if(k==='e'){name=old+' 장벽';shape='wall';}
else if(k==='t'){name=old+' 장판';shape='field';if(motion==='forward'||motion==='fall')name=old+' · 도착 지점 장판';}
else if(k==='s'){name=old+' 칼날';shape='blade';}
else if(k==='h'){name=old+' 폭발';shape='burst';}
else if(k==='g'){name='흡인하는 '+old;}
else{name=old+' · '+r.name;}
steps.push(`${object(old)} ${r.action}. ${r.effect}.`);
}
let balance='수치와 환경 반응은 설계안입니다. 실제 게임에는 아직 동일하게 적용되지 않습니다.';
if(seq.length===3&&seq[0]===seq[1]&&seq[2]==='w')balance='재료를 두 번 쌓아 크고 강하게 만듭니다. 한 번 쌓은 발사체보다 느리게 날아갑니다.';
if(seq.length===3&&seq[1]==='w'&&seq[2]==='w')balance='발사를 두 번 강화합니다. 크기보다 속도와 사거리를 높입니다.';
return {name,steps,shape,motion,balance,color:name.includes('증기')?'#c9e0e4':RUNES[seq[0]].color};}
