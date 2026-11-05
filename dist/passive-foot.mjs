// A damped ankle hinge. Angle 0 points forward (+Z); -PI/2 hangs down.
export const FOOT_LENGTH=.25,FOOT_RADIUS=.07,ANKLE_CLEARANCE=.10;
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export class PassiveFoot{
 constructor(){this.reset();}
 reset(){this.angle=0;this.velocity=0;this.previous=null;this.anchorVelocity=[0,0];}
 update(ankle,dt){
  dt=clamp(dt,1/240,1/20);
  // Legacy poses below the floor are displayed at the contact height.
  const anchor=[ankle[0],Math.max(ANKLE_CLEARANCE,ankle[1]),ankle[2]];
  let acceleration=[0,0];
  if(this.previous){
   const speed=[(anchor[1]-this.previous[1])/dt,(anchor[2]-this.previous[2])/dt];
   acceleration=speed.map((s,i)=>clamp((s-this.anchorVelocity[i])/dt,-30,30));this.anchorVelocity=speed;
  }
  this.previous=[...anchor];
  const steps=Math.ceil(dt/(1/240)),h=dt/steps;
  for(let i=0;i<steps;i++){
   const torque=((-9.81-acceleration[0])*Math.cos(this.angle)+acceleration[1]*Math.sin(this.angle))/(FOOT_LENGTH*.65);
   this.velocity+=(torque-5*this.velocity)*h;this.angle+=this.velocity*h;
   if(this.angle< -2.6||this.angle>.65){this.angle=clamp(this.angle,-2.6,.65);this.velocity=0;}
   const minimum=Math.asin(clamp((ANKLE_CLEARANCE-anchor[1])/FOOT_LENGTH,-1,0));
   if(anchor[1]-ANKLE_CLEARANCE+FOOT_LENGTH*Math.sin(this.angle)<0){this.angle=minimum;this.velocity=Math.max(0,this.velocity)*.12;}
  }
  const heel=[anchor[0],anchor[1]-.03,anchor[2]],toe=[heel[0],heel[1]+FOOT_LENGTH*Math.sin(this.angle),heel[2]+FOOT_LENGTH*Math.cos(this.angle)];
  return {heel,toe,radius:FOOT_RADIUS,angle:this.angle};
 }
}
