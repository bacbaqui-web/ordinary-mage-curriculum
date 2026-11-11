import {EFFECTS,FIELDS,SHARED,POST,defaultPreset,validatePreset,EffectStore,spellKey} from './elemental-presets.mjs';
import {describe} from './combo-design.mjs?v=filled-tells-1';
const $=id=>document.getElementById(id);
const params=new URLSearchParams(location.search),sequence=params.get('seq')||'i',options={hand:params.get('hand')==='right'?'right':'left',charged:params.get('charged')==='1'};
let key,store,preset,stage,saved=null,storageFailed=false;
const variants=new Map();
function status(message,error=false){$('status').textContent=message;$('status').dataset.error=String(error);}
function storageError(){storageFailed=true;status('브라우저에 저장하지 못했습니다. 효과 파일을 내보내서 보관해 주세요.',true);}
function draft(){try{store.write(key,preset,true);storageFailed=false;status('작업 중인 초안을 보관했습니다. 완료하면 이 마법에 저장을 눌러 주세요.');}catch{storageError();}}
function changed({restart=false}={}){preset=validatePreset(preset);stage?.setPreset(preset,{restart});variants.set(preset.effect,structuredClone(preset));draft();}
function field(host,f,group){
 const label=document.createElement('label');label.className='field';const text=document.createElement('span');text.textContent=f.label;label.append(text);
 const value=document.createElement('input');value.type=f.type==='color'?'color':'number';value.value=group[f.key];value.setAttribute('aria-label',f.label);
 if(f.type==='number'){value.min=f.min;value.max=f.max;value.step=f.step;}
 label.append(value);let range;
 if(f.type==='number'){range=document.createElement('input');range.type='range';range.min=f.min;range.max=f.max;range.step=f.step;range.value=group[f.key];range.setAttribute('aria-label',f.label+' 슬라이더');label.append(range);}
 const update=input=>{const raw=f.type==='color'?input.value:Number(input.value);if(input.value===''||f.type!=='color'&&!Number.isFinite(raw))return;const next=f.type==='color'?raw:Math.min(f.max,Math.max(f.min,raw));group[f.key]=next;value.value=next;if(range)range.value=next;
 // Keep the control's object alive; validation returns a fresh serializable preset.
 const nextPreset=validatePreset(preset);stage?.setPreset(nextPreset);variants.set(preset.effect,structuredClone(nextPreset));draft();};
 value.addEventListener('input',()=>update(value));range?.addEventListener('input',()=>update(range));host.append(label);
}
function controls(){
 $('effect').value=preset.effect;$('controls').replaceChildren();$('sharedControls').replaceChildren();
 const distance=document.createElement('label');distance.className='field';distance.innerHTML='<span>시전 거리</span><input type="number" min="2" max="26" step="0.5" aria-label="시전 거리">';distance.querySelector('span').textContent='시전 거리';const input=distance.querySelector('input');input.value=preset.distance;input.onchange=()=>{if(input.value===''||!Number.isFinite(Number(input.value)))return;preset.distance=Math.max(2,Math.min(26,Number(input.value)));input.value=preset.distance;changed({restart:true});controls();};$('controls').append(distance);
 for(const f of FIELDS[preset.effect])field($('controls'),f,preset.values);
 for(const f of SHARED)field($('sharedControls'),f,preset.global);
 for(const f of POST)field($('sharedControls'),f,preset.post);
}
function paused(){const value=stage?.paused??true;$('pause').textContent=value?'계속 재생':'일시정지';$('pause').setAttribute('aria-pressed',String(value));}
async function init(){
 try{
  key=spellKey(sequence,options);$('title').textContent=(params.get('name')||describe(sequence).name)+' · 효과 편집';
  for(const [value,label] of Object.entries(EFFECTS))$('effect').add(new Option(label,value));
  const initial=sequence[0]==='i'?'ice':sequence[0]==='l'?'thunder':sequence[0]==='q'?'meteor':'beam';preset=defaultPreset(initial);
  try{store=new EffectStore(localStorage);saved=store.read(key);preset=store.read(key,true)||saved||preset;}catch{storageError();}
  controls();
  const {ElementalStage}=await import('./elemental-stage.mjs?v=1');stage=new ElementalStage(document.querySelector('canvas'));
  stage.onError=error=>{console.error(error);status('효과를 그리지 못했습니다. 효과 파일을 내보낸 뒤 편집기를 다시 열어 주세요.',true);};
  stage.onFrame=()=>{$('time').textContent=stage.elapsed.toFixed(2)+'초';};
  stage.setPreset(preset,{restart:true});stage.paused=matchMedia('(prefers-reduced-motion: reduce)').matches;paused();$('loading').hidden=true;
  if(!storageFailed)status(saved?'저장한 효과가 있습니다. 초안이 있으면 이어서 엽니다.':'기본 효과를 골라 색과 모양을 조절해 주세요.');
 }catch(error){console.error(error);$('loading').textContent='효과 편집기를 열지 못했습니다. 페이지를 새로고침해 주세요.';status(error.message,true);return;}
 $('effect').onchange=()=>{variants.set(preset.effect,structuredClone(preset));preset=variants.get($('effect').value)||defaultPreset($('effect').value);changed({restart:true});controls();};
 $('save').onclick=()=>{try{saved=store.write(key,preset);store.write(key,preset,true);status('이 마법의 효과를 이 브라우저에 저장했습니다.');parent.postMessage({type:'mage-elemental-saved',key},location.origin);}catch{storageError();}};
 $('loadSaved').onclick=()=>{try{const value=store.read(key);if(!value){status('아직 저장한 효과가 없습니다. 먼저 이 마법에 저장을 눌러 주세요.');return;}preset=value;changed({restart:true});controls();status('저장한 효과를 불러왔습니다.');}catch{storageError();}};
 $('reset').onclick=()=>{preset=defaultPreset(preset.effect);changed({restart:true});controls();status('초안을 기본값으로 되돌렸습니다. 이전에 저장한 효과는 그대로 남아 있습니다.');};
 $('export').onclick=()=>{const blob=new Blob([JSON.stringify({format:'mage-elemental-effect',spell:key,preset:validatePreset(preset)},null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`magic-effect-${key.replaceAll(':','-')}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);status('효과 파일을 내보냈습니다.');};
 $('import').onclick=()=>$('file').click();$('file').onchange=async()=>{const file=$('file').files[0];if(!file)return;try{if(file.size>100000)throw Error('효과 파일이 너무 큽니다. 이 편집기에서 내보낸 JSON 파일을 선택해 주세요.');const input=JSON.parse(await file.text());if(input.format!=='mage-elemental-effect')throw Error('이 편집기에서 내보낸 JSON 파일을 선택해 주세요.');preset=validatePreset(input.preset);changed({restart:true});controls();status('효과 파일을 초안으로 불러왔습니다. 이 마법에 저장을 누르면 저장됩니다.');}catch(error){status(error instanceof SyntaxError?'JSON 파일을 읽지 못했습니다. 내보낸 효과 파일을 다시 선택해 주세요.':error.message,true);}finally{$('file').value='';}};
 $('cast').onclick=()=>{stage.cast();stage.paused=false;paused();};$('pause').onclick=()=>{stage.paused=!stage.paused;paused();};$('freeze').onclick=()=>{stage.freeze();paused();};$('step').onclick=()=>{stage.step();paused();};$('home').onclick=()=>stage.home();$('speed').onchange=()=>stage.speed=Number($('speed').value);$('repeat').onchange=()=>stage.repeat=$('repeat').checked;
 document.querySelector('main').inert=false;$('effect').disabled=false;$('save').disabled=false;
 document.addEventListener('keydown',e=>{if(e.code==='Escape'&&parent!==window){parent.postMessage({type:'mage-elemental-close'},location.origin);return;}if(e.code==='Space'&&!['INPUT','SELECT','BUTTON','TEXTAREA'].includes(e.target.tagName)){e.preventDefault();$('pause').click();}});
}
window.addEventListener('pagehide',()=>stage?.dispose());
void init();
