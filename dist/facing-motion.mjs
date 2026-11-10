import {angleDelta} from './body-follow.mjs?v=wasd-facing-1';
export class FacingMotion{
 constructor(){this.yaw=null;this.casting=false;this.preparation=null;this.elapsed=0;}
 update(dt,{target,casting=false,prepareSeconds=0,preparation=null,progress=null}){
  if(this.yaw===null)this.yaw=target;
  dt=Math.max(0,dt);
  if(casting){
   if(!this.casting||preparation&&preparation!==this.preparation){this.from=this.yaw;this.elapsed=0;this.duration=Math.max(0,prepareSeconds);}
   this.elapsed+=dt;
   const ended=this.preparation&&!preparation;if(ended)this.duration=0;
   const t=ended||this.duration===0?1:Math.min(1,progress??this.elapsed/this.duration);
   const weight=t*t*(3-2*t);this.yaw=this.from+angleDelta(target,this.from)*weight;
  }else{
   const duration=Math.max(0,prepareSeconds);
   if(this.casting||this.moveTarget===undefined||Math.abs(angleDelta(target,this.moveTarget))>1e-6||duration!==this.moveDuration){
    this.moveFrom=this.yaw;this.moveTarget=target;this.moveElapsed=0;this.moveDuration=duration;
   }
   this.moveElapsed+=dt;
   const t=duration===0?1:Math.min(1,this.moveElapsed/duration),weight=t*t*(3-2*t);
   this.yaw=this.moveFrom+angleDelta(this.moveTarget,this.moveFrom)*weight;
  }
  this.casting=casting;this.preparation=preparation;return this.yaw;
 }
}
