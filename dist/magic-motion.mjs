import * as T from './three.module.js';
const V=(x,y,z)=>new T.Vector3(x,y,z);
export function chargeMoveScale(active,count){return active?0:1;}
export class MagicMotion{
 constructor(){this.reset();}
 reset(){this.stepTravel=0;this.pendingStep=0;this.mode='idle';this.elapsed=0;this.phaseElapsed=0;this.stage=1;this.callback=null;this.fired=false;}
 press(){if(this.mode==='hold')return;this.reset();this.mode='hold';}
 release(stage=1,callback=null){const prepared=this.mode==='hold'&&this.elapsed>=2/12;this.stepTravel=0;this.pendingStep=0;this.stage=stage;this.mode='release';this.phaseElapsed=0;this.elapsed=prepared?2/12:0;this.callback=callback;this.fired=false;}
 update(dt,stage=1){if(this.mode==='idle')return;this.elapsed+=dt;this.phaseElapsed+=dt;if(this.mode==='hold'&&this.stage!==stage){this.stage=stage;this.phaseElapsed=0;}
  if(this.mode==='release'&&this.stage>=2){const travel=.48*Math.min(1,Math.max(0,(this.elapsed-2/12)/.16));this.pendingStep+=travel-this.stepTravel;this.stepTravel=travel;}
  if(this.mode==='release'&&!this.fired&&this.elapsed>=2/12+(this.stage>=2?.16:0)){this.fired=true;const cb=this.callback;this.callback=null;cb?.();}
  if(this.mode==='release'&&(this.splitRelease?this.phaseElapsed:this.elapsed)>=(this.releaseDuration||10/12))this.reset();
 }
 takeStep(){const d=this.pendingStep;this.pendingStep=0;return d;}
 apply(p){if(this.mode==='idle')return;const two=this.stage>=2,fire=this.mode==='release'&&this.elapsed>=2/12,ready=this.elapsed>=2/12;
  const pose={RightArm:V(.36,1.45,0),LeftArm:V(-.36,1.45,0)};
  // Right hand behind the torso; left hand across the chest at the right shoulder.
  pose.RightForeArm=V(.49,1.25,-.24);pose.RightHand=V(.45,1.38,-.52);
  pose.LeftForeArm=V(-.16,1.22,.2);pose.LeftHand=V(.30,1.44,.10);
  if(ready){pose.LeftForeArm=V(-.30,1.43,.32);pose.LeftHand=V(-.25,1.43,.64);}
  if(two&&ready){pose.RightForeArm=V(.50,1.67,.08);pose.RightHand=V(.43,1.98,.10);}
  if(two&&fire){const t=Math.min(1,this.stepTravel/.48);pose.RightForeArm.lerp(V(.30,1.43,.32),t);pose.RightHand.lerp(V(.25,1.43,.64),t);pose.LeftForeArm.lerp(V(-.46,1.27,-.22),t);pose.LeftHand.lerp(V(-.42,1.37,-.51),t);}
  // Once the second ring starts, feet stay on their planted coordinates.
  if(two){pose.LeftUpLeg=V(-.16,.92,0);pose.RightUpLeg=V(.16,.92,0);pose.LeftLeg=V(-.19,.50,.25);pose.LeftFoot=V(-.21,.12,.48);pose.LeftToe=V(-.21,.12,.72);
   const step=fire?Math.min(1,(this.elapsed-2/12)/(.16)):0;
   pose.RightFoot=V(.24,.12+Math.sin(step*Math.PI)*.13,-.30+.94*step);pose.RightLeg=V(.30,.49,-.10+.44*step);
   pose.RightToe=pose.RightFoot.clone().add(V(.19*(1-step),0,-.15*(1-step)+.24*step));
   for(const n of ['LeftFoot','LeftToe','RightFoot','RightToe'])pose[n].z-=this.stepTravel;pose.LeftLeg.z-=this.stepTravel*.5;pose.RightLeg.z-=this.stepTravel*.5;
  }
  let weight=1;if(this.mode==='release'&&this.elapsed>=6/12){let t=Math.min(1,(this.elapsed-6/12)/(4/12));weight=1-t*t*(3-2*t);}
  for(const [n,v] of Object.entries(pose)){if(p[n])p[n].lerp(v,weight);else p[n]=v.clone();}
 }
}
