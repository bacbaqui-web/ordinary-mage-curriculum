import {wardTouches} from './combat-hit.mjs?v=smooth-motion-1';
import {ICE_BASIC} from './ice-basic.mjs?v=charge-step-1';
import * as T from './three.module.js';
import {LiveMagic} from './live-magic.mjs?v=smooth-motion-1';
import {QueuedCharge} from './queued-charge.mjs?v=charge-step-1';
import {SpaceSkill,interceptSpaceShots} from './space-skills.mjs?v=smooth-motion-1';
import {ForcedMotion} from './motion.mjs';
import {CastRecoil,chargeSetback} from './combat-response.mjs';
import {chargeMoveScale} from './magic-motion.mjs';
import {resolveSpell} from './live-charge-spells.mjs?v=charge-step-1';
import {validLoadout} from './live-loadout.mjs?v=bolt17';
import {fireSpec,hasFireRecipe} from './fire-spec.mjs?v=bolt17';
import {advanceMovingWard} from './moving-ward.mjs';
import {crossesWard,distanceToWard} from './forces.mjs';
import {arenaCollision} from './arena-rules.mjs';

export const STEP=1/30, PROTOCOL=3;
const V=(x,z)=>new T.Vector3(x,0,z);
const numeric=['x','z','hp','mana','shield','shieldTime','cool','iceLeftCool','iceRightCool','iceCastLock','slow','frostSlow','burn','burnTick','burnDamage','poison','poisonTick','poisonDamage','wet','ashTime','greenFireTime','dustTime'];
const motionKeys=['elapsed','duration','x','z','distance'];
const recoilKeys=['elapsed','duration','delay','x','z','distance'];
const pick=(o,keys)=>Object.fromEntries(keys.map(k=>[k,o[k]||0]));
const point=p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.z)&&Math.abs(p.x)<=100&&Math.abs(p.z)<=100;
export function validInput(input){return !!input&&['aim','move','ice-basic','queue','extend','begin','release','roll','cancel','stop'].includes(input.action)&&(!input.point||point(input.point))&&(!['aim','move','begin','release','roll'].includes(input.action)||point(input.point))&&(input.action!=='ice-basic'||['left','right'].includes(input.hand)&&point(input.point))&&(input.action!=='extend'||Array.isArray(input.keys)&&input.keys.length<=3&&input.keys.every(k=>['q','w','e'].includes(k)))&&(input.action!=='queue'||['q','w','e'].includes(input.key));}

