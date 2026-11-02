// A later lightning rune changes offensive delivery, not its original element.
export function fallsFromAbove(seq){return 'qiwg'.includes(seq[0])&&seq.slice(1).includes('l');}
export function overheadDelivery(seq){return seq[0]==='l'&&!launchesOrb(seq)||fallsFromAbove(seq);}
export const FALL_SECONDS=.28;
export function launchesOrb(seq){return 'qil'.includes(seq[0])&&seq.slice(1).includes('w')&&!fallsFromAbove(seq);}
export function movingWard(seq){return seq[0]==='e'&&seq.slice(1).includes('w');}
export function orbTuning(seq){
 const extraElement=Math.max(0,[...seq].filter(k=>k===seq[0]).length-1),extraPush=Math.max(0,[...seq].filter(k=>k==='w').length-1);
 return {radius:.32+extraElement*.28-extraPush*.1,speed:9-extraElement*3+extraPush*7,range:8+extraPush*4,blast:.9+extraElement*1.2-extraPush*.35,damageScale:1+extraElement*.7,burnDamage:2+extraElement,burn:2+extraElement*.5,variant:extraElement?'large':extraPush?'fast':'normal'};
}
// Earliest intersection along a segment, used for fast projectiles.
export function segmentCircleHit(from,to,target,radius){const dx=to.x-from.x,dz=to.z-from.z,ox=from.x-target.x,oz=from.z-target.z,a=dx*dx+dz*dz,c=ox*ox+oz*oz-radius*radius;if(c<=0)return 0;if(a<1e-12)return null;const b=2*(ox*dx+oz*dz),disc=b*b-4*a*c;if(disc<0)return null;const t=(-b-Math.sqrt(disc))/(2*a);return t>=0&&t<=1?t:null;}
