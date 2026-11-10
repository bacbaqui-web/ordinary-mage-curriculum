import {Vector3} from './three.module.js';
const Y=new Vector3(0,1,0),clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const angleDelta=(a,b)=>Math.atan2(Math.sin(a-b),Math.cos(a-b));
const follow=(a,b,dt,tau)=>a+angleDelta(b,a)*(1-Math.exp(-dt/tau));
function turn(p,names,pivot,angle){for(const n of names)p[n]?.sub(pivot).applyAxisAngle(Y,angle).add(pivot);}
export class BodyFollow{
 constructor(){this.ready=false;this.clock=0;this.history=[];}
 update(dt,{aim}){
  this.aim=aim;
  if(!this.ready){this.head=this.chest=this.pelvis=aim;this.history=[{time:-1,aim}];this.ready=true;}
  if(dt<=0)return;
  this.clock+=dt;this.history.push({time:this.clock,aim});
  while(this.history.length>2&&this.history[1].time<this.clock-.5)this.history.shift();
  const delayed=delay=>{let value=this.history[0].aim;for(const sample of this.history){if(sample.time>this.clock-delay)break;value=sample.aim;}return value;};
  this.pelvis=follow(this.pelvis,delayed(.20),dt,.28);
  this.chest=follow(this.chest,delayed(.05),dt,.10);this.chest=this.pelvis+clamp(angleDelta(this.chest,this.pelvis),-.7,.7);
  this.head=follow(this.head,aim,dt,.05);this.head=this.chest+clamp(angleDelta(this.head,this.chest),-.9,.9);
 }
 apply(p){
  if(!this.ready)return;
  const hips=p.Hips.clone();turn(p,Object.keys(p).filter(n=>n!=='Hips'),hips,angleDelta(this.pelvis,this.aim));
  const spine=p.Spine.clone();turn(p,['Neck','Head','LeftArm','LeftForeArm','LeftHand','RightArm','RightForeArm','RightHand'],spine,angleDelta(this.chest,this.pelvis));
 }
}
