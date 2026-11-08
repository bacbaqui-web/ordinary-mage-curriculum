import {GameAudio} from './game-audio.mjs?v=clear3';

const audio=new GameAudio();
// Preview controls are independent from the game's saved mute setting.
audio.enabled=true;
let enabled=true;
const unlock=()=>{if(enabled)void audio.unlock();};
window.addEventListener('pointerdown',unlock,{capture:true});
window.addEventListener('keydown',unlock,{capture:true});
window.addEventListener('pagehide',()=>audio.stopAll());
window.addEventListener('blur',()=>{audio.focused=false;audio.stopAll();});
window.addEventListener('focus',()=>{audio.focused=true;});
document.addEventListener('visibilitychange',()=>{if(document.hidden)audio.stopAll();});

export function mountPlanAudio(container,sequence){
 container.innerHTML='<div class="sound-actions"><button type="button" data-preview-sound></button><a href="sound-check.html" target="_blank" rel="noopener">전체 효과음 듣기 ↗</a></div><p data-sound-status role="status"></p>';
 const button=container.querySelector('[data-preview-sound]'),status=container.querySelector('[data-sound-status]');
 let disposed=false;
 function label(){button.textContent=enabled?'미리보기 소리 끄기':'미리보기 소리 켜기';button.setAttribute('aria-pressed',String(enabled));}
 function message(){
  const text=!enabled?'미리보기 소리를 껐습니다.':!audio.available?'이 브라우저에서는 소리를 재생할 수 없습니다.':audio.failures.length&&audio.buffers.size<14?'효과음을 불러오지 못했습니다. 다시 시전을 눌러 재시도해 주세요.':audio.context?.state==='running'&&audio.buffers.size===14?'충전·시전·명중 소리가 미리보기와 함께 재생됩니다.':'마법을 선택하거나 다시 시전을 누르면 소리도 함께 재생됩니다.';
  if(status.textContent!==text)status.textContent=text;
 }
 button.onclick=()=>{enabled=!enabled;audio.enabled=enabled;if(enabled)unlock();else audio.stopAll();label();message();};
 label();message();
 return {
  prepare(){return enabled?audio.unlock():Promise.resolve();},
  update({active,charging,stage}){if(disposed)return;audio.update({active:active&&enabled,charging,stage});message();},
  cast(caster){if(!disposed)audio.cast(sequence,caster,caster);},
  hit(target,caster){if(!disposed)audio.hit(target,caster);},
  stop(){audio.stopAll();},
  dispose(){disposed=true;audio.stopAll();}
 };
}
