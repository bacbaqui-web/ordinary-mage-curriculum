import {iceContains} from './ice-shape.mjs?v=ice-detail-1';
// Apply inertia to voluntary movement only. Callers pass hostile ice zones.
export function iceMovement(actor,dt,zones,move,decide,blocked=false){
 const x=actor.x,z=actor.z;decide();
 const vx=(actor.x-x)/dt,vz=(actor.z-z)/dt;
 const icy=zones.some(p=>iceContains(p,x,z));
 if(blocked){actor.iceVX=0;actor.iceVZ=0;return;}
 if(!icy){actor.iceVX=vx;actor.iceVZ=vz;return;}
 const blend=1-Math.exp(-2.8*dt);
 actor.iceVX=(actor.iceVX??vx)+(vx-(actor.iceVX??vx))*blend;
 actor.iceVZ=(actor.iceVZ??vz)+(vz-(actor.iceVZ??vz))*blend;
 actor.x=x;actor.z=z;move(actor,actor.iceVX*dt,actor.iceVZ*dt);
 if(Math.abs(actor.x-x)<1e-8)actor.iceVX=0;
 if(Math.abs(actor.z-z)<1e-8)actor.iceVZ=0;
}
