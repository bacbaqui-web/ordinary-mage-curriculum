export const STORAGE_KEY='ordinary-mage-impact-lab-v1';
export const GROUPS=[
 {title:'공격 시 모션',description:'모으기 → 발사 → 제자리로 돌아오기',fields:[
 ['anticipation','준비 시간',0,800,10,260,'ms','충전 자세에서 발사 자세로 전환하는 시간입니다. 전환이 끝나면 공격이 나갑니다.'],
 ['windup','몸 젖히기',0,35,1,16,'°','발사 전에 상체를 뒤로 기울입니다.'],
 ['recoil','발사 반동',0,0.8,0.02,0.18,'m','발사한 캐릭터를 잠깐 뒤로 움직입니다.'],
 ['follow','동작 마무리',0,900,10,360,'ms','발사 자세에서 원래 자세로 돌아오는 시간입니다.'],
 ['stretch','투사체 늘리기',1,3,0.05,1.7,'배','날아가는 방향으로 투사체를 늘립니다.'],
 ['trail','잔상 길이',0,1.5,0.05,0.65,'m','투사체 뒤에 따라오는 꼬리 길이입니다.'],
 ['arc','투사체 곡선',0,1.5,0.05,0.3,'m','이동 경로의 가운데를 위로 휘게 합니다.'] ]},
 {title:'피격 시 모션',description:'맞는 순간 → 충격 → 회복',fields:[
 ['flash','하얀 반짝임',0,300,10,80,'ms','맞은 몸을 잠깐 하얗게 표시합니다.'],
 ['squash','몸 눌림',0,0.6,0.02,0.22,'','충돌 순간 몸을 낮추고 옆으로 늘립니다.'],
 ['knockback','뒤로 밀림',0,1.5,0.05,0.4,'m','맞은 캐릭터가 밀려나는 거리입니다.'],
 ['recovery','회복 시간',100,1500,25,550,'ms','밀리고 눌린 몸이 돌아오는 시간입니다.'],
 ['particles','파편 수',0,60,1,20,'개','맞은 방향으로 날아가는 파편 수입니다.'],
 ['spread','파편 퍼짐',0,90,1,35,'°','파편이 퍼져 나가는 각도입니다.'],
 ['gravity','파편 휘어짐',0,12,0.5,5,'','파편을 아래로 휘게 하는 정도입니다.'],
 ['shake','화면 흔들림',0,0.3,0.01,0.06,'m','타격 순간 화면을 짧게 흔듭니다.'],
 ['freeze','순간 멈춤',0,200,5,60,'ms','맞는 순간 동작을 잠깐 멈춥니다.'],
 ['volume','타격음 크기',0,100,1,35,'%','소리 켜기를 누른 뒤 들을 수 있습니다.'],
 ['numberArc','피해 숫자 곡선',0,1.5,0.05,0.55,'m','피해 숫자가 옆으로 휘며 떨어집니다.'] ]}
];
export const FIELDS=GROUPS.flatMap(g=>g.fields);
export const DEFAULTS=Object.fromEntries(FIELDS.map(([k,,,,,v])=>[k,v]));
export const NONE={...DEFAULTS,anticipation:0,windup:0,recoil:0,follow:0,stretch:1,trail:0,arc:0,flash:0,squash:0,knockback:0,particles:0,shake:0,freeze:0,volume:0,numberArc:0};
export function normalize(input){return Object.fromEntries(FIELDS.map(([key,,min,max,step,value])=>{const n=input?.[key];return [key,typeof n==='number'&&Number.isFinite(n)?Math.min(max,Math.max(min,Number((Math.round(n/step)*step).toFixed(4)))):value];}));}
export function timing(s,flight=.55){const release=s.anticipation/1000,hit=release+flight,end=hit+s.freeze/1000+Math.max(1.2,s.recovery/1000,s.follow/1000);return {release,hit,end};}

export function readImpactSettings(storage){try{storage??=globalThis.localStorage;return normalize(JSON.parse(storage?.getItem(STORAGE_KEY)||'null'));}catch{return {...DEFAULTS};}}
export function watchImpactSettings(onChange){const refresh=()=>onChange(readImpactSettings());const changed=e=>{if(e.key===STORAGE_KEY||e.key===null)refresh();};globalThis.addEventListener?.('storage',changed);globalThis.addEventListener?.('focus',refresh);refresh();return ()=>{globalThis.removeEventListener?.('storage',changed);globalThis.removeEventListener?.('focus',refresh);};}
const clamp01=n=>Math.max(0,Math.min(1,n));
export function attackPose(s,time){const release=s.anticipation/1000,pre=time<release?Math.sin(clamp01(time/Math.max(.001,release))*Math.PI/2):0,post=time-release,follow=post>=0?1-clamp01(post/Math.max(.001,s.follow/1000)):0;return {offset:-follow*s.recoil+0,lean:-pre*s.windup*Math.PI/180+follow*.12,pre,follow};}
export function hitPose(s,age){if(age<0)return {offset:0,lean:0,squash:0,flash:false};const response=Math.sin(clamp01(age/(s.recovery/1000))*Math.PI);return {offset:s.knockback*response,lean:response*s.knockback*.22,squash:(1-clamp01(age/Math.min(.3,s.recovery/1000)))*s.squash,flash:age<s.flash/1000};}
export function particleOffset(s,i,age){const angle=((i*.61803398875)%1-.5)*2*s.spread*Math.PI/180,speed=1.2+(i*7%13)/5;return {forward:Math.cos(angle)*speed*age,up:Math.sin(angle)*speed*age-s.gravity*age*age/2,side:Math.sin(i*2.4)*age*.6};}
export function numberOffset(s,age){return {x:Math.sin(age*Math.PI/2)*s.numberArc,y:age*1.5-age*age*1.2};}
