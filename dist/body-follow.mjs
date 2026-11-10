import {Vector3} from './three.module.js';
const Y=new Vector3(0,1,0),clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const angleDelta=(a,b)=>Math.atan2(Math.sin(a-b),Math.cos(a-b));
const follow=(a,b,dt,tau)=>a+angleDelta(b,a)*(1-Math.exp(-dt/tau));
function turn(p,names,pivot,angle){for(const n of names)p[n]?.sub(pivot).applyAxisAngle(Y,angle).add(pivot);}
export class BodyFollow{
 constructor(settings=null){this.settings=settings;this.ready=false;this.clock=0;this.history=[];}
 update(dt,{aim}){
  this.aim=aim;
  if(!this.ready){this.head=this.chest=this.pelvis=aim;this.history=[{time:-1,aim}];this.ready=true;}
  if(dt<=0)return;
  if(this.settings){
   const step=(angle,rate)=>rate<=0?aim:angle+clamp(angleDelta(aim,angle),-rate*Math.PI/180*dt,rate*Math.PI/180*dt);
   this.pelvis=step(this.pelvis,this.settings.pelvisSpeed);this.chest=step(this.chest,this.settings.chestSpeed);this.head=step(this.head,this.settings.headSpeed);
   return;
  }
  this.clock+=dt;this.history.push({time:this.clock,aim});
  while(this.history.length>2&&this.history[1].time<this.clock-.5)this.history.shift();
  const delayed=delay=>{let value=this.history[0].aim;for(const sample of this.history){if(sample.time>this.clock-delay)break;value=sample.aim;}return value;};
  this.pelvis=follow(this.pelvis,delayed(.20),dt,.28);
  this.chest=follow(this.chest,delayed(.05),dt,.10);this.chest=this.pelvis+clamp(angleDelta(this.chest,this.pelvis),-.7,.7);
  this.head=follow(this.head,aim,dt,.05);this.head=this.chest+clamp(angleDelta(this.head,this.chest),-.9,.9);
 }
 updateLocomotion(dt,{aim,facing,casting=false}){
  this.aim=casting?aim:facing;
  if(casting||!this.ready){this.pelvis=this.chest=this.head=this.aim;this.ready=true;}
  this.pelvis=this.aim;
  if(casting)return;
  const delta=angleDelta(aim,facing),chestTarget=facing+clamp(delta,-Math.PI/4,Math.PI/4),headTarget=facing+clamp(delta,-Math.PI/2,Math.PI/2);
  const step=(angle,target,rate)=>rate<=0?target:angle+clamp(angleDelta(target,angle),-rate*Math.PI/180*Math.max(0,dt),rate*Math.PI/180*Math.max(0,dt));
  this.chest=facing+clamp(angleDelta(step(this.chest,chestTarget,this.settings?.chestSpeed??360),facing),-Math.PI/4,Math.PI/4);
  this.head=facing+clamp(angleDelta(step(this.head,headTarget,this.settings?.headSpeed??540),facing),-Math.PI/2,Math.PI/2);
 }
 orientation(){return this.ready?{headYaw:angleDelta(this.head,this.aim),chestYaw:angleDelta(this.chest,this.aim),pelvisYaw:angleDelta(this.pelvis,this.aim)}:{};}
 apply(p){
  if(!this.ready)return;
  const hips=p.Hips.clone();turn(p,Object.keys(p).filter(n=>n!=='Hips'),hips,angleDelta(this.pelvis,this.aim));
  const spine=p.Spine.clone();turn(p,['Neck','Head','LeftArm','LeftForeArm','LeftHand','RightArm','RightForeArm','RightHand'],spine,angleDelta(this.chest,this.pelvis));
  if(this.settings&&p.Neck)turn(p,['Head'],p.Neck.clone(),angleDelta(this.head,this.chest));
 }
}
