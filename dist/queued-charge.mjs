import {RING_SECONDS} from './spells.mjs';
export class QueuedCharge {
 constructor(){this.clear();}
 clear(){this.pending=null;this.queue=[];this.parts=[];this.held=[];this.active=false;this.progress=0;this.elapsed=0;}
 enqueue(key){if(this.active||!['q','w','e'].includes(key)||this.queue.length>=3)return false;this.queue.push(key);return true;}
 extend(keys){if(!this.active||!Array.isArray(keys)||keys.some(k=>!['q','w','e'].includes(k)))return false;const additions=keys.filter((k,i)=>!this.queue.includes(k)&&keys.indexOf(k)===i);if(this.queue.length+additions.length>3)return false;this.queue.push(...additions);this.tick(0);return true;}
 begin(){if(this.active||!this.queue.length)return false;this.active=true;this.parts=[this.queue[0]];this.held=['mouse'];this.elapsed=0;this.progress=0;return true;}
 tick(dt){if(!this.active)return;if(this.pending){this.pending.time+=Math.max(0,dt);return;}this.elapsed=Math.min(this.queue.length*RING_SECONDS,this.elapsed+Math.max(0,dt));const index=Math.min(this.queue.length-1,Math.floor(this.elapsed/RING_SECONDS));this.parts=this.queue.slice(0,index+1);this.progress=Math.min(1,(this.elapsed-index*RING_SECONDS)/RING_SECONDS);}
 disrupt(seconds){if(this.pending)return 0;if(!this.active||seconds<=0)return 0;const before=this.elapsed;this.elapsed=Math.max(0,this.elapsed-seconds);this.tick(0);return before-this.elapsed;}
 requestRelease(){
  if(this.pending)return null;
  const elapsed=this.elapsed,result=this.release();if(!result||result.parts.length>1)return result;
  this.active=true;this.queue=[...result.parts];this.parts=[...result.parts];this.elapsed=elapsed;
  this.pending={result:{...result,timed:true},time:0,chargeRemaining:Math.max(0,2/12-elapsed)};return null;
 }
 get releasePose(){return !!this.pending&&this.pending.time+1e-8>=this.pending.chargeRemaining;}
 takeRelease(){if(!this.pending||this.pending.time+1e-8<this.pending.chargeRemaining+2/12)return null;const result=this.pending.result;this.clear();return result;}
 next(){return this.queue[Math.min(this.parts.length,this.queue.length-1)];}
 release(){if(!this.active)return null;const count=Math.max(1,Math.min(this.queue.length,Math.floor((this.elapsed+1e-8)/RING_SECONDS))),result={parts:this.queue.slice(0,count),progress:1,tap:count===1,completedRings:Math.min(this.queue.length,Math.floor((this.elapsed+1e-8)/RING_SECONDS)),complete:true};this.clear();return result;}
}
