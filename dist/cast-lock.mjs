export const CAST_RELEASE_SECONDS=10/12;
// Charging can turn; only pending release and the cast pose lock controls.
export function castControlsLocked(actor,charge=actor.charge){return !!charge?.pending||(actor.castControlLock||0)>0||(actor.iceCastLock||0)>0;}
export function chargeTurnScale(charge){return charge?.active?(charge.parts.length>=2?.3:.5):1;}
export function followCastAim(actor,target,dt,charge=actor.charge){
 if(castControlsLocked(actor,charge))return;
 const dx=target.x-actor.x,dz=target.z-actor.z;if(Math.hypot(dx,dz)<.01)return;
 const goal=Math.atan2(dx,dz);if(!charge?.active){actor.dir.set(Math.sin(goal),0,Math.cos(goal));return;}
 const angle=Math.atan2(actor.dir.x,actor.dir.z),delta=Math.atan2(Math.sin(goal-angle),Math.cos(goal-angle)),limit=4*Math.PI*Math.max(0,dt)*chargeTurnScale(charge),next=angle+Math.max(-limit,Math.min(limit,delta));
 actor.dir.set(Math.sin(next),0,Math.cos(next));
}
