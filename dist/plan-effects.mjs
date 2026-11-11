import {plannerSpell} from './planner-spell.mjs?v=filled-tells-1';
import {EffectStore,spellKey,EFFECTS} from './elemental-presets.mjs';
export function mountPlanEffects(host,sequence,options={},hooks={}){
 const key=spellKey(sequence,options);let disposed=false,dialog=null;
 host.innerHTML='<div class="effect-summary"><div><h3>마법 효과</h3><p data-effect-summary></p></div><button type="button" data-edit-effect>효과 만들기·조절</button></div>';
 const summary=host.querySelector('[data-effect-summary]'),button=host.querySelector('[data-edit-effect]');
 function refresh(){try{const saved=new EffectStore(localStorage).read(key);summary.textContent=saved?`${EFFECTS[saved.effect]} · 이 브라우저에 저장됨`:'얼음·번개·운석 등 6가지 효과';}catch{summary.textContent='저장한 효과를 읽지 못했습니다. 편집기에서 효과 파일을 불러와 주세요.';}}
 function close(){if(!dialog)return;dialog.querySelector('iframe').src='about:blank';dialog.close();dialog.remove();dialog=null;refresh();if(!disposed){hooks.onClose?.();button.focus();}}
 button.onclick=()=>{
  if(dialog)return;hooks.onOpen?.();dialog=document.createElement('dialog');dialog.className='elemental-dialog';dialog.setAttribute('aria-label','마법 효과 편집');
  const bar=document.createElement('div');bar.className='elemental-dialog-bar';const title=document.createElement('span');title.textContent='마법 효과 편집';const done=document.createElement('button');done.textContent='편집 닫기';done.onclick=close;bar.append(title,done);
  const iframe=document.createElement('iframe');iframe.title='엘레멘탈 샌드박스 효과 편집기';iframe.src=`elemental-editor.html?${new URLSearchParams({seq:sequence,name:plannerSpell(sequence,options).name,hand:options.hand||'left',charged:options.charged?'1':'0'})}`;
  dialog.append(bar,iframe);dialog.addEventListener('cancel',e=>{e.preventDefault();close();});document.body.append(dialog);dialog.showModal();done.focus();
 };
 const message=e=>{if(e.origin!==location.origin||!dialog||e.source!==dialog.querySelector('iframe').contentWindow)return;if(e.data?.type==='mage-elemental-saved'&&e.data.key===key)refresh();if(e.data?.type==='mage-elemental-close')close();};
 window.addEventListener('message',message);refresh();
 return()=>{disposed=true;close();window.removeEventListener('message',message);};
}
