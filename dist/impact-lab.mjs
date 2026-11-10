import {GROUPS,FIELDS,DEFAULTS,NONE,STORAGE_KEY,normalize,readImpactSettings,watchImpactSettings} from './impact-settings.mjs';
const $=id=>document.getElementById(id);
let settings={...DEFAULTS};
try{const raw=localStorage.getItem(STORAGE_KEY);if(raw){settings=normalize(JSON.parse(raw));$('preset').value='custom';}$('saveStatus').textContent='브라우저에 자동 저장';}catch{$('saveStatus').textContent='설정을 읽지 못해 기본값을 열었습니다.';}
const display=(v,unit)=>`${Number(v.toFixed(2))}${unit?' '+unit:''}`;
for(const group of GROUPS){const box=document.createElement('details');box.className='group';box.open=true;const summary=document.createElement('summary');summary.textContent=group.title;const desc=document.createElement('p');desc.textContent=group.description;summary.append(desc);box.append(summary);const fields=document.createElement('div');fields.className='fields';for(const [key,label,min,max,step,,unit,hint] of group.fields){const wrap=document.createElement('label');wrap.className='field';wrap.htmlFor=key;const heading=document.createElement('span');heading.className='field-head';const title=document.createElement('span');title.textContent=label;const output=document.createElement('output');output.id=key+'Value';output.htmlFor=key;heading.append(title,output);const input=document.createElement('input');Object.assign(input,{type:'range',id:key,min,max,step,value:settings[key]});const small=document.createElement('small');small.id=key+'Hint';small.textContent=hint;input.setAttribute('aria-describedby',small.id);input.addEventListener('input',()=>{settings[key]=Number(input.value);$('preset').value='custom';sync();save();});wrap.append(heading,input,small);fields.append(wrap);}box.append(fields);$('controls').append(box);}

function sync(){for(const [key,,,,,,unit] of FIELDS){$(key).value=settings[key];$(key+'Value').textContent=display(settings[key],unit);}}
function save(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(settings));$('saveStatus').textContent='저장됨 · 게임 반영 확인 중';}catch{$('saveStatus').textContent='저장하지 못했습니다. 설정 파일로 보관하세요.';}}
$('preset').onchange=()=>{const p=$('preset').value;if(p==='custom')return;settings=normalize(p==='none'?NONE:p==='heavy'?{...DEFAULTS,anticipation:420,windup:28,recoil:.4,stretch:2.3,trail:1,flash:110,squash:.4,knockback:.85,particles:36,shake:.12,freeze:110,volume:55}:DEFAULTS);sync();save();};
$('reset').onclick=()=>{settings={...DEFAULTS};$('preset').value='default';sync();save();};
$('export').onclick=()=>{const url=URL.createObjectURL(new Blob([JSON.stringify({version:1,settings},null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='타격감-설정.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
watchImpactSettings(s=>{settings=s;sync();});
const game=$('game');
// Embed the actual entry point. Physics, models, timing, audio, camera and all
// feedback are owned by game-live, with no second implementation here.
function gameState(){try{return game.contentWindow.mageDebug?.();}catch{return null;}}
$('startIce').onclick=()=>{
 const doc=game.contentDocument;if(!gameState())return;
 doc.getElementById('choose').click();
 doc.querySelector('[data-character="ice"]').click();
 doc.getElementById('modeSolo').click();
 doc.getElementById('confirmSelection').click();
 game.contentWindow.focus();
};
$('restartGame').onclick=()=>{game.contentDocument?.getElementById('reset')?.click();game.contentWindow.focus();};
$('pauseGame').onclick=()=>{game.contentDocument?.getElementById('pause')?.click();};
setInterval(()=>{
 const state=gameState();$('startIce').disabled=!state;$('restartGame').disabled=!state?.running;$('pauseGame').disabled=!state?.running;
 if(!state){$('modelStatus').textContent='결투 게임을 불러오는 중입니다.';return;}
 const applied=FIELDS.every(([key])=>state.impact?.settings[key]===settings[key]);
 $('saveStatus').textContent=applied?'게임에 적용됨':'게임 반영 대기 중';
 $('modelStatus').textContent=state.models?.ready?'게임 모델과 저장된 동작 사용 중':'결투 게임의 캐릭터를 불러왔습니다.';
 $('pauseGame').textContent=state.paused?'계속하기':'일시정지';
 $('runtimeStatus').textContent=state.running?`실제 전투 · 공격 ${state.impact?.casts||0}회 · 피격 ${state.impact?.hits||0}회`:'빙결로 시작을 누른 뒤 게임 화면에서 공격하세요.';
},250);
sync();
