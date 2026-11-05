export class CastRecoil{
 constructor(){this.clear();}
 clear(){this.elapsed=1;this.delay=0;this.x=this.z=this.distance=0;}
 get active(){return this.elapsed<1||this.delay>0;}
 start(dir,rings,delay=0){const n=Math.hypot(dir.x,dir.z);if(!n)return;this.x=-dir.x/n;this.z=-dir.z/n;this.distance=[.55,1.05,1.65][Math.max(0,Math.min(2,rings-1))];this.elapsed=0;this.delay=delay;}
 tick(dt){if(this.delay>0){const wait=Math.min(dt,this.delay);this.delay-=wait;dt-=wait;}const before=this.elapsed;this.elapsed=Math.min(1,this.elapsed+dt);const ease=t=>1-(1-t)**2,d=(ease(this.elapsed)-ease(before))*this.distance;return {x:this.x*d,z:this.z*d};}
}
export class HitScreen{
 constructor(){this.clear();}
 clear(){this.time=0;this.strength=0;}
 hit(damage){if(damage<=0)return;this.time=.55;this.strength=Math.min(1,Math.max(this.strength,.4+damage/25));}
 tick(dt){this.time=Math.max(0,this.time-dt);if(!this.time)this.strength=0;}
 get opacity(){return this.strength*Math.min(1,this.time/.3);}
 shake(reduced=false){const a=this.strength*Math.min(1,this.time/.35)*(reduced?.015:.13);return{x:Math.sin(this.time*103)*a,y:Math.cos(this.time*87)*a*.65};}
}

export const chargeSetback=damage=>damage>0?Math.min(.7,.3+damage*.015):0;
