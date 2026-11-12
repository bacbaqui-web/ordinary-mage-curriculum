import {EFFECTS,FIELDS,SHARED,POST,defaultPreset,validatePreset,EffectStore,spellKey} from './elemental-presets.mjs';
import {describe} from './combo-design.mjs?v=filled-tells-1';
const $=id=>document.getElementById(id);
const params=new URLSearchParams(location.search),sequence=params.get('seq')||'i',options={hand:params.get('hand')==='right'?'right':'left',charged:params.get('charged')==='1'};
let key,store,preset,stage,saved=null,storageFailed=false,mode='current',generation=0;
const variants=new Map();
function status(message,error=false){$('status').textContent=message;$('status').dataset.error=String(error);}
function storageError(){storageFailed=true;status('브라우저에 저장하지 못했습니다. 효과 파일을 내보내서 보관해 주세요.',true);}
function draft(){try{store.write(key,preset,true);storageFailed=false;status('작업 중인 초안을 보관했습니다. 완료하면 이 마법에 저장을 눌러 주세요.');}catch{storageError();}}
function changed({restart=false}={}){preset=validatePreset(preset);stage?.setPreset?.(preset,{restart});variants.set(preset.effect,structuredClone(preset));draft();}
function field(host,f,group){
 const label=document.createElement('label');label.className='field';const text=document.createElement('span');text.textContent=f.label;label.append(text);
 const value=document.createElement('input');value.type=f.type==='color'?'color':'number';value.value=group[f.key];value.setAttribute('aria-label',f.label);
 if(f.type==='number'){value.min=f.min;value.max=f.max;value.step=f.step;}
 label.append(value);let range;
 if(f.type==='number'){range=document.createElement('input');range.type='range';range.min=f.min;range.max=f.max;range.step=f.step;range.value=group[f.key];range.setAttribute('aria-label',f.label+' 슬라이더');label.append(range);}
 const update=input=>{const raw=f.type==='color'?input.value:Number(input.value);if(input.value===''||f.type!=='color'&&!Number.isFinite(raw))return;const next=f.type==='color'?raw:Math.min(f.max,Math.max(f.min,raw));group[f.key]=next;value.value=next;if(range)range.value=next;
 // Keep the control's object alive; validation returns a fresh serializable preset.
 const nextPreset=validatePreset(preset);stage?.setPreset?.(nextPreset);variants.set(preset.effect,structuredClone(nextPreset));draft();};
 value.addEventListener('input',()=>update(value));range?.addEventListener('input',()=>update(range));host.append(label);
}
function controls(){
 $('effect').value=mode;$('controls').replaceChildren();$('sharedControls').replaceChildren();
 $('sharedControls').parentElement.hidden=mode==='current';$('save').disabled=mode==='current';$('reset').disabled=mode==='current';$('export').disabled=mode==='current';
 if(mode==='current'){
  const note=document.createElement('p');note.className='hint';note.textContent='선택한 스킬의 충전·발사·명중을 게임과 같은 코드로 재생합니다.';
  const context=document.createElement('p');context.className='current-context';context.textContent=(params.get('name')||describe(sequence).name)+(sequence.length===1||sequence==='ii'?` · ${options.hand==='right'?'우클릭':'좌클릭'}`:'')+(sequence.length===1?(options.charged?' · 1륜 충전':' · 기본 공격'):` · ${sequence.length}륜`);
  $('controls').append(context,note);return;
 }
 const distance=document.createElement('label');distance.className='field';distance.innerHTML='<span>시전 거리</span><input type="number" min="2" max="26" step="0.5" aria-label="시전 거리">';distance.querySelector('span').textContent='시전 거리';const input=distance.querySelector('input');input.value=preset.distance;input.onchange=()=>{if(input.value===''||!Number.isFinite(Number(input.value)))return;preset.distance=Math.max(2,Math.min(26,Number(input.value)));input.value=preset.distance;changed({restart:true});controls();};$('controls').append(distance);
 for(const f of FIELDS[preset.effect])field($('controls'),f,preset.values);
 for(const f of SHARED)field($('sharedControls'),f,preset.global);
 for(const f of POST)field($('sharedControls'),f,preset.post);
}
function paused(){const value=stage?.paused??true;$('pause').textContent=value?'계속 재생':'일시정지';$('pause').setAttribute('aria-pressed',String(value));}
async function showMode(next){
 const ticket=++generation;mode=next;stage?.dispose();stage=null;controls();
 $('loading').hidden=false;$('loading').textContent=next==='current'?'현재 스킬을 불러오는 중입니다.':'효과를 불러오는 중입니다.';$('effect').disabled=true;
 const canvas=document.createElement('canvas');canvas.setAttribute('aria-label','선택한 효과 미리보기');document.querySelector('#stage canvas')?.replaceWith(canvas);canvas.hidden=next==='current';
 try{
  if(next==='current'){
   const {CurrentSpellStage}=await import('./current-spell-stage.mjs?v=1');if(ticket!==generation)return;
   stage=new CurrentSpellStage($('stage'),sequence,options);await stage.ready;
  }else{
   const {ElementalStage}=await import('./elemental-stage.mjs?v=2');if(ticket!==generation)return;
   stage=new ElementalStage(canvas);stage.setPreset(preset,{restart:true});
  }
  if(ticket!==generation)return;
  stage.onError=error=>{console.error(error);status('미리보기를 그리지 못했습니다. 편집기를 다시 열어 주세요.',true);};
  stage.onFrame=()=>{$('time').textContent=stage.elapsed.toFixed(2)+'초'+(mode==='current'?` · ${stage.castStarted?'시전':'충전'}`:'');paused();};
  stage.speed=Number($('speed').value);stage.repeat=$('repeat').checked;stage.paused=matchMedia('(prefers-reduced-motion: reduce)').matches;paused();
  $('home').textContent=next==='current'?'시점 바꾸기':'시점 초기화';$('freeze').textContent=next==='current'?'시전 직후 멈추기':'펼친 상태로 멈추기';
  $('previewHint').textContent=next==='current'?'현재 스킬의 실제 시전입니다. 일시정지하거나 한 프레임씩 진행해 확인할 수 있습니다.':'드래그로 회전 · 휠로 확대 · 멈춘 상태에서도 색과 모양을 조절할 수 있습니다.';
  $('loading').hidden=true;
 }catch(error){if(ticket!==generation)return;console.error(error);$('loading').textContent='미리보기를 열지 못했습니다. 다른 효과를 선택하거나 편집기를 다시 열어 주세요.';status(error.message,true);}
 finally{if(ticket===generation)$('effect').disabled=false;}
}
async function init(){
 try{
  key=spellKey(sequence,options);$('title').textContent=(params.get('name')||describe(sequence).name)+' · 효과 편집';
  $('effect').add(new Option('현재 스킬','current'));
  const group=document.createElement('optgroup');group.label='새 효과 설계';for(const [value,label] of Object.entries(EFFECTS))group.append(new Option(label,value));$('effect').append(group);
  preset=defaultPreset('ice');
  try{store=new EffectStore(localStorage);saved=store.read(key);preset=store.read(key,true)||saved||preset;}catch{storageError();}
  variants.set(preset.effect,structuredClone(preset));
  await showMode('current');
  if(!storageFailed)status('현재 스킬을 재생합니다. 다른 효과는 목록에서 선택해 설계할 수 있습니다.');
 }catch(error){console.error(error);$('loading').textContent='효과 편집기를 열지 못했습니다. 페이지를 새로고침해 주세요.';status(error.message,true);return;}
 $('effect').onchange=async()=>{const next=$('effect').value;variants.set(preset.effect,structuredClone(preset));if(next!=='current')preset=variants.get(next)||defaultPreset(next);await showMode(next);status(next==='current'?'현재 게임의 스킬 시전입니다.':'선택한 새 효과를 설계합니다. 현재 게임에는 아직 적용되지 않습니다.');};
 $('save').onclick=()=>{if(mode==='current')return;try{saved=store.write(key,preset);store.write(key,preset,true);status('이 마법의 효과를 이 브라우저에 저장했습니다.');parent.postMessage({type:'mage-elemental-saved',key},location.origin);}catch{storageError();}};
 $('loadSaved').onclick=async()=>{try{const value=store.read(key);if(!value){status('아직 저장한 효과가 없습니다. 먼저 이 마법에 저장을 눌러 주세요.');return;}preset=value;await showMode(preset.effect);draft();status('저장한 효과를 불러왔습니다.');}catch{storageError();}};
 $('reset').onclick=()=>{if(mode==='current'){stage.cast();return;}preset=defaultPreset(preset.effect);changed({restart:true});controls();status('초안을 기본값으로 되돌렸습니다. 이전에 저장한 효과는 그대로 남아 있습니다.');};
 $('export').onclick=()=>{if(mode==='current'){status('내보낼 효과를 목록에서 선택해 주세요. 현재 스킬은 게임 코드로 실행됩니다.');return;}const blob=new Blob([JSON.stringify({format:'mage-elemental-effect',spell:key,preset:validatePreset(preset)},null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`magic-effect-${key.replaceAll(':','-')}.json`;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);status('효과 파일을 내보냈습니다.');};
 $('import').onclick=()=>$('file').click();$('file').onchange=async()=>{const file=$('file').files[0];if(!file)return;try{if(file.size>100000)throw Error('효과 파일이 너무 큽니다. 이 편집기에서 내보낸 JSON 파일을 선택해 주세요.');const input=JSON.parse(await file.text());if(input.format!=='mage-elemental-effect')throw Error('이 편집기에서 내보낸 JSON 파일을 선택해 주세요.');preset=validatePreset(input.preset);await showMode(preset.effect);draft();status('효과 파일을 초안으로 불러왔습니다. 이 마법에 저장을 누르면 저장됩니다.');}catch(error){status(error instanceof SyntaxError?'JSON 파일을 읽지 못했습니다. 내보낸 효과 파일을 다시 선택해 주세요.':error.message,true);}finally{$('file').value='';}};
 $('cast').onclick=()=>{stage.cast();stage.paused=false;paused();};$('pause').onclick=()=>{stage.paused=!stage.paused;paused();};$('freeze').onclick=()=>{stage.freeze();paused();};$('step').onclick=()=>{stage.step();paused();};$('home').onclick=()=>stage.home();$('speed').onchange=()=>stage.speed=Number($('speed').value);$('repeat').onchange=()=>stage.repeat=$('repeat').checked;
 document.querySelector('main').inert=false;$('effect').disabled=false;$('save').disabled=mode==='current';
 document.addEventListener('keydown',e=>{if(e.code==='Escape'&&parent!==window){parent.postMessage({type:'mage-elemental-close'},location.origin);return;}if(e.code==='Space'&&!['INPUT','SELECT','BUTTON','TEXTAREA'].includes(e.target.tagName)){e.preventDefault();$('pause').click();}});
}
window.addEventListener('pagehide',()=>{generation++;stage?.dispose();});
void init();
