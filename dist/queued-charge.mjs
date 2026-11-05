import {RING_SECONDS} from './spells.mjs';
export class QueuedCharge {
 constructor(){this.clear();}
 clear(){this.queue=[];this.parts=[];this.held=[];this.active=false;this.progress=0;this.elapsed=0;}
 enqueue(key){if(this.active||!['q','w','e'].includes(key)||this.queue.length>=3)return false;this.queue.push(key);return true;}
 begin(){if(this.active||!this.queue.length)return false;this.active=true;this.parts=[this.queue[0]];this.held=['mouse'];this.elapsed=0;this.progress=0;return true;}
 tick(dt){if(!this.active)return;this.elapsed=Math.min(this.queue.length*RING_SECONDS,this.elapsed+Math.max(0,dt));const index=Math.min(this.queue.length-1,Math.floor(this.elapsed/RING_SECONDS));this.parts=this.queue.slice(0,index+1);this.progress=Math.min(1,(this.elapsed-index*RING_SECONDS)/RING_SECONDS);}
 disrupt(seconds){if(!this.active||seconds<=0)return 0;const before=this.elapsed;this.elapsed=Math.max(0,this.elapsed-seconds);this.tick(0);return before-this.elapsed;}
 next(){return this.queue[Math.min(this.parts.length,this.queue.length-1)];}
 release(){if(!this.active)return null;const count=Math.max(1,Math.min(this.queue.length,Math.floor((this.elapsed+1e-8)/RING_SECONDS))),result={parts:this.queue.slice(0,count),progress:1,tap:this.elapsed<.15,complete:true};this.clear();return result;}
}
