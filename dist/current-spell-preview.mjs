import {mountAtlasPreview} from './atlas-preview.mjs?v=current-skill-1';
import {spellKey} from './elemental-presets.mjs';
const params=new URLSearchParams(location.search),sequence=params.get('seq'),options={hand:params.get('hand')==='right'?'right':'left',charged:params.get('charged')==='1'};
let dispose=()=>{},last=-Infinity,ready=false;
const send=(type,payload={})=>parent.postMessage({type,...payload},location.origin);
function fail(message){document.getElementById('error').hidden=false;document.getElementById('error').textContent=message;send('mage-current-error',{message});}
try{
 spellKey(sequence,options);
 dispose=mountAtlasPreview(document.getElementById('preview'),sequence,{}, {...options,fill:true,onError:fail,onFrame(state){
  if(!ready){ready=true;send('mage-current-ready',state);}
  const now=performance.now();if(now-last>=80){last=now;send('mage-current-frame',state);}
 }});
}catch(error){console.error(error);fail('현재 스킬을 불러오지 못했습니다. 편집기를 닫고 다시 열어 주세요.');}
window.addEventListener('message',e=>{
 if(e.origin!==location.origin||e.source!==parent||e.data?.type!=='mage-current-control')return;
 dispose.control?.(e.data.action,e.data.value);last=-Infinity;
});
window.addEventListener('pagehide',()=>dispose());
document.addEventListener('keydown',e=>{if(e.key==='Escape')send('mage-current-close');});
