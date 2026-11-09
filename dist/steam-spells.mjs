import * as T from './three.module.js';
import {steamSpec,steamPlacement} from './steam-spec.mjs?v=bolt17';
import {crossesWard} from './forces.mjs';
export class SteamSpells{
 constructor(fire){this.f=fire;this.a=fire.a;}
 add(type,s,owner,p,dir,life,extra={}){const mesh=new T.Group();this.a.scene.add(mesh);return this.f.add(type,mesh,s,owner,p,dir,life,{steam:true,...extra});}
 puff(g,p,size,color=0x9b9fa5,alpha=.5){const m=new T.Mesh(new T.SphereGeometry(1,8,6),this.f.fogMaterial(color,alpha));m.position.copy(p);m.scale.copy(size);m.userData.base=p.clone();m.userData.size=size.clone();m.userData.alpha=alpha;g.add(m);return m;}
 cloud(s,owner,p,dir,{radius=s.radius,life=s.life,low=false,ring=false,arc=false,payload=true,residue=true}={}){
 const e=this.add('steamCloud',s,owner,p,dir,life,{radius,low,ring,arc,payload,blocksSight:!low&&!arc&&!ring});
 const count=radius<1?18:low?42:60;for(let i=0;i<count;i++){const a=arc?Math.atan2(dir.z,dir.x)+(i/(count-1)-.5)*2.1:Math.random()*Math.PI*2,r=ring||arc?radius*(.95+Math.random()*.1):Math.sqrt(Math.random())*radius;
 const color=s.op==='p'?(i%3?0x889c72:0xb1c783):s.op==='q'?(i%4?0x96918e:0xd77b61):s.op==='i'?0xc8d6dc:s.op==='d'?0x88857e:0x9b9fa5;
 const size=low?.6:.55+Math.random()*.35;this.puff(e.mesh,new T.Vector3(Math.cos(a)*r,low?.14:.4+Math.random()*1.1,Math.sin(a)*r),new T.Vector3(size,low?.14:size,size),color,low?.48:s.op==='i'?.8:.58);
 }
 if(arc)for(let i=0;i<5;i++){const a=Math.atan2(dir.z,dir.x)+(i/4-.5)*2.1;e.sightPoints??=[];e.sightPoints.push({x:p.x+Math.cos(a)*radius,z:p.z+Math.sin(a)*radius,radius:.65});}
 if(!ring&&residue)this.residue(s,owner,p,dir,radius,arc);
 return e;
 }
 residue(s,owner,p,dir,radius,arc=false){const e=this.add('steamResidue',s,owner,p,dir,7,{radius});for(let i=0;i<24;i++){const a=arc?Math.atan2(dir.z,dir.x)+(Math.random()-.5)*2.1:Math.random()*Math.PI*2,r=arc?radius:Math.sqrt(Math.random())*radius;
 const dust=['d','i'].includes(s.op),m=new T.Mesh(dust?new T.IcosahedronGeometry(.04+Math.random()*.08,0):new T.SphereGeometry(.25+Math.random()*.4,8,5),new T.MeshBasicMaterial({color:s.op==='i'?0xd7e5e7:s.op==='d'?0xaaa69e:0x526972,transparent:true,opacity:dust?.65:.22,depthWrite:false}));m.position.set(Math.cos(a)*r,.035,Math.sin(a)*r);m.scale.y=dust?.12:.025;e.mesh.add(m);}}
 affect(e,impact=false){for(const v of this.a.targets(e.owner)){const dx=v.x-e.point.x,dz=v.z-e.point.z,d=Math.hypot(dx,dz);if(!this.a.areaHit(v,e.point,e.radius,e.dir,e.arc,e.arc)||!this.a.clearPath(e.point,v))continue;
 const dir=impact?e.dir:new T.Vector3(dx,0,dz).normalize(),damage=impact?e.s.damage:0;
 if(!this.a.hit(v,damage,dir,impact&&e.s.op==='h'?e.s.knockback:0,e.owner))continue;
 this.a.applyPayload(v,e.s,e.owner);v.wet=Math.max(v.wet||0,2);if(e.s.frost)v.frostSlow=1;
 if(e.s.op==='p'){if(!(v.poison>0))v.poisonTick=.5;v.poison=Math.min(4,(v.poison||0)+1);v.poisonDamage=1.2*e.s.power;v.poisonOwner=e.owner;}
 if(e.s.op==='g'&&d>.4)v.motion.start(-dx,-dz,Math.min(.7,d-.35));
 }}
 cast(seq,power,owner,dir,target){const s=steamSpec(seq,power),p=steamPlacement(s,owner,dir,target);
 if(s.op==='l'){
 const e=this.add('steamDrop',s,owner,p,dir,.42,{radius:s.radius,struck:false});
 const ring=new T.Mesh(new T.RingGeometry(s.radius*.85,s.radius,48),new T.MeshBasicMaterial({color:0xd9f2ff,transparent:true,opacity:.5,side:T.DoubleSide,depthWrite:false}));ring.rotation.x=-Math.PI/2;ring.position.y=.025;e.mesh.add(ring);e.impactRing=ring;
 const column=new T.Group();column.visible=false;e.mesh.add(column);e.column=column;
 const points=Array.from({length:9},(_,i)=>new T.Vector3(i===8?0:(Math.random()-.5)*.8,7-i*7/8,i===8?0:(Math.random()-.5)*.6));
 for(let i=0;i<8;i++){this.f.segment(column,points[i],points[i+1],.24,0x95b6c7);this.f.segment(column,points[i],points[i+1],.11,0xf1fbff);}
 for(let i=0;i<16;i++)this.puff(column,new T.Vector3((Math.random()-.5)*1.3,Math.random()*6,(Math.random()-.5)*1.3),new T.Vector3(.4,.7,.4),0xd7e8ef,.7);
 return;
 }
 if(s.op==='w'||s.op==='h'){const e=this.add(s.op==='h'?'punch':'shot',s,owner,p,dir,s.op==='h'?s.dashDuration:2,{radius:.6,distance:0});for(let i=0;i<16;i++)this.puff(e.mesh,new T.Vector3((Math.random()-.5)*.6,.9+(Math.random()-.5)*.5,(Math.random()-.5)*.6),new T.Vector3(.35,.35,.35),0xcbd5d8,.7);return;}
 if(s.op==='s'){const e=this.add('steamCut',s,owner,p,dir,.25,{radius:s.radius});const curve=new T.EllipseCurve(0,0,s.radius,s.radius,-1.05,1.05);const points=curve.getPoints(32).map(v=>new T.Vector3(v.x,.8,v.y));const path=new T.CatmullRomCurve3(points);const blade=new T.Mesh(new T.TubeGeometry(path,32,.12,5,false),new T.MeshBasicMaterial({color:0xdde5e7,transparent:true,opacity:.9}));blade.rotation.y=-Math.atan2(dir.z,dir.x);e.mesh.add(blade);e.arc=false;for(const v of this.a.targets(owner)){const dx=v.x-p.x,dz=v.z-p.z,d=Math.hypot(dx,dz);if(this.a.areaHit(v,p,s.radius,dir,true)&&this.a.clearPath(p,v))this.a.hit(v,s.damage,dir,0,owner);}this.cloud(s,owner,p,dir,{arc:true,payload:false});return;}
 if(s.op==='e'){const e=this.cloud(s,owner,p,dir,{ring:true,payload:false});e.wards=[];for(let i=0;i<14;i++){const angle=i/14*Math.PI*2,nx=Math.cos(angle),nz=Math.sin(angle),m=new T.Mesh(new T.BoxGeometry(.2,2,1.05),new T.MeshBasicMaterial({color:0xc4d1d5,transparent:true,opacity:.16,depthWrite:false}));m.position.set(p.x+nx*s.radius,1,p.z+nz*s.radius);m.rotation.y=-angle;this.a.scene.add(m);const w={owner,m,x:m.position.x,z:m.position.z,nx,nz,width:1.05,hp:28*power,maxHp:28*power,life:s.life,speed:0,travelled:0,effectCooldown:0,spec:{moving:false,shock:0,burn:0,slow:0,push:0,pull:0},steamWall:e};this.a.wards.push(w);e.wards.push(w);}return;}
 const e=this.cloud(s,owner,p,dir,{low:s.op==='t'});if(s.op==='g')for(let i=0;i<28;i++){const a=i*.9,h=i/28*3.2;this.puff(e.mesh,new T.Vector3(Math.cos(a)*(1.5-h*.25),h,Math.sin(a)*(1.5-h*.25)),new T.Vector3(.45,.55,.45),0xb6bdc1,.6);}
 }
 update(e,dt){if(e.type==='steamResidue'){for(const m of e.mesh.children)m.material.opacity=(['d','i'].includes(e.s.op)?.65:.22)*Math.min(1,e.life/2);return e.life<=0;}
 if(e.type==='steamCut'){for(const m of e.mesh.children)m.material.opacity=.9*Math.min(1,e.life/.15);return e.life<=0;}
 if(e.type==='steamDrop'){
 if(e.age>=.16&&!e.struck){e.struck=true;e.column.visible=true;this.affect(e,true);
 const cloud=this.cloud(e.s,e.owner,e.point,e.dir,{life:4,payload:false});cloud.burst=true;
 for(let i=0;i<44;i++){const a=i/44*Math.PI*2;this.a.vfx.particle('chunk',[e.point.x,.15,e.point.z],[Math.cos(a)*(3+Math.random()*3),1+Math.random()*2,Math.sin(a)*(3+Math.random()*3)],.04+Math.random()*.06,i%3?0xd0dbe0:0xeffbff,.35+Math.random()*.2,{gravity:5});}}
 if(e.struck){const t=(e.age-.16)/.26;e.column.scale.set(1-t*.55,1,1-t*.55);e.column.visible=t<.55||t>.65&&t<.78;e.impactRing.scale.setScalar(.35+t*1.25);e.impactRing.material.opacity=Math.max(0,1-t);}
 return e.life<=0;
 }
 if(e.type==='shot'||e.type==='punch'){const dash=e.type==='punch',speed=dash?e.s.dashSpeed:8,range=dash?e.s.dashDistance:e.s.range,travel=Math.min(speed*dt,range-e.distance),steps=Math.max(1,Math.ceil(travel/.08));let burst=e.life<=0;
 for(let i=0;i<steps&&!burst;i++){const next={x:e.point.x+e.dir.x*travel/steps,z:e.point.z+e.dir.z*travel/steps};if(this.a.collides(next.x,next.z,.4)||this.a.wallBlocks(e.point,next)){burst=true;break;}e.point=next;e.distance+=travel/steps;if(dash){e.owner.x=next.x;e.owner.z=next.z;}if(this.a.targets(e.owner).some(v=>this.a.areaHit(v,{...next,y:1},.5,null,false,false,.4)&&this.a.clearPath(next,v))){if(dash)this.affect(e,true);burst=true;}}
 e.mesh.position.set(e.point.x,.04,e.point.z);if(burst||e.distance>=range){this.cloud(e.s,e.owner,e.point,e.dir,{life:4,payload:false});return true;}}
 if(e.type==='steamCloud'){if(e.burst)e.mesh.scale.setScalar(.25+.75*Math.min(1,e.age/.16));if(e.wards){const gone=e.wards.filter(w=>w.hp<=0||w.life<=0||e.life<=0);for(const w of gone)if(!w.steamReleased){w.steamReleased=true;w.life=0;this.cloud(e.s,e.owner,{x:w.x,z:w.z},e.dir,{radius:.65,life:1.5,payload:false,residue:false});}if(gone.length===e.wards.length)return true;}
 if(e.payload&&e.tick<=0){e.tick=.5;this.affect(e);if(['i','d'].includes(e.s.op))for(let i=0;i<16;i++){const a=Math.random()*Math.PI*2,r=Math.sqrt(Math.random())*e.radius;this.a.vfx.particle(e.s.op==='i'?'shard':'chunk',[e.point.x+Math.cos(a)*r,.5+Math.random()*1.4,e.point.z+Math.sin(a)*r],[Math.cos(a)*.25,.1,Math.sin(a)*.25],.035+Math.random()*.035,e.s.op==='i'?0xe5f4f7:0xb9b4aa,1.2,{gravity:.25});}}if(e.s.op==='g')e.mesh.rotation.y+=dt*1.7;}
 for(const m of e.mesh.children){if(!m.userData.base)continue;const u=m.userData;if(e.wards){const angle=(Math.atan2(u.base.z,u.base.x)+Math.PI*2)%(Math.PI*2),w=e.wards[Math.round(angle/(Math.PI*2)*14)%14];m.visible=w.hp>0&&w.life>0;}m.position.copy(u.base);m.position.y+=Math.sin(e.age*1.5+m.id)*.06;m.material.uniforms.alpha.value=u.alpha*Math.min(1,e.life/.7);const pulse=1+Math.sin(e.age*1.7+m.id)*.08;m.scale.copy(u.size).multiplyScalar(pulse);}
 return e.life<=0;
 }
}
