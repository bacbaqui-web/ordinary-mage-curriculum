import {GameAudio} from './game-audio.mjs?v=sound1';

const audio=new GameAudio();
// Listening here is explicit and does not change the game's saved mute setting.
audio.enabled=true;
let request=0;
function stop(){request++;audio.stopAll();}
window.addEventListener('pagehide',stop);
window.addEventListener('blur',stop);
document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});

export function mountPlanAudio(container,sequence){
 container.innerHTML='<div class="sound-actions"><button type="button" data-listen>마법 소리 듣기</button><button type="button" data-stop>소리 멈추기</button><a href="sound-check.html" target="_blank" rel="noopener">전체 효과음 듣기 ↗</a></div><p data-sound-status role="status">게임에서 사용하는 시전 소리입니다.</p>';
 const listen=container.querySelector('[data-listen]'),status=container.querySelector('[data-sound-status]');
 listen.onclick=async()=>{
  stop();const token=request;listen.disabled=true;status.textContent='소리를 불러오는 중입니다.';
  await audio.unlock();
  listen.disabled=false;
  if(token!==request)return;
  if(!audio.available||audio.context?.state!=='running'){status.textContent='소리를 재생할 수 없습니다. 브라우저의 소리 차단 설정을 확인하고 다시 눌러 주세요.';return;}
  if(audio.buffers.size!==14){status.textContent='효과음 파일을 불러오지 못했습니다. 잠시 후 다시 눌러 주세요.';return;}
  audio.cast(sequence,{x:0,z:0},{x:0,z:0});status.textContent='선택한 마법의 소리를 재생했습니다.';
 };
 container.querySelector('[data-stop]').onclick=()=>{stop();status.textContent='소리를 멈췄습니다.';};
 return stop;
}
