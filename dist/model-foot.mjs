// A shoe hangs from its measured cuff pivot, not from a horizontal proxy segment.
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export class ModelFoot {
 constructor(points){
  if(!points.length)throw Error('발 모양을 찾지 못했습니다.');
  this.center=points.reduce((s,p)=>[s[0]+p[1]/points.length,s[1]+p[2]/points.length],[0,0]);
  this.inertia=Math.max(.001,points.reduce((s,p)=>s+(p[1]**2+p[2]**2)/points.length,0));
  // Only the convex outline can touch the floor.
  const sorted=points.map(p=>[p[1],p[2]]).sort((a,b)=>a[0]-b[0]||a[1]-b[1]);
  const cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
  const half=ps=>{const h=[];for(const p of ps){while(h.length>1&&cross(h.at(-2),h.at(-1),p)<=0)h.pop();h.push(p);}return h.slice(0,-1);};
  this.outline=[...half(sorted),...half([...sorted].reverse())];
  this.restBottom=Math.min(...sorted.map(p=>p[0]));this.reset();
 }
 reset(){this.angle=0;this.velocity=0;this.previous=null;this.anchorVelocity=[0,0];}
 bottom(angle){const c=Math.cos(angle),s=Math.sin(angle);return Math.min(...this.outline.map(([y,z])=>y*c+z*s));}
 update(ankle,dt){
  dt=clamp(dt,1/240,1/20);let acceleration=[0,0];
  if(this.previous){const speed=[(ankle[1]-this.previous[1])/dt,(ankle[2]-this.previous[2])/dt];acceleration=speed.map((s,i)=>clamp((s-this.anchorVelocity[i])/dt,-30,30));this.anchorVelocity=speed;}
  this.previous=[...ankle];
  const floor=Math.min(0,ankle[1]+this.restBottom),valid=a=>ankle[1]+this.bottom(a)>=floor-1e-8;
  if(!valid(this.angle)){this.angle=0;this.velocity=0;}
  const steps=Math.ceil(dt*240),h=dt/steps;
  for(let i=0;i<steps;i++){
   const c=Math.cos(this.angle),s=Math.sin(this.angle),[y,z]=this.center;
   const torque=((-9.81-acceleration[0])*(z*c-y*s)+acceleration[1]*(y*c+z*s))/this.inertia;
   this.velocity+=(torque-7*this.velocity)*h;
   const before=this.angle,next=clamp(before+this.velocity*h,-.65,.65);
   if(valid(next))this.angle=next;
   else {let lo=0,hi=1;for(let j=0;j<24;j++){const t=(lo+hi)/2;if(valid(before+(next-before)*t))lo=t;else hi=t;}this.angle=before+(next-before)*lo;this.velocity=0;}
   if(Math.abs(this.angle)>=.65)this.velocity=0;
  }
  return {angle:this.angle};
 }
}
