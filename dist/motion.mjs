export class ForcedMotion{
 constructor(){this.clear()}
 clear(){this.elapsed=0;this.duration=0;this.x=0;this.z=0;this.distance=0;}
 get active(){return this.elapsed<this.duration}
 get lean(){return this.active?Math.sin(Math.PI*Math.min(1,this.elapsed/this.duration))*.28:0}
 start(dx,dz,distance){const length=Math.hypot(dx,dz);if(length<1e-8||Math.abs(distance)<1e-8)return;this.x=dx/length*Math.sign(distance);this.z=dz/length*Math.sign(distance);this.distance=Math.abs(distance);this.duration=.28+Math.min(this.distance,3)*.075;this.elapsed=0;}
 tick(dt){if(!this.active)return{x:0,z:0};const ease=t=>1-(1-t)**2,old=this.elapsed/this.duration;this.elapsed=Math.min(this.duration,this.elapsed+Math.max(0,dt));const travel=(ease(this.elapsed/this.duration)-ease(old))*this.distance;return{x:this.x*travel||0,z:this.z*travel||0};}
}
