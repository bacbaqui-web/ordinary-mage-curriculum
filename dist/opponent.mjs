import {Charge,RING_SECONDS,resolveSpell} from './spells.mjs';
import {KEYS,RUNES} from './loadout.mjs';
export function chooseLoadout(random=Math.random){const pool=Object.keys(RUNES);for(let i=pool.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]];}return Object.fromEntries(KEYS.map((k,i)=>[k,pool[i]]));}
export function choosePlan(loadout,attack,hp,distance,random=Math.random){const attacks=KEYS.filter(k=>loadout[k]!=='e'),ward=KEYS.find(k=>loadout[k]==='e');const length=[3,2,1][attack%3];let first=attacks[Math.floor(random()*attacks.length)];if(ward&&hp<65&&attack%4===3)first=ward;const plan=[first];for(let i=1;i<length;i++)plan.push(KEYS[Math.floor(random()*KEYS.length)]);return plan;}
// Feed planned key presses to the exact same charging engine as the player.
export class OpponentCharge{
 constructor(){this.charge=new Charge();this.clear()}
 clear(){this.charge.clear();this.plan=[];this.elapsed=0;}
 start(plan){this.clear();if(plan.length<1||plan.length>3||plan.some(k=>!KEYS.includes(k)))throw Error('잘못된 상대 주문');this.plan=[...plan];this.charge.down(plan[0]);}
 get active(){return this.charge.active}
 get remaining(){return Math.max(0,this.plan.length*RING_SECONDS-this.elapsed)}
 tick(dt,loadout){if(!this.active)return null;let budget=Math.min(dt,this.remaining);while(budget>1e-9){const c=this.charge;c.held=[this.plan[Math.min(c.parts.length,this.plan.length-1)]];const step=Math.min(budget,Math.max(1e-8,(1-c.progress)*RING_SECONDS));c.tick(step+1e-12);this.elapsed+=step;budget-=step;}
 if(this.remaining>1e-8)return null;const result=this.charge.up(this.charge.held[0]);this.plan=[];return resolveSpell(result,loadout);}
}