// Runs at a fixed rate on the server. Browsers replay accepted inputs for effects,
// then correct to the server snapshot; they never submit positions or damage.
export class Duel {
 constructor(loadouts,{scene=new T.Scene(),vfx={particle(){},pulse(){}},onCast=()=>{},onHit=()=>{}}={}){
  if(loadouts.length!==2||!loadouts.every(validLoadout))throw Error('마법 배치가 올바르지 않습니다.');
  this.scene=scene;this.onCast=onCast;this.onHit=onHit;this.time=0;this.tick=0;this.finished=false;this.winner=null;this.wards=[];
  this.actors=loadouts.map((loadout,id)=>({id,loadout:{...loadout},x:id?5:-5,z:id?-4:4,hp:100,mana:100,shield:0,shieldTime:0,cool:0,dir:V(id?-1:1,id?1:-1).normalize(),aim:V(id?-5:5,id?4:-4),target:null,charge:new QueuedCharge(),roll:new SpaceSkill(loadout.q),motion:new ForcedMotion(),recoil:new CastRecoil(),slow:0,frostSlow:0,burn:0,poison:0,wet:0}));
  this.magic=new LiveMagic({scene,vfx,remove:m=>this.remove(m),targets:a=>this.actors.filter(b=>b!==a),hit:(...args)=>this.hit(...args),applyPayload:(...args)=>this.payload(...args),clearPath:(a,b)=>this.clearPath(a,b),collides:arenaCollision,wallBlocks:(a,b)=>this.wallBlocks(a,b),wards:this.wards});
 }
 remove(m){m.removeFromParent();m.traverse(o=>{o.geometry?.dispose();for(const material of Array.isArray(o.material)?o.material:[o.material])material?.dispose();});}
 wallBlocks(a,b){return this.wards.some(w=>w.hp>0&&w.life>0&&crossesWard(a,b,w,.5)&&distanceToWard(b,w)<=distanceToWard(a,w)+.001);}
 clearPath(a,b){if(this.wards.some(w=>w.hp>0&&w.life>0&&crossesWard(a,b,w,.05)))return false;const d=V(b.x-a.x,b.z-a.z),length=d.length();d.normalize();for(let t=.2;t<length;t+=.2)if(arenaCollision(a.x+d.x*t,a.z+d.z*t,.02))return false;return true;}
 move(a,dx,dz){const steps=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.06));for(let i=0;i<steps;i++){const x=a.x+dx/steps,z=a.z+dz/steps;if(!arenaCollision(x,a.z)&&!this.wallBlocks(a,{x,z:a.z}))a.x=x;if(!arenaCollision(a.x,z)&&!this.wallBlocks(a,{x:a.x,z}))a.z=z;}}
 input(id,input){
  if(this.finished||!validInput(input)||!this.actors[id])return false;
  const a=this.actors[id],c=a.charge;
  if(input.point){a.aim.set(input.point.x,0,input.point.z);const d=a.aim.clone().sub(V(a.x,a.z));if(d.length()>.1)a.dir.copy(d.normalize());}
  switch(input.action){
   case 'ice-basic':{const key=input.hand==='left'?'iceLeftCool':'iceRightCool';if(a.loadout.q!=='i'||a.roll.active||a.cool>0||(a[key]||0)>0)break;const spec=ICE_BASIC[input.hand];if(a.mana<spec.cost)break;a.mana-=spec.cost;a[key]=spec.cooldown;const spell={sequence:'i',parts:['q'],keys:'q',name:spec.name,power:1,iceHand:input.hand};this.magic.cast(spell,a,a.dir.clone(),a.aim.clone());this.onCast(spell,a);break;}
   case 'move':a.target={x:input.point.x,z:input.point.z};break;
   case 'queue':c.enqueue(input.key);break;
   case 'extend':c.extend(input.keys);break;
   case 'begin':if(c.begin())a.iceHand=input.hand==='right'?'right':'left';break;
   case 'cancel':c.clear();break;
   case 'stop':c.clear();a.target=null;break;
   case 'roll':if(!(a.iceCastLock>0)&&!a.recoil.active&&!a.motion.active&&a.roll.start(a.dir.x,a.dir.z,a,a.loadout.q,a.aim)){a.motion.clear();a.target=null;}break;
   case 'release':{if(a.roll.active){a.roll.pendingRelease=true;break;}const result=c.release();if(!result||a.cool>0)break;if(a.loadout.q==='i'&&result.parts.length===1){const hand=a.iceHand||'left',key=hand==='left'?'iceLeftCool':'iceRightCool',spec=ICE_BASIC[hand];if(a.roll.active||(a[key]||0)>0||a.mana<spec.cost)break;a.mana-=spec.cost;a[key]=spec.cooldown;const spell={...resolveSpell(result,a.loadout),name:spec.name,iceHand:hand,cost:spec.cost};this.magic.cast(spell,a,a.dir.clone(),a.aim.clone());this.onCast(spell,a);break;}const s=resolveSpell(result,a.loadout);if(a.mana<s.cost)break;a.mana-=s.cost;a.cool=s.tap?.16:.38;a.target=null;a.recoil.start(a.dir,s.sequence.length,hasFireRecipe(s.sequence)&&fireSpec(s.sequence).op==='h'?fireSpec(s.sequence).dashDuration:0);
    // A stable emission point prevents skeleton animation from changing hit range.
    const emission=V(a.x,a.z).addScaledVector(a.dir,.5);if(!this.clearPath(a,emission))emission.set(a.x,0,a.z);
    this.magic.cast(s,a,a.dir.clone(),a.aim.clone(),emission);this.onCast(s,a);break;}
  }return true;
 }
 hit(a,damage,dir,force=0,source=null){if(this.finished||a.roll.invulnerable)return false;const guarded=a.roll.guard(damage,force,dir,source,a);if(guarded.blocked)return false;damage=guarded.damage;force=guarded.force;const blocked=Math.min(a.shield,damage);a.shield-=blocked;damage-=blocked;a.hp=Math.max(0,a.hp-damage);a.charge.disrupt(chargeSetback(damage));if(force)a.motion.start(dir.x,dir.z,force);this.onHit(a,damage,dir);if(a.hp<=0){this.finished=true;this.winner=source?.id??1-a.id;for(const actor of this.actors){actor.charge.clear();actor.target=null;}}return true;}
 payload(a,p,source){if(!p||this.finished)return;if(p.slow)a.slow=Math.max(a.slow||0,p.slow);if(p.frostSlow)a.frostSlow=Math.max(a.frostSlow||0,p.frostSlow);if(p.burn){if(!(a.burn>0))a.burnTick=.5;a.burn=Math.max(a.burn||0,p.burn);a.burnOwner=source;a.burnDamage=p.burnDamage||2;}if(p.ash)a.ashTime=Math.max(a.ashTime||0,p.ash);if(p.greenFire)a.greenFireTime=Math.max(a.greenFireTime||0,p.greenFire);if(p.dust)a.dustTime=Math.max(a.dustTime||0,p.dust);if(p.echo&&!a.echo)a.echo={time:.25,damage:p.echo,owner:source};}
 statuses(dt){for(const a of this.actors){for(const key of ['slow','frostSlow','wet','ashTime','greenFireTime','dustTime'])a[key]=Math.max(0,(a[key]||0)-dt);for(const status of ['burn','poison'])if(a[status]>0){a[status]-=dt;a[status+'Tick']-=dt;if(a[status+'Tick']<=0){a[status+'Tick']=.5;this.hit(a,a[status+'Damage']||2,V(0,0),0,a[status+'Owner']);}}if(a.echo){a.echo.time-=dt;if(a.echo.time<=0){const e=a.echo;a.echo=null;this.hit(a,e.damage,V(0,0),0,e.owner);}}}}
 updateWards(dt){for(let i=this.wards.length-1;i>=0;i--){const w=this.wards[i];advanceMovingWard(w,dt,{actors:this.actors,collides:arenaCollision,wards:this.wards});w.m.position.set(w.x,1.2,w.z);w.life-=dt;w.effectCooldown-=dt;if(w.hp>0&&w.life>0&&w.effectCooldown<=0){w.effectCooldown=.8;for(const a of this.actors.filter(a=>a!==w.owner&&wardTouches(a,w))){const p=w.spec,side=(a.x-w.x)*w.nx+(a.z-w.z)*w.nz>=0?1:-1,d=V(w.nx*side,w.nz*side);if((p.burn||p.slow||p.shock||p.push||p.pull)&&this.hit(a,p.shock||0,d,0,w.owner)){this.payload(a,p,w.owner);if(p.push||p.pull)a.motion.start(d.x,d.z,p.push||-p.pull);}}}if(w.life<=0||w.hp<=0){this.remove(w.m);this.wards.splice(i,1);}}}
 step(dt=STEP){if(this.finished)return;this.tick++;this.time+=dt;
  for(const a of this.actors){const r=a.roll.tick(dt,a,{targets:owner=>this.actors.filter(b=>b!==owner),clearPath:(a,b)=>this.clearPath(a,b),hit:(a,d,v,f,o)=>this.hit(a,d,V(v.x,v.z),f,o)});a.charge.tick(r.chargeDt);const scale=chargeMoveScale(a.charge.active,a.charge.parts.length);if(a.motion.active){const s=a.motion.tick(dt);this.move(a,s.x,s.z);}const rolling=r.chargeDt<dt;if(rolling)this.move(a,r.x,r.z);else if(!(a.iceCastLock>0)&&a.target&&!a.motion.active&&!a.recoil.active&&scale>0){const d=V(a.target.x-a.x,a.target.z-a.z),distance=d.length();if(distance<.15)a.target=null;else{const speed=4.4*(a.roll.speedBoost?1.35:1)*scale*(a.frostSlow>0?.35:a.slow>0?.55:1),travel=Math.min(distance,speed*dt);d.normalize();this.move(a,d.x*travel,d.z*travel);}}
   const facing=a.aim.clone().sub(V(a.x,a.z));if(facing.length()>.1)a.dir.copy(facing.normalize());a.cool=Math.max(0,a.cool-dt);a.iceCastLock=Math.max(0,(a.iceCastLock||0)-dt);a.iceLeftCool=Math.max(0,(a.iceLeftCool||0)-dt);a.iceRightCool=Math.max(0,(a.iceRightCool||0)-dt);a.mana=Math.min(100,a.mana+dt*(a.charge.active?3:10));a.shieldTime=Math.max(0,a.shieldTime-dt);if(!a.shieldTime)a.shield=0;
  }
  for(const a of this.actors)if(!a.roll.active&&a.roll.pendingRelease){a.roll.pendingRelease=false;this.input(a.id,{action:'release',point:{x:a.aim.x,z:a.aim.z}});}interceptSpaceShots(this.actors,this.magic,dt,m=>this.remove(m));this.magic.update(dt);for(const a of this.actors)if(a.recoil.active){const r=a.recoil.tick(dt);this.move(a,r.x,r.z);}this.statuses(dt);if(!this.finished)this.updateWards(dt);
  if(this.time>=600&&!this.finished){this.finished=true;this.winner=this.actors[0].hp===this.actors[1].hp?null:this.actors[0].hp>this.actors[1].hp?0:1;}
 }
 snapshot(){return {tick:this.tick,time:this.time,finished:this.finished,winner:this.winner,actors:this.actors.map(a=>({...pick(a,numeric),iceHand:a.iceHand,hitPose:a.hitPose?{...a.hitPose,dir:{x:a.hitPose.dir.x,z:a.hitPose.dir.z}}:null,dir:{x:a.dir.x,z:a.dir.z},aim:{x:a.aim.x,z:a.aim.z},target:a.target,charge:{queue:[...a.charge.queue],parts:[...a.charge.parts],held:[...a.charge.held],active:a.charge.active,elapsed:a.charge.elapsed,progress:a.charge.progress},roll:a.roll.snapshot(),motion:pick(a.motion,motionKeys),recoil:pick(a.recoil,recoilKeys),burnOwner:a.burnOwner?.id,poisonOwner:a.poisonOwner?.id,echo:a.echo?{time:a.echo.time,damage:a.echo.damage,owner:a.echo.owner?.id}:null})),wards:this.wards.map(w=>pick(w,['x','z','hp','life','speed','travelled','effectCooldown'])),effects:[this.magic.effects,this.magic.fire.effects,this.magic.ice.effects].map(list=>list.map(e=>({type:e.type,life:e.life,point:e.point?{...e.point}:null,distance:e.distance,position:e.mesh.position.toArray()})))};}
 correct(s){this.tick=s.tick;this.time=s.time;this.finished=s.finished;this.winner=s.winner;s.actors.forEach((data,i)=>{const a=this.actors[i];Object.assign(a,pick(data,numeric));a.iceHand=data.iceHand;a.hitPose=data.hitPose?{...data.hitPose,dir:V(data.hitPose.dir.x,data.hitPose.dir.z)}:null;a.dir.set(data.dir.x,0,data.dir.z);a.aim.set(data.aim.x,0,data.aim.z);a.target=data.target;Object.assign(a.charge,data.charge);Object.assign(a.roll,data.roll);Object.assign(a.motion,data.motion);Object.assign(a.recoil,data.recoil);a.burnOwner=this.actors[data.burnOwner];a.poisonOwner=this.actors[data.poisonOwner];a.echo=data.echo?{...data.echo,owner:this.actors[data.echo.owner]}:null;});if(s.wards.length===this.wards.length)s.wards.forEach((w,i)=>{Object.assign(this.wards[i],w);this.wards[i].m.position.set(w.x,1.2,w.z);});[this.magic.effects,this.magic.fire.effects,this.magic.ice.effects].forEach((list,n)=>{if(list.length!==s.effects[n].length)return;list.forEach((e,i)=>{const data=s.effects[n][i];if(data.type!==e.type)return;e.life=data.life;if(data.point)e.point={...data.point};if(data.distance!==undefined)e.distance=data.distance;e.mesh.position.fromArray(data.position);});});}
 dispose(){this.magic.clear();for(const w of this.wards)this.remove(w.m);this.wards.length=0;}
}
