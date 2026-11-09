const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export class BagSwing {
 constructor(){this.reset();}
 reset(){this.previous=null;this.speed=[0,0];this.phase=0;this.angle=[0,0];this.velocity=[0,0];this.bounce=0;}
 update(position,heading,dt){
  if(!(dt>0))return {angle:this.angle,bounce:this.bounce};
  dt=Math.min(dt,.05);let velocity=[0,0],acceleration=[0,0];
  if(this.previous){velocity=[(position[0]-this.previous[0])/dt,(position[2]-this.previous[2])/dt];
   if(Math.hypot(...velocity)>30){this.reset();velocity=[0,0];}
   else acceleration=velocity.map((v,i)=>clamp((v-this.speed[i])/dt,-20,20));
  }
  this.previous=[...position];this.speed=velocity;
  const speed=Math.min(7,Math.hypot(...velocity)),s=Math.sin(heading),c=Math.cos(heading);
  const ax=acceleration[0]*c-acceleration[1]*s,az=acceleration[0]*s+acceleration[1]*c;
  this.phase+=dt*(8+speed*1.2);
  const gait=Math.min(1,speed/4.4),target=[clamp(-az*.012+Math.sin(this.phase)*.12*gait,-.32,.32),clamp(ax*.012+Math.cos(this.phase*.5)*.07*gait,-.23,.23)];
  const steps=Math.ceil(dt*120),h=dt/steps;
  for(let j=0;j<steps;j++)for(let i=0;i<2;i++){this.velocity[i]+=((target[i]-this.angle[i])*55-this.velocity[i]*9)*h;this.angle[i]+=this.velocity[i]*h;}
  this.bounce+=(Math.abs(Math.sin(this.phase))*.035*gait-this.bounce)*(1-Math.exp(-dt*12));
  return {angle:this.angle,bounce:this.bounce};
 }
}
