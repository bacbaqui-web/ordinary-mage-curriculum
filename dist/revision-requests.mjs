const TOKEN='mage-request-key-v1',DRAFT='mage-request-draft-v1-';
const endpoint=location.hostname==='bacbaqui-web.github.io'?'https://radio.magamiscom.ing/mage/api/revision-requests':new URL('./api/revision-requests',location.href).href;
export class RevisionRequests {
 constructor(){
  this.items=new Map();this.drafts=new Map();this.listeners=new Set();this.chain=Promise.resolve();this.loaded=false;this.error='';this.notebook='';
  try{this.token=localStorage.getItem(TOKEN);if(!/^[a-f0-9]{64}$/.test(this.token||'')){this.token=Array.from(crypto.getRandomValues(new Uint8Array(32)),x=>x.toString(16).padStart(2,'0')).join('');localStorage.setItem(TOKEN,this.token);}}
  catch{this.token=null;this.error='브라우저 저장소를 사용할 수 없습니다. 저장소 사용을 허용한 뒤 새로고침해 주세요.';}
 }
 async api(suffix='',options={}){
  if(!this.token)throw Error(this.error);
  let response;try{response=await fetch(endpoint+suffix,{...options,headers:{Authorization:'Bearer '+this.token,'Content-Type':'application/json',...options.headers},signal:AbortSignal.timeout(12000)});}catch(e){throw Error(e.name==='TimeoutError'?'서버 연결이 늦어지고 있습니다. 잠시 후 다시 저장해 주세요.':'서버에 연결하지 못했습니다. 연결을 확인한 뒤 다시 저장해 주세요.');}
  let data;try{data=await response.json();}catch{throw Error('저장 서버에 연결하지 못했습니다. 잠시 후 다시 저장해 주세요.');}
  if(!response.ok){const error=Error(data.error||'서버에 저장하지 못했습니다. 다시 저장해 주세요.');error.status=response.status;throw error;}return data;
 }
 notify(){for(const fn of this.listeners)fn();}
 async load(){try{const data=await this.api();for(const item of data.items){if((this.items.get(item.sequence)?.version||0)<=item.version)this.items.set(item.sequence,item);}this.notebook=data.notebook;this.loaded=true;this.error='';}catch(e){this.error=e.name==='TimeoutError'?'서버 연결이 늦어지고 있습니다. 잠시 후 다시 저장해 주세요.':e.message;}this.notify();}
 draft(seq){if(this.drafts.has(seq))return this.drafts.get(seq);try{const value=localStorage.getItem(DRAFT+seq);if(value!==null){this.drafts.set(seq,value);return value;}}catch{}return this.items.get(seq)?.text||'';}
 edit(seq,text){this.drafts.set(seq,text);try{localStorage.setItem(DRAFT+seq,text);}catch{}this.notify();}
 save(seq,text){
  const task=this.chain.catch(()=>{}).then(async()=>{
   if(!this.loaded){await this.load();if(!this.loaded)throw Error(this.error);}
   const old=this.items.get(seq);if((old?.text||'')===text.trim()){this.clearDraft(seq,text);return old;}
   const {item}=await this.api('/'+seq,{method:'PUT',keepalive:true,body:JSON.stringify({text,version:old?.version||0})});this.items.set(seq,item);this.clearDraft(seq,text);this.notify();return item;
  });this.chain=task;return task;
 }
 clearDraft(seq,text){if(this.drafts.get(seq)===text){this.drafts.delete(seq);try{localStorage.removeItem(DRAFT+seq);}catch{}}}
 mount(host,sequence){
  host.innerHTML='<h3>수정 요청</h3><p class="request-help">이 마법에서 바꿀 내용을 적어 주세요. 작성 후 자동 저장됩니다.</p><label for="spellRequest">요청 내용</label><textarea id="spellRequest" rows="5" maxlength="2000" placeholder="예: 불꽃이 퍼지는 범위를 좁히고, 터지는 소리를 더 짧게 해 주세요."></textarea><div class="request-actions"><button type="button" data-save-request>지금 저장</button><button type="button" data-reload-request>초안 버리고 서버 내용 불러오기</button><small data-request-count></small></div><p data-request-status role="status"></p><small class="request-help">저장 후 채팅에서 ‘수정 요청 확인해줘’라고 말씀해 주세요. 이 브라우저에서 이어서 작성할 수 있습니다.</small>';
  const input=host.querySelector('textarea'),status=host.querySelector('[data-request-status]'),counter=host.querySelector('[data-request-count]');let timer,disposed=false,changed=false,saving=false,conflict=false;
  const tell=text=>{if(!disposed)status.textContent=text;};
  const refresh=()=>{if(disposed)return;if(!changed)input.value=this.draft(sequence);counter.textContent=input.value.length+' / 2,000';if(!changed&&!saving){const item=this.items.get(sequence);tell(this.error||((this.drafts.has(sequence))?'이 브라우저에 초안이 있습니다. 지금 저장을 누르면 서버에 저장합니다.':item?'서버에 저장됨 · '+new Date(item.updatedAt).toLocaleString('ko-KR'):'아직 작성한 요청이 없습니다.'));}};
  const save=async()=>{clearTimeout(timer);if(conflict)return;const text=input.value;saving=true;tell('서버에 저장하는 중입니다.');try{await this.save(sequence,text);if(input.value===text){changed=false;tell('서버에 저장했습니다.');}}catch(e){conflict=e.status===409;tell(e.message+' 초안은 이 브라우저에 남아 있습니다.');}finally{saving=false;}};
  input.oninput=()=>{changed=true;this.edit(sequence,input.value);counter.textContent=input.value.length+' / 2,000';tell(conflict?'다른 창의 변경 내용과 충돌했습니다. 서버 내용을 확인해 주세요.':'초안 보관됨 · 잠시 후 서버에 저장합니다.');clearTimeout(timer);if(!conflict)timer=setTimeout(save,900);};
  host.querySelector('[data-save-request]').onclick=save;
  host.querySelector('[data-reload-request]').onclick=async()=>{clearTimeout(timer);await this.chain.catch(()=>{});await this.load();if(!this.loaded||this.error){tell(this.error);return;}this.drafts.delete(sequence);try{localStorage.removeItem(DRAFT+sequence);}catch{}changed=false;conflict=false;refresh();};
  this.listeners.add(refresh);refresh();
  const flush=()=>{if(changed&&!conflict)void save();};window.addEventListener('pagehide',flush);
  return()=>{clearTimeout(timer);flush();disposed=true;this.listeners.delete(refresh);window.removeEventListener('pagehide',flush);};
 }
}
