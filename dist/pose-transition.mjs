// Blend local joint positions so moving actors never trail behind in world space.
export class PoseTransition{
 constructor(duration=.18){this.duration=duration;this.elapsed=duration;this.last=null;this.from=null;this.key=null;}
 apply(p,key,dt){
  const changed=this.key!==key;
  if(changed){this.key=key;this.from=this.last;this.elapsed=0;}
  else this.elapsed+=Math.max(0,dt||0);
  const t=this.duration<=0?1:Math.min(1,this.elapsed/this.duration),weight=t*t*(3-2*t);
  if(this.from&&t<1)for(const [n,v] of Object.entries(p))if(this.from[n])v.copy(this.from[n].clone().lerp(v,weight));
  this.last=Object.fromEntries(Object.entries(p).map(([n,v])=>[n,v.clone()]));return p;
 }
}
