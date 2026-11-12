// Keep the game's Three.js instance and global combat camera isolated from the sandbox renderer.
export class CurrentSpellStage {
 constructor(host,sequence,options={}){
  this.elapsed=0;this._paused=false;this._speed=1;this._repeat=true;this.disposed=false;
  this.iframe=document.createElement('iframe');this.iframe.title='현재 스킬의 실제 시전 미리보기';
  this.iframe.src=`current-spell-preview.html?${new URLSearchParams({seq:sequence,hand:options.hand||'left',charged:options.charged?'1':'0'})}`;
  this.ready=new Promise((resolve,reject)=>{this.resolve=resolve;this.reject=reject;});
  this.timer=setTimeout(()=>this.reject(new Error('현재 스킬을 불러오지 못했습니다. 편집기를 다시 열어 주세요.')),20000);
  this.message=e=>{
   if(this.disposed||e.origin!==location.origin||e.source!==this.iframe.contentWindow)return;
   if(e.data?.type==='mage-current-error'){clearTimeout(this.timer);this.reject(new Error(e.data.message));this.onError?.(new Error(e.data.message));}
   if(e.data?.type==='mage-current-close')parent.postMessage({type:'mage-elemental-close'},location.origin);
   if(!['mage-current-ready','mage-current-frame'].includes(e.data?.type))return;
   this.elapsed=e.data.elapsed;this._paused=e.data.paused;this.castStarted=e.data.cast;this.health=e.data.health;this.charge=e.data.charge;
   if(e.data.type==='mage-current-ready'){clearTimeout(this.timer);this.resolve(this);}
   this.onFrame?.();
  };
  window.addEventListener('message',this.message);host.append(this.iframe);
 }
 command(action,value){this.iframe.contentWindow?.postMessage({type:'mage-current-control',action,value},location.origin);}
 get paused(){return this._paused;}set paused(v){this._paused=!!v;this.command('pause',this._paused);}
 get speed(){return this._speed;}set speed(v){this._speed=v;this.command('speed',v);}
 get repeat(){return this._repeat;}set repeat(v){this._repeat=v;this.command('repeat',v);}
 cast(){this.command('restart');}step(){this._paused=true;this.command('step');}freeze(){this._paused=true;this.command('freeze');}home(){this.command('view');}
 dispose(){if(this.disposed)return;this.disposed=true;clearTimeout(this.timer);this.reject(new Error('Preview closed'));window.removeEventListener('message',this.message);this.iframe.src='about:blank';this.iframe.remove();}
}
