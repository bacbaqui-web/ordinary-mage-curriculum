const RUNE_SOUND={q:'fire',i:'ice',l:'lightning',d:'earth',p:'poison',e:'barrier',t:'field',w:'push',g:'pull',s:'slash',h:'strike'};
const IDS=[...Object.values(RUNE_SOUND),'hit','roll','charge'];
export class GameAudio {
 constructor(){
  this.buffers=new Map();this.voices=new Set();this.last=new Map();this.counts={};this.failures=[];this.enabled=true;this.available=true;this.suspended=false;this.focused=true;
  try{this.enabled=localStorage.getItem('mage-sound-enabled')!=='false';}catch{}
 }
 async unlock(){
  if(!this.enabled||!this.available)return;
  try{
   if(!this.context){
    const Audio=globalThis.AudioContext||globalThis.webkitAudioContext;
    if(!Audio){this.available=false;return;}
    this.context=new Audio();this.master=this.context.createGain();this.master.gain.value=.42;
    this.compressor=this.context.createDynamicsCompressor();this.compressor.threshold.value=-12;this.compressor.ratio.value=5;
    this.analyser=this.context.createAnalyser();this.analyser.fftSize=256;
    this.master.connect(this.compressor);this.compressor.connect(this.analyser);this.analyser.connect(this.context.destination);
   }
   // Resume is invoked synchronously from a user gesture, before fetching files.
   const resumed=this.context.resume();
   if(!this.loading)this.loading=this.load();
   await resumed;await this.loading;
  }catch(error){this.failures.push(String(error));}
 }
 async load(){
  await Promise.all(IDS.map(async id=>{
   if(this.buffers.has(id))return;
   try{const r=await fetch(new URL(`./audio/${id}.wav?v=fantasy2`,import.meta.url));if(!r.ok)throw Error(`${id}: HTTP ${r.status}`);this.buffers.set(id,await this.context.decodeAudioData(await r.arrayBuffer()));}
   catch(error){this.failures.push(String(error));}
  }));
  // A later gesture can retry transient load failures without affecting gameplay.
  if(this.buffers.size<IDS.length)this.loading=null;
 }
 setEnabled(value){this.enabled=value;try{localStorage.setItem('mage-sound-enabled',String(value));}catch{}if(!value)this.stopAll();else void this.unlock();}
 play(id,{volume=1,rate=1,pan=0,loop=false,throttle=60}={}){
  const c=this.context,b=this.buffers.get(id);
  if(!this.enabled||this.suspended||!b||c?.state!=='running'||this.voices.size>=12)return null;
  const now=c.currentTime;if(!loop&&now-(this.last.get(id)??-100)<throttle/1000)return null;this.last.set(id,now);
  const source=c.createBufferSource(),gain=c.createGain(),panner=c.createStereoPanner();source.buffer=b;source.loop=loop;source.playbackRate.value=rate;
  gain.gain.setValueAtTime(0,now);gain.gain.linearRampToValueAtTime(volume,now+.012);panner.pan.value=Math.max(-.8,Math.min(.8,pan));
  source.connect(gain);gain.connect(panner);panner.connect(this.master);
  const voice={source,gain,panner,id};this.voices.add(voice);
  source.onended=()=>{this.voices.delete(voice);source.disconnect();gain.disconnect();panner.disconnect();};
  source.start();this.counts[id]=(this.counts[id]||0)+1;return voice;
 }
 stop(voice){if(!voice||voice.stopping)return;voice.stopping=true;const now=this.context.currentTime;voice.gain.gain.cancelScheduledValues(now);voice.gain.gain.setTargetAtTime(0,now,.018);voice.source.stop(now+.08);}
 stopAll(){for(const v of this.voices)this.stop(v);this.chargeVoice=null;}
 spatial(actor,listener){const dx=actor.x-listener.x,dz=actor.z-listener.z,d=Math.hypot(dx,dz);return{volume:Math.max(0,1-d/24),pan:(dx-dz)/18};}
 cast(sequence,actor,listener){
  const spatial=this.spatial(actor,listener);if(spatial.volume<.02)return;
  const first=RUNE_SOUND[sequence[0]],last=RUNE_SOUND[sequence.at(-1)],tier=sequence.length;
  this.play(first,{...spatial,volume:spatial.volume*(.68+tier*.1),rate:1-(tier-1)*.055});
  if(tier>1&&last!==first)this.play(last,{...spatial,volume:spatial.volume*.32,rate:1.08});
 }
 hit(actor,listener,blocked=false){const spatial=this.spatial(actor,listener);this.play(blocked?'barrier':'hit',{...spatial,volume:spatial.volume*(blocked?.45:.65),throttle:100});}
 update({active,charging,stage=1,rolling=false}){
  this.suspended=!active||document.hidden||!this.focused;
  if(this.suspended){this.stopAll();this.wasRolling=false;return;}
  if(rolling&&!this.wasRolling)this.play('roll',{volume:.55});this.wasRolling=rolling;
  if(charging&&this.enabled){
   if(!this.chargeVoice)this.chargeVoice=this.play('charge',{volume:.22,loop:true,rate:.95});
   if(this.chargeVoice){this.chargeVoice.source.playbackRate.setTargetAtTime(.95+(stage-1)*.09,this.context.currentTime,.12);}
  }else if(this.chargeVoice){this.stop(this.chargeVoice);this.chargeVoice=null;}
 }
 stats(){let rms=0;if(this.analyser){const a=new Float32Array(this.analyser.fftSize);this.analyser.getFloatTimeDomainData(a);rms=Math.sqrt(a.reduce((n,x)=>n+x*x,0)/a.length);}return{enabled:this.enabled,available:this.available,state:this.context?.state||'locked',loaded:this.buffers.size,voices:this.voices.size,charging:!!this.chargeVoice,counts:{...this.counts},failures:[...this.failures],rms};}
}
