export const RUNES={
q:{name:'화염',icon:'✦',color:'#ff9869',body:'화염',action:'확산합니다',effect:'짧은 화상을 남깁니다'},
i:{name:'빙결',icon:'❄',color:'#8fe2ff',body:'냉기',action:'응축합니다',effect:'이동 속도를 낮춥니다'},
l:{name:'전격',icon:'ϟ',color:'#f4df78',body:'전격',action:'내리꽂습니다',effect:'닿은 대상에 전기 피해를 줍니다'},
d:{name:'대지',icon:'◆',color:'#c4a083',body:'대지',action:'굳힙니다',effect:'단단한 물체를 만듭니다'},
p:{name:'독',icon:'☠',color:'#afd67d',body:'독',action:'묻힙니다',effect:'독 피해를 남기고 머무를 공간을 제한합니다'},
a:{name:'물',icon:'≈',color:'#66bde5',body:'물',action:'흩뿌립니다',effect:'대상과 바닥을 적셔 다음 원소와 반응하게 합니다'},
e:{name:'장벽',icon:'▥',color:'#c4b5ff',body:'장벽',action:'세웁니다',effect:'이동과 공격을 막습니다'},
t:{name:'장판',icon:'◎',color:'#9be2c0',body:'장판',action:'바닥에 깝니다',effect:'이동을 막지 않고 영역 안에 효과를 줍니다'},
w:{name:'밀기',icon:'→',color:'#e9c891',body:'미는 힘',action:'날려보냅니다',effect:'대상이나 만들어진 마법을 앞으로 움직입니다'},
g:{name:'당김',icon:'↙',color:'#c99fe5',body:'당기는 힘',action:'잡아당깁니다',effect:'범위 안의 적을 중심으로 당깁니다'},
s:{name:'베기',icon:'╱',color:'#d5e0ed',body:'베기',action:'주변을 베어냅니다',effect:'얇은 범위를 가로질러 벱니다'},
h:{name:'타격',icon:'✹',color:'#f0ac93',body:'타격',action:'한곳에 피해를 줍니다',effect:'좁은 범위에 순간 피해를 줍니다'},
};
export function valid(seq){return typeof seq==='string'&&seq.length>0&&seq.length<=3&&[...seq].every(k=>RUNES[k]);}
const object=s=>s+(((s.charCodeAt(s.length-1)-44032)%28===0)?'를':'을');
const names={q:s=>'퍼지는 '+s,i:s=>'응축된 '+s,l:s=>'내리꽂는 '+s,d:s=>'굳힌 '+s,p:s=>'묻히는 '+s,a:s=>'흩뿌리는 '+s,e:s=>s+' 장벽',t:s=>s+' 장판',w:s=>'날아가는 '+s,g:s=>'끌어당기는 '+s,s:s=>s+' 주변 베기',h:s=>s+' 집중 타격'};
export function describe(seq){if(!valid(seq))throw Error('잘못된 조합');const first=RUNES[seq[0]];let name=first.body,shape='orb',motion='still';const steps=[`${object(name)} 만듭니다.`];const operations=[];
function apply(k){operations.push(k);if(k==='l')motion='fall';if(k==='w')motion='forward';if(k==='g')motion='pull';if(k==='q'){shape='spread';}if(k==='i'){shape='condensed';}if(k==='d'){shape='solid';}if(k==='p'){shape='coat';}if(k==='a'){shape='spray';}if(k==='e'){shape='wall';}if(k==='t'){shape='field';}if(k==='s'){shape='slash';}if(k==='h'){shape='strike';}}
if(seq.length===1){apply(seq[0]);steps[0]=`${object(first.body)} ${first.action}.`;name=names[seq[0]](first.body);}
for(let j=1;j<seq.length;j++){const k=seq[j],old=name;apply(k);name=names[k](old);const phrase=k==='s'?`${old}로 주변을 베어냅니다.`:k==='h'?`${old}로 한곳에 피해를 줍니다.`:`${object(old)} ${RUNES[k].action}.`;steps.push(phrase);}
return {name,steps,shape,motion,operations,balance:'첫 1륜은 대상을 정하고, 뒤의 1륜은 앞 단계의 결과에 동작을 적용합니다. 단독 사용은 자신의 대상과 동작을 함께 씁니다. 게임과 미리보기에 같은 순서로 적용됩니다.',color:first.color};}
