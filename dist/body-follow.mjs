import {Vector3} from './three.module.js';
const Y=new Vector3(0,1,0),clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const angleDelta=(a,b)=>Math.atan2(Math.sin(a-b),Math.cos(a-b));
const follow=(a,b,dt,tau)=>a+angleDelta(b,a)*(1-Math.exp(-dt/tau));
function turn(p,names,pivot,angle){for(const n of names)p[n]?.sub(pivot).applyAxisAngle(Y,angle).add(pivot);}
function leg(p,side,target,yaw){
 const a=p[side+'UpLeg'],b=p[side+'Leg'],c=p[side+'Foot'],l1=a.distanceTo(b),l2=b.distanceTo(c),axis=target.clone().sub(a);
 const d=clamp(axis.length(),Math.abs(l1-l2)+1e-6,l1+l2-1e-6);axis.normalize();
 const bend=new Vector3(Math.sin(yaw),0,Math.cos(yaw));bend.addScaledVector(axis,-bend.dot(axis));if(bend.lengthSq()<1e-8)bend.set(1,0,0);bend.normalize();
 const x=(l1*l1-l2*l2+d*d)/(2*d),h=Math.sqrt(Math.max(0,l1*l1-x*x));b.copy(a).addScaledVector(axis,x).addScaledVector(bend,h);c.copy(a).addScaledVector(axis,d);
}
export class BodyFollow{
 constructor(){this.ready=false;this.feet=null;this.swing=null;this.next='Left';this.drop=0;}
 update(dt,{aim,x,z,vx=0,vz=0,enabled=true}){
  this.dt=dt;this.input={aim,x,z,vx,vz,enabled};this.speed=Math.hypot(vx,vz);
  if(!this.ready){this.head=this.chest=this.pelvis=aim;this.ready=true;}
  // Choose the closest forward/backward stance so backwards travel does not twist the waist.
  let stance=aim;if(this.speed>.1){stance=Math.atan2(vx,vz);if(Math.abs(angleDelta(stance,aim))>Math.PI/2)stance+=Math.PI;stance=aim+clamp(angleDelta(stance,aim),-.65,.65);}
  this.pelvis=follow(this.pelvis,stance,dt,.20);
  this.chest=follow(this.chest,aim,dt,.12);this.chest=this.pelvis+clamp(angleDelta(this.chest,this.pelvis),-.7,.7);
  this.head=follow(this.head,aim,dt,.05);this.head=this.chest+clamp(angleDelta(this.head,this.chest),-.9,.9);
  const desired=enabled&&this.speed>.1?.16:0;this.drop+=(desired-this.drop)*(1-Math.exp(-dt/.10));
 }
 apply(p,group){
  if(!this.input)return;const {aim,x,z,vx,vz,enabled}=this.input,dt=this.dt;
  const hips=p.Hips.clone();turn(p,Object.keys(p).filter(n=>n!=='Hips'),hips,angleDelta(this.pelvis,aim));
  const spine=p.Spine.clone();turn(p,['Head','LeftArm','LeftForeArm','LeftHand','RightArm','RightForeArm','RightHand'],spine,angleDelta(this.chest,this.pelvis));
  if(!enabled){this.feet=null;this.swing=null;return;}
  for(const point of Object.values(p))point.y-=this.drop;
  const nominal={};for(const side of ['Left','Right']){const offset=new Vector3(side==='Left'?-.17:.17,.10,0).applyAxisAngle(Y,this.pelvis);nominal[side]=new Vector3(x+offset.x,.10,z+offset.z);}
  if(!this.feet||this.lastRoot?.distanceTo(new Vector3(x,0,z))>2){this.feet={Left:nominal.Left.clone(),Right:nominal.Right.clone()};this.footYaw={Left:this.pelvis,Right:this.pelvis};this.swing=null;}
  this.lastRoot=new Vector3(x,0,z);
  if(!this.swing&&dt>0){
   const needs=side=>this.feet[side].distanceTo(nominal[side])>.16||Math.abs(angleDelta(this.footYaw[side],this.pelvis))>.4;
   if(this.speed>.1||needs('Left')||needs('Right')){
    let side=this.next;if(this.speed>.1){const delta=this.feet.Left.clone().sub(this.feet.Right).dot(new Vector3(vx,0,vz));side=delta<0?'Left':'Right';}else if(!needs(side))side=side==='Left'?'Right':'Left';
    const duration=clamp(.44/Math.max(.1,this.speed),.10,.25),target=nominal[side].clone().add(new Vector3(vx,0,vz).multiplyScalar(duration*1.5));
    this.swing={side,from:this.feet[side].clone(),target,elapsed:0,duration,yaw:this.footYaw[side],targetYaw:this.pelvis};this.next=side==='Left'?'Right':'Left';
   }
  }
  if(this.swing){const s=this.swing;s.elapsed+=dt;const t=clamp(s.elapsed/s.duration,0,1),u=t*t*(3-2*t);this.feet[s.side].lerpVectors(s.from,s.target,u);this.feet[s.side].y+=Math.sin(Math.PI*t)*.13;this.footYaw[s.side]=s.yaw+angleDelta(s.targetYaw,s.yaw)*u;if(t>=1)this.swing=null;}
  // Lower the hips slightly when a planted leg would otherwise overextend.
  let settle=0;
  for(const side of ['Left','Right']){
   if(this.swing?.side===side)continue;
   const a=p[side+'UpLeg'],b=p[side+'Leg'],c=p[side+'Foot'],target=group.worldToLocal(this.feet[side].clone()),reach=a.distanceTo(b)+b.distanceTo(c)-.00001;
   const horizontal=(a.x-target.x)**2+(a.z-target.z)**2;
   const maxHeight=Math.sqrt(Math.max(0,reach*reach-horizontal));settle=Math.max(settle,a.y-target.y-maxHeight);
  }
  if(settle>0)for(const point of Object.values(p))point.y-=settle;
  for(const side of ['Left','Right']){const target=group.worldToLocal(this.feet[side].clone());leg(p,side,target,angleDelta(this.pelvis,aim));p[side+'Toe']=p[side+'Foot'].clone().add(new Vector3(0,0,.22).applyAxisAngle(Y,angleDelta(this.footYaw[side],aim)));}
 }
}
