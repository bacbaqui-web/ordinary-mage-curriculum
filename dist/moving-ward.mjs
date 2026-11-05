import {crossesWard,distanceToWard} from './forces.mjs?v=zones1';
export function advanceMovingWard(w,dt,{actors,collides,wards}){if(!w.spec.moving||w.speed<=0)return;const travel=Math.min(w.spec.travel-w.travelled,w.speed*dt),count=Math.max(1,Math.ceil(travel/.06)),step=travel/count;
 for(let i=0;i<count;i++){const dx=w.nx*step,dz=w.nz*step,next={...w,x:w.x+dx,z:w.z+dz};let blocked=false;
 for(let along=-w.width/2;along<=w.width/2+.01;along+=.2)if(collides(next.x-w.nz*along,next.z+w.nx*along,.15)){blocked=true;break;}
 if(wards.some(other=>other!==w&&crossesWard(w,next,other,w.width*.5)))blocked=true;
 const bodies=actors.filter(a=>distanceToWard(a,next)<.55);
 for(const a of bodies)if(collides(a.x+dx,a.z+dz,.45)||wards.some(other=>other!==w&&crossesWard(a,{x:a.x+dx,z:a.z+dz},other,.45))){blocked=true;break;}
 if(blocked){w.speed=0;break;}for(const a of bodies){a.x+=dx;a.z+=dz;}w.x=next.x;w.z=next.z;w.travelled+=step;
 }if(w.travelled>=w.spec.travel-.001)w.speed=0;
}
