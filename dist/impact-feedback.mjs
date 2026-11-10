import * as T from './three.module.js';
import {DEFAULTS,normalize,watchImpactSettings,attackPose,hitPose,particleOffset} from './impact-settings.mjs';
const FORWARD=new T.Vector3(0,0,1);
export function applyActorImpact(g,attack,hit,attackDir,hitDir){
 const shift=(pose,dir)=>{if(!pose||!dir)return;g.position.addScaledVector(dir,pose.offset);if(pose.lean){const axis=new T.Vector3(dir.z,0,-dir.x).normalize();g.quaternion.premultiply(new T.Quaternion().setFromAxisAngle(axis,pose.lean));}};
 shift(attack,attackDir);shift(hit,hitDir);
 if(hit){g.scale.multiply(new T.Vector3(1+hit.squash,1-hit.squash,1+hit.squash*.4));}
 g.updateMatrixWorld(true);
}
// All temporary mesh changes are restored before simulation and collision checks.
export class ImpactFeedback{
 constructor(scene,{settings=null,watch=true}={}){this.scene=scene;this.settings=normalize(settings||DEFAULTS);this.time=0;this.freeze=0;this.attacks=new Map();this.hits=new Map();this.pending=new Map();this.restores=[];this.bursts=[];this.projectiles=new Map();this.shakeAt=-10;this.shakeStrength=0;this.appliedHits=0;this.appliedCasts=0;if(watch)this.unwatch=watchImpactSettings(s=>{this.settings=s;});}
 restore(){for(const restore of this.restores.reverse())restore();this.restores=[];}
 clear(){this.restore();for(const a of this.pending.keys())a.impactPending=false;this.pending.clear();this.attacks.clear();this.hits.clear();this.freeze=0;this.shakeAt=-10;for(const b of this.bursts)this.disposeGroup(b.group);this.bursts=[];for(const p of this.projectiles.values())this.disposeGroup(p.tail);this.projectiles.clear();}
 disposeGroup(g){g.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});g.removeFromParent();}
 step(dt,active=true){this.restore();if(!active)return 0;const consumed=Math.min(dt,this.freeze);this.freeze=Math.max(0,this.freeze-dt);const step=dt-consumed;this.time+=step;for(const [a,h] of this.hits)if(this.time-h.born>Math.max(h.s.recovery/1000,h.s.flash/1000))this.hits.delete(a);for(const [a,c] of this.attacks)if(!this.pending.has(a)&&this.time-c.born>(c.s.anticipation+c.s.follow)/1000+.01)this.attacks.delete(a);return step;}
 cast(actor,dir,emit){if(this.pending.has(actor))return false;const s={...this.settings},direction=new T.Vector3(dir.x,0,dir.z).normalize();this.attacks.set(actor,{born:this.time,s,dir:direction});this.appliedCasts++;actor.impactPending=true;this.pending.set(actor,{due:this.time+s.anticipation/1000,emit});return true;}
 flush(){for(const [actor,p] of this.pending){if(actor.dead||actor.hp<=0||actor.frozen>0||actor.knockdown>0){actor.impactPending=false;this.pending.delete(actor);this.attacks.delete(actor);continue;}if(this.time+1e-8>=p.due){this.pending.delete(actor);actor.impactPending=false;p.emit();}}}
 hit(actor,dir,damage){if(damage<=0)return;const s={...this.settings},direction=new T.Vector3(dir?.x||0,0,dir?.z||0);if(direction.lengthSq()<1e-8)direction.set(0,0,1);direction.normalize();this.hits.set(actor,{born:this.time,s,dir:direction});actor.hitFlash=s.flash/1000;this.appliedHits++;
 if(!actor.g?.visible)return;this.freeze=Math.max(this.freeze,s.freeze/1000);this.shakeAt=this.time;this.shakeStrength=s.shake;
 const group=new T.Group();group.position.set(actor.x,actor.monster?.65:1.2,actor.z);group.quaternion.setFromUnitVectors(FORWARD,direction);this.scene.add(group);
 for(let i=0;i<s.particles;i++){const mesh=new T.Mesh(new T.OctahedronGeometry(.045),new T.MeshBasicMaterial({color:i%3?0xa8e5ff:0xffffff,transparent:true}));group.add(mesh);}this.bursts.push({group,s,born:this.time});if(this.bursts.length>12)this.disposeGroup(this.bursts.shift().group);
 }
 remember(mesh){const p=mesh.position.clone(),q=mesh.quaternion.clone(),s=mesh.scale.clone();this.restores.push(()=>{mesh.position.copy(p);mesh.quaternion.copy(q);mesh.scale.copy(s);mesh.updateMatrixWorld(true);});}
 actor(actor){if(!actor.g)return;const a=this.attacks.get(actor),h=this.hits.get(actor);if(!a&&!h)return;this.remember(actor.g);applyActorImpact(actor.g,a?attackPose(a.s,this.time-a.born):null,h?hitPose(h.s,this.time-h.born):null,a?.dir,h?.dir);
 if(h&&hitPose(h.s,this.time-h.born).flash){for(const entry of actor.g.userData.palette||[]){const m=entry.material,color=m.color.clone(),emissive=m.emissive?.clone();this.restores.push(()=>{m.color.copy(color);if(emissive)m.emissive.copy(emissive);});m.color.set(0xffffff);m.emissive?.set(0xffffff);}}
 if(a&&this.time-a.born>(a.s.anticipation+a.s.follow)/1000+.01)this.attacks.delete(actor);if(h&&this.time-h.born>Math.max(h.s.recovery/1000,h.s.flash/1000))this.hits.delete(actor);
 }
 camera(camera,reduced=false){const age=this.time-this.shakeAt,strength=age<.25?this.shakeStrength*(1-age/.25)*(reduced?.15:1):0;camera.position.x+=Math.sin(this.time*127)*strength;camera.position.y+=Math.cos(this.time*101)*strength;camera.updateMatrixWorld();}
 draw(effects=[]){for(let i=this.bursts.length-1;i>=0;i--){const b=this.bursts[i],age=this.time-b.born;if(age>=.65){this.disposeGroup(b.group);this.bursts.splice(i,1);continue;}b.group.children.forEach((p,n)=>{const o=particleOffset(b.s,n,age);p.position.set(o.side,o.up,o.forward);p.rotation.set(age*6+n,age*3,0);p.material.opacity=1-age/.65;});}
 const live=new Set();for(const e of effects){if(!['shot','projectile'].includes(e.type)||!e.mesh?.parent)continue;live.add(e);let p=this.projectiles.get(e);if(!p){const tail=new T.Group();this.scene.add(tail);for(let i=0;i<12;i++)tail.add(new T.Mesh(new T.SphereGeometry(.06,6,4),new T.MeshBasicMaterial({color:0xb3eaff,transparent:true,depthWrite:false})));p={origin:e.mesh.position.clone(),tail,range:e.s?.range||e.ctx?.range||e.speed*e.life||7};this.projectiles.set(e,p);}const s=this.settings,dir=e.dir||FORWARD,distance=e.mesh.position.distanceTo(p.origin),progress=Math.min(1,distance/p.range),raise=Math.sin(progress*Math.PI)*s.arc;
 this.remember(e.mesh);e.mesh.position.y+=raise;
 // Stretch along the mesh's actual flight direction, without changing its collider.
 const axis=dir.clone().applyQuaternion(e.mesh.quaternion.clone().invert());const factor=new T.Vector3(1,1,1).add(new T.Vector3(Math.abs(axis.x),Math.abs(axis.y),Math.abs(axis.z)).multiplyScalar(s.stretch-1));e.mesh.scale.multiply(factor);e.mesh.updateMatrixWorld(true);
 p.tail.visible=s.trail>0;p.tail.children.forEach((m,i)=>{const length=(i+1)/12*s.trail;m.visible=distance>=length;m.position.copy(e.mesh.position).addScaledVector(dir,-length);m.scale.setScalar(1-i/12);m.material.opacity=(1-i/12)*.6;});}
 for(const [e,p] of this.projectiles)if(!live.has(e)){this.disposeGroup(p.tail);this.projectiles.delete(e);}
 }
 stats(){return {settings:{...this.settings},casts:this.appliedCasts,hits:this.appliedHits,pending:this.pending.size,freeze:this.freeze,bursts:this.bursts.length,projectiles:this.projectiles.size};}
}
