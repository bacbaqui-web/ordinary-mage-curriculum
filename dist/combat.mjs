export const ROLL_DURATION=.36, ROLL_COOLDOWN=2.4, ROLL_DISTANCE=3.6;
export class Roll {
 constructor(){this.reset()}
 reset(){this.remaining=0;this.cooldown=0;this.x=0;this.z=1}
 get active(){return this.remaining>0}
 get invulnerable(){return this.active && ROLL_DURATION-this.remaining<.28}
 start(x,z){if(this.cooldown>0||this.active)return false;const length=Math.hypot(x,z);if(length<.001)return false;this.x=x/length;this.z=z/length;this.remaining=ROLL_DURATION;this.cooldown=ROLL_COOLDOWN;return true}
 tick(dt){const travel=Math.min(dt,this.remaining)*ROLL_DISTANCE/ROLL_DURATION;this.remaining=Math.max(0,this.remaining-dt);this.cooldown=Math.max(0,this.cooldown-dt);return{x:this.x*travel,z:this.z*travel}}
}
// Evaluate only visible projectile position and travel direction, not player input.
export function incomingThreat(px,pz,dx,dz,speed,ex,ez){const x=ex-px,z=ez-pz,along=x*dx+z*dz,lateral=Math.abs(x*dz-z*dx);return along>0&&along/speed<.65&&lateral<1.15}
