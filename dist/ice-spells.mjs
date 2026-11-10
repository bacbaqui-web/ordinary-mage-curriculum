import {IceSurface} from './ice-surface.mjs';
import {roundDamage} from './damage-number.mjs?v=integer-damage-1';
import * as T from './three.module.js';
import {iceSpec,hasIceRecipe,ICE_BEAM} from './ice-spec.mjs?v=filled-tells-1';
import {crossesWard} from './forces.mjs?v=iceberg-rise-1';
const V=(x=0,y=0,z=0)=>new T.Vector3(x,y,z);
export class IceSpells{
 constructor(api){this.a=api;this.effects=[];this.controlled=new Set();this.rinkSurface=null;}
 clear(){if(this.rinkSurface){const m=this.rinkSurface.mesh;m.geometry.dispose();for(const material of m.material)material.dispose();m.removeFromParent();this.rinkSurface=null;}for(const e of this.effects)this.a.remove(e.mesh);this.effects=[];for(const v of this.controlled){v.knockdown=0;v.rooted=0;v.slipImmune=0;v.greenFrost=0;v.frozen=0;}this.controlled.clear();}
 mesh(geometry,color=0x99ddff,opacity=1){const m=new T.Mesh(geometry,new T.MeshStandardMaterial({color,emissive:color,emissiveIntensity:.25,roughness:.35,transparent:opacity<1,opacity,flatShading:true,depthWrite:opacity===1}));return m;}
 add(type,s,owner,p,dir,life=s.life){const mesh=new T.Group();mesh.position.set(p.x,0,p.z);this.a.scene.add(mesh);const e={type,s,owner,point:{x:p.x,z:p.z},dir:dir.clone(),mesh,life,max:life,age:0,tick:0,hit:new Set(),dwell:new Map(),distance:0};this.effects.push(e);return e;}
 shard(parent,x,y,z,size=.15,color=0xb6edff){const m=this.mesh(new T.OctahedronGeometry(size,0),color);m.position.set(x,y,z);m.scale.y=2.5;parent.add(m);return m;}
 burst(p,r=1,color=0xb8eaff){this.a.vfx.pulse?.(p.x,p.z,r,color,.35);for(let i=0;i<24;i++){const a=i*2.4;this.a.vfx.particle?.('shard',[p.x,.35,p.z],[Math.cos(a)*2,1+Math.random()*2,Math.sin(a)*2],.06,color,.6,{gravity:5});}}
 area(e,p=e.point,r=e.s.radius,{cone=false,once=false,force=0,root=0,damage=e.s.damage}={}){for(const v of this.a.targets(e.owner)){if(once&&e.hit.has(v)||!this.a.areaHit(v,p,r,e.dir,cone)||!this.a.clearPath(p,v))continue;const d=V(v.x-p.x,0,v.z-p.z);if(d.length()<.01)d.copy(e.dir);d.normalize();if(this.a.hit(v,damage,d,force,e.owner)===false)continue;e.hit.add(v);v.slow=Math.max(v.slow||0,e.s.slow);if(root){v.rooted=Math.max(v.rooted||0,root);this.controlled.add(v);}if(e.s.op==='p'){v.greenFrost=Math.max(v.greenFrost||0,5);this.controlled.add(v);}}}
 interrupt(v){v.charge?.clear();if(v.roll){v.roll.remaining=0;v.roll.pendingRelease=false;}v.target=null;v.iceCastLock=0;v.pendingCastLight=null;v.wind=0;v.recoil?.clear();this.a.interrupt?.(v);}
 cast(seq,power,owner,dir,target,emission=null,variant=null){if(seq==='ii'&&variant==='beam'){this.beam(power,owner,dir);return true;}if(!hasIceRecipe(seq))return false;const s=iceSpec(seq,power),delta=V(target.x-owner.x,0,target.z-owner.z);if(delta.length()>s.range)delta.setLength(s.range);let p={x:owner.x+delta.x,z:owner.z+delta.z};if(['q','i','p','w','s','h'].includes(s.op))p={x:owner.x,z:owner.z};
 if(['i','w'].includes(s.op)){const e=this.add('shot',s,owner,p,dir,2);e.mesh.position.addScaledVector(dir,.72);e.mesh.position.y=1.42;if(emission)e.mesh.position.copy(emission);e.point={x:e.mesh.position.x,z:e.mesh.position.z};const m=s.op==='i'?this.mesh(new T.ConeGeometry(.16,1.3,5),0x9de8ff):this.mesh(new T.IcosahedronGeometry(.43,2),0xe5f5ff);if(s.op==='i')m.quaternion.setFromUnitVectors(V(0,1,0),dir);e.mesh.add(m);e.mesh.geometry=new T.SphereGeometry(s.op==='i'?.16:.43,8,6);e.projectile=m;return true;}
 if(s.op==='l'){const e=this.add('fall',s,owner,p,dir,.95),ring=this.mesh(new T.RingGeometry(s.radius-.07,s.radius,40),0x86ddff,.75);ring.rotation.x=-Math.PI/2;ring.position.y=.025;e.mesh.add(ring);e.ice=this.shard(e.mesh,0,5,0,.5);e.ice.visible=false;return true;}
 if(s.op==='d'){
 const e=this.add('iceberg',s,owner,p,dir,3),rock=new T.Group();e.mesh.add(rock);e.rock=rock;
 // Keep the original faceted boulder; only narrow and lift its upper shoulder.
 const geometry=new T.IcosahedronGeometry(1,1),positions=geometry.attributes.position;
 for(let i=0;i<positions.count;i++){const x=positions.getX(i),y=positions.getY(i),z=positions.getZ(i),t=(y+1)/2,tip=Math.max(0,(t-.58)/.42),wide=(1-.32*t)*(1-.22*tip);positions.setXYZ(i,x*1.45*wide+.18*t,(y+1)*1.65+.18*tip*tip,z*1.3*wide+.12*Math.sin(y*4));}
 geometry.scale(.85,.85,.85);geometry.computeVertexNormals();const body=this.mesh(geometry,0x9bdbe8,.55);body.material.roughness=.2;body.material.metalness=.08;body.material.emissiveIntensity=.1;rock.add(body);
 const edges=new T.LineSegments(new T.EdgesGeometry(geometry,24),new T.LineBasicMaterial({color:0xd5f6ff,transparent:true,opacity:.32}));rock.add(edges);rock.position.y=-3.3;
 this.area(e,p,s.radius,{force:3.2,once:true});
 const cracks=new T.Group();e.mesh.add(cracks);e.cracks=cracks;
 // Flat, tapered fissures sit on the ground instead of glowing raised tubes.
 const fissure=(points,width)=>{const vertices=[];for(let j=0;j<points.length-1;j++){const a=points[j],b=points[j+1],dx=b.x-a.x,dz=b.z-a.z,length=Math.hypot(dx,dz),nx=-dz/length,nz=dx/length,wa=width*(1-j/(points.length-1)),wb=width*(1-(j+1)/(points.length-1)),y=.055;vertices.push(a.x+nx*wa,y,a.z+nz*wa,a.x-nx*wa,y,a.z-nz*wa,b.x+nx*wb,y,b.z+nz*wb,a.x-nx*wa,y,a.z-nz*wa,b.x-nx*wb,y,b.z-nz*wb,b.x+nx*wb,y,b.z+nz*wb);}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(vertices,3));const m=new T.Mesh(g,new T.MeshBasicMaterial({color:0x263135,transparent:true,opacity:.62,side:T.DoubleSide,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1}));cracks.add(m);};
 for(let i=0;i<9;i++){const angle=i*2.399+.19*Math.sin(i*3),length=1.25+(i%4)*.16,points=[];for(let j=0;j<5;j++){const r=.48+(length-.48)*j/4,a=angle+Math.sin(i*4+j*2.3)*.14;points.push(V(Math.cos(a)*r,0,Math.sin(a)*r));}fissure(points,.032+(i%3)*.008);const start=points[2],a=angle+(i%2?-.65:.55),end=V(start.x+Math.cos(a)*.33,0,start.z+Math.sin(a)*.33);fissure([start,V((start.x+end.x)/2+.035,0,(start.z+end.z)/2-.025),end],.017);}
 cracks.scale.setScalar(.1);
 for(let i=0;i<80;i++){const a=i*2.4,r=.4+(i%7)*.12,speed=2+(i%5)*.65;this.a.vfx.particle?.('shard',[p.x+Math.cos(a)*r,.12,p.z+Math.sin(a)*r],[Math.cos(a)*speed,2+(i%6)*.6,Math.sin(a)*speed],.025+(i%4)*.018,i%3?0xd9f8ff:0x8ad9f2,.65+(i%5)*.1,{gravity:8,stretch:1.5});}
 const ward={owner,m:e.mesh,x:p.x,z:p.z,nx:dir.x,nz:dir.z,width:2.21,radius:1.0625,hp:24,maxHp:24,baseY:0,life:e.life,travelled:0,speed:0,effectCooldown:.8,spec:{moving:false,travel:0}};
 this.a.wards.push(ward);e.ward=ward;return true;
 }
 if(s.op==='e'){const e=this.add('wall',s,owner,p,dir,4.5),width=3.6;const wall=this.mesh(new T.BoxGeometry(width,1.9,.45),0x93d9fa,.75);e.mesh.add(wall);wall.position.y=.95;e.mesh.rotation.y=Math.atan2(dir.x,dir.z);for(let i=0;i<7;i++)this.shard(e.mesh,(i-3)*width/7,1.75,0,.2);const ward={owner,m:e.mesh,x:p.x,z:p.z,nx:dir.x,nz:dir.z,width,hp:48,maxHp:48,baseY:0,life:e.life,travelled:0,speed:0,effectCooldown:.8,spec:{slow:1,shock:0,moving:false,travel:0}};this.a.wards.push(ward);e.ward=ward;return true;}
 if(s.op==='s'){const e=this.add('cut',s,owner,p,dir,.28);const a=Math.atan2(dir.z,dir.x),pts=Array.from({length:25},(_,i)=>V(Math.cos(a-1.05+i*2.1/24)*s.radius,.9,Math.sin(a-1.05+i*2.1/24)*s.radius));e.mesh.add(this.mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts),24,.12,5,false),0xc4f4ff));this.area(e,p,s.radius,{cone:true,once:true});return true;}
 if(s.op==='h'){const e=this.add('punch',s,owner,p,dir,s.range/s.speed);e.mesh.add(this.mesh(new T.BoxGeometry(.8,.7,.9),0x94dfff));e.mesh.position.y=1;e.mesh.rotation.y=Math.atan2(dir.x,dir.z);return true;}
 const type=s.op==='t'?'rink':s.op==='g'?'blizzard':s.op==='p'?'frostbite':'fog',e=this.add(type,s,owner,p,dir);if(type==='rink'){this.updateRinkSurface();}else{for(let i=0;i<65;i++){const flake=this.shard(e.mesh,0,0,0,.025+(i%4)*.008,s.op==='p'?(i%2?0xa8e6bb:0x71c6a1):0xc9f3ff);flake.userData.flake=i;}if(type==='fog'||type==='frostbite')for(let i=0;i<22;i++){const puff=this.mesh(new T.SphereGeometry(.38,8,5),type==='frostbite'?0x8fcdae:0xd4edf5,.2);puff.userData.fog=i;e.mesh.add(puff);}}
 if(type==='frostbite')this.area(e,p,s.radius,{cone:true,once:true});return true;
 }
 beam(power,owner,dir){
 const s={...ICE_BEAM,damage:ICE_BEAM.damage*power},e=this.add('beam',s,owner,owner,dir,s.life);e.frozen=new Set();e.accepted=new Set();
 e.mesh.geometry=new T.BoxGeometry(s.width*2,.8,s.range).translate(0,0,s.range/2);
 e.mesh.quaternion.setFromUnitVectors(V(0,0,1),dir);
 for(let i=0;i<85;i++){const puff=this.mesh(i%3?new T.SphereGeometry(.15,6,4):new T.OctahedronGeometry(.06),i%3?0x80cfff:0xe3fbff,i%3?.28:.95);puff.userData.seed=i*.618;e.mesh.add(puff);}
 for(const z of [0,.14]){const ring=this.mesh(new T.TorusGeometry(.32,.025,6,40),0x91eaff,.8);ring.userData.ring=true;ring.position.z=z;e.mesh.add(ring);}
 owner.iceCastLock=Math.max(owner.iceCastLock||0,s.life);if(owner.recoil?.active)owner.recoil.delay=s.life;
 }
 updateBeam(e,dt){
 const s=e.s;e.mesh.position.set(e.owner.x+e.dir.x*.5,1,e.owner.z+e.dir.z*.5);let range=s.range;
 const start=e.mesh.position;
 for(let n=.08;n<=s.range;n+=.08){const p={x:start.x+e.dir.x*n,z:start.z+e.dir.z*n};if(this.a.collides(p.x,p.z,.1)||this.a.wallBlocks(start,p)){range=Math.max(0,n-.08);break;}}
 if(e.visibleRange!==range){e.mesh.geometry.dispose();e.mesh.geometry=new T.BoxGeometry(s.width*2,.8,Math.max(.001,range)).translate(0,0,range/2);e.visibleRange=range;}
 for(const m of e.mesh.children){if(m.userData.ring){m.rotation.z=e.age*2;continue;}const t=(m.userData.seed+e.age*2.7)%1,a=m.userData.seed*8;m.position.set(Math.cos(a+e.age)*s.width*.65,Math.sin(a+e.age)*.25,t*range);m.scale.set(.7+t*.5,.7,1.8);m.material.opacity=Math.sin(t*Math.PI)*(m.geometry.type==='SphereGeometry'?.32:.95);}
 const tick=e.tick<=0;if(tick)e.tick=s.interval;
 for(const v of this.a.targets(e.owner)){
  const touches=range>0&&!v.roll?.invulnerable&&this.a.clearPath(start,v)&&this.a.screenHit({mesh:e.mesh,owner:e.owner},start,start,v);
  if(!touches){e.dwell.delete(v);e.accepted.delete(v);continue;}
  if(tick){if(this.a.hit(v,s.damage,e.dir,0,e.owner)===false){e.dwell.delete(v);e.accepted.delete(v);continue;}e.accepted.add(v);v.slow=Math.max(v.slow||0,.8);}
  if(!e.accepted.has(v))continue;
  const time=(e.dwell.get(v)||0)+dt;e.dwell.set(v,time);
  if(time+1e-8>=s.freezeAfter&&!e.frozen.has(v)){this.interrupt(v);v.motion?.clear();v.frozen=s.freezeTime;this.controlled.add(v);e.frozen.add(v);this.burst(v,.7,0xe2faff);}
 }
 }
 shatterIceberg(e){
 if(e.shattered)return;e.shattered=true;
 const debris=this.add('iceDebris',e.s,e.owner,e.point,e.dir,5);
 const source=e.rock.children[0],positions=source.geometry.attributes.position;source.geometry.computeBoundingBox();const core=source.geometry.boundingBox.getCenter(V()),groups=Array.from({length:6},()=>[]),axes=[V(1,0,0),V(-1,0,0),V(0,1,0),V(0,-1,0),V(0,0,1),V(0,0,-1)];
 // Join adjacent original faces into six large solid chunks, removing internal seams.
 for(let i=0;i<positions.count;i+=3){const face=[0,1,2].map(j=>V().fromBufferAttribute(positions,i+j)),direction=face[0].clone().add(face[1]).add(face[2]).multiplyScalar(1/3).sub(core).normalize();let best=0;for(let j=1;j<6;j++)if(direction.dot(axes[j])>direction.dot(axes[best]))best=j;groups[best].push(face);}
 for(let n=0;n<groups.length;n++){const faces=groups[n],center=V(),edges=new Map(),key=p=>p.toArray().map(v=>v.toFixed(5)).join(',');for(const face of faces)for(const p of face)center.add(p);center.multiplyScalar(1/(faces.length*3));const vertices=[],add=(a,b,c)=>{for(const p of [a,b,c])vertices.push(p.x-center.x,p.y-center.y,p.z-center.z);};
 for(const face of faces){add(...face);for(let j=0;j<3;j++){const a=face[j],b=face[(j+1)%3],k=[key(a),key(b)].sort().join('|');if(edges.has(k))edges.delete(k);else edges.set(k,[a,b]);}}for(const [a,b] of edges.values())add(a,core,b);
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(vertices,3));geometry.computeVertexNormals();const shard=new T.Mesh(geometry,source.material.clone());shard.material.side=T.DoubleSide;shard.position.copy(center).add(e.rock.position);debris.mesh.add(shard);
 const angle=n*2.4,outward=V(center.x-core.x,0,center.z-core.z);if(outward.lengthSq()<.01)outward.set(Math.cos(angle),0,Math.sin(angle));outward.normalize();const rotation=V(.45+n*.14,(n%2?1:-1)*.5,.35+n*.1),q=new T.Quaternion().setFromEuler(new T.Euler(rotation.x,rotation.y,rotation.z));let minY=Infinity;for(let j=0;j<geometry.attributes.position.count;j++)minY=Math.min(minY,V().fromBufferAttribute(geometry.attributes.position,j).applyQuaternion(q).y);
 Object.assign(shard.userData,{origin:shard.position.clone(),velocity:outward.multiplyScalar(2+(n%3)*.6),rotation,land:.65+n*.045,minY,opacity:source.material.opacity});
 }
 }

 updateRinkSurface(){const zones=this.effects.filter(e=>e.type==='rink').map(e=>({kind:'i',x:e.point.x,z:e.point.z,radius:e.s.radius,life:e.life}));if(!zones.length&&!this.rinkSurface)return;this.rinkSurface??=new IceSurface(this.a.scene);this.rinkSurface.update(zones);}
 trip(v,owner,dir,damage=0){if(v.slipImmune>0||this.a.hit(v,damage,dir,0,owner)===false)return false;this.interrupt(v);v.knockdown=.75;v.slipImmune=2.5;this.controlled.add(v);const d=v.dir||dir;v.motion?.start(d.x,d.z,1.8);this.burst(v,.6);return true;}
 update(dt){for(const v of this.controlled){for(const k of ['knockdown','rooted','slipImmune','greenFrost','frozen'])v[k]=Math.max(0,(v[k]||0)-dt);if(!v.knockdown&&!v.rooted&&!v.slipImmune&&!v.greenFrost&&!v.frozen)this.controlled.delete(v);}
 for(let i=this.effects.length-1;i>=0;i--){const e=this.effects[i],s=e.s;e.life-=dt;e.age+=dt;e.tick-=dt;let done=e.life<=0;if(done){if(e.type==='iceberg')this.shatterIceberg(e);if(e.ward)e.ward.life=0;this.a.remove(e.mesh);this.effects.splice(i,1);continue;}
 if(e.type==='beam')this.updateBeam(e,dt);
 if(e.type==='shot'||e.type==='punch'){const dist=Math.min(s.speed*dt,s.range-e.distance),steps=Math.max(1,Math.ceil(dist/.07));for(let j=0;j<steps&&!done;j++){const from=e.mesh.position.clone(),to=from.clone().addScaledVector(e.dir,dist/steps);const ward=this.a.wards.find(w=>w.owner!==e.owner&&w.hp>0&&crossesWard(from,to,w,.2));if(ward||this.a.collides(to.x,to.z,.2)||this.a.wallBlocks(from,to)){if(ward)ward.hp-=roundDamage(s.damage);this.burst(from,s.radius);done=true;break;}e.mesh.position.copy(to);e.point={x:to.x,z:to.z};e.distance+=dist/steps;if(e.type==='punch'){e.owner.x=to.x;e.owner.z=to.z;this.area(e,e.point,.85,{once:true,force:1.5,root:.55});if(e.hit.size)done=true;}else{const target=this.a.targets(e.owner).find(v=>this.a.screenHit({mesh:e.mesh,owner:e.owner},from,to,v));if(target){if(s.op==='w')this.area(e,{...e.point,y:1},s.radius);else{if(this.a.hit(target,s.damage,e.dir,0,e.owner)!==false)target.slow=Math.max(target.slow||0,s.slow);}this.burst(e.point,s.radius);done=true;}}if(e.distance>=s.range)done=true;}if(s.op==='w')e.projectile.rotation.z+=dt*3;}
 if(e.type==='fall'){if(e.age>=.55&&!e.struck){e.struck=true;e.ice.visible=true;e.ice.position.y=.65;this.area(e);this.burst(e.point,s.radius);}e.ice.scale.y=e.struck?Math.max(.1,e.life*5):2.5;}
 if(e.type==='iceberg'){const rise=1-Math.pow(1-Math.min(1,e.age/.22),3);e.rock.position.y=-3.3*(1-rise);e.cracks.scale.setScalar(Math.min(1,.1+e.age/.13));if(e.ward.hp<=0||e.ward.life<=0)done=true;}
 if(e.type==='iceDebris'){for(const m of e.mesh.children){const d=m.userData,t=Math.min(e.age,d.land),u=t/d.land,melt=Math.max(0,Math.min(1,(e.age-2.4)/2.6)),scale=1-melt; m.position.copy(d.origin).addScaledVector(d.velocity,t);m.rotation.set(d.rotation.x*u,d.rotation.y*u,d.rotation.z*u);m.scale.setScalar(scale);const floor=.055-d.minY,vy=.7;m.position.y=e.age<d.land?d.origin.y+vy*t+(floor-d.origin.y-vy*d.land)*u*u:.055-d.minY*scale;m.material.opacity=d.opacity*(1-melt*.8);}}

 if(e.type==='wall'){e.mesh.scale.y=Math.min(1,e.age/.15);if(e.ward.hp<=0||e.ward.life<=0)done=true;}
 if(['fog','frostbite','blizzard'].includes(e.type)){for(const m of e.mesh.children){const i=m.userData.flake??m.userData.fog??0,a=i*2.4+e.age*(e.type==='blizzard'?3:.2),r=s.radius*Math.sqrt(((i*.618+e.age*.3)%1));if(e.type==='blizzard')m.position.set(Math.cos(a)*r,.2+(i%9)/9*2.5,Math.sin(a)*r);else{const t=(i*.137+e.age*.55)%1,angle=Math.atan2(e.dir.z,e.dir.x)+(Math.sin(i)*1.02);m.position.set(Math.cos(angle)*s.radius*t,.25+Math.sin(i*2)*.25+t*.6,Math.sin(angle)*s.radius*t);}m.rotation.y+=dt*2;}if(e.tick<=0){e.tick=.3;if(e.type==='fog')this.area(e,e.point,s.radius,{cone:true,damage:0});if(e.type==='blizzard'){this.area(e,e.point,s.radius,{damage:s.damage});for(const v of this.a.targets(e.owner)){if(!this.a.areaHit(v,e.point,s.radius)||!this.a.clearPath(e.point,v)){e.dwell.delete(v);continue;}const time=(e.dwell.get(v)||0)+.3;e.dwell.set(v,time);v.motion?.start(e.point.x-v.x,e.point.z-v.z,.3);if(time>=1.5&&time<1.8){v.rooted=Math.max(v.rooted||0,.6);this.controlled.add(v);}}}}}
 if(e.type==='rink'&&e.tick<=0){e.tick=.1;for(const v of this.a.targets(e.owner)){if(v.slipImmune>0||!this.a.areaHit(v,e.point,s.radius,null,false,false,.12)||!this.a.clearPath(e.point,v))continue;this.trip(v,e.owner,e.dir,s.damage);}}
 if(e.type==='cut')e.mesh.scale.setScalar(1+(1-e.life/e.max)*.15);
 if(done){if(e.type==='iceberg')this.shatterIceberg(e);if(e.ward)e.ward.life=0;this.a.remove(e.mesh);this.effects.splice(i,1);}
 }this.updateRinkSurface();}
}
