import * as T from './three.module.js';
export class ChargeCamera{
 constructor(){this.level=0;this.time=0;this.kick=0;}
 fire(tier){this.kick=Math.min(.16,.045*tier);}
 update(dt,active,tier,progress=0){this.time+=dt;const target=active?Math.min(3,tier+progress*.25):0;this.level+=(target-this.level)*(1-Math.exp(-dt/(active?.35:.5)));this.kick*=Math.exp(-dt*10);const shake=Math.max(0,this.level-2)*.075+this.kick;return {distance:1-this.level*.115,fov:38+this.level*3.2,x:Math.sin(this.time*43)*shake,y:Math.sin(this.time*57+.7)*shake*.65};}
}
const ringGeometry=new T.RingGeometry(.30,.32,64),glowGeometry=new T.RingGeometry(.24,.39,64);
function material(color,opacity){return new T.MeshBasicMaterial({color,transparent:true,opacity,blending:T.AdditiveBlending,depthWrite:false,side:T.DoubleSide});}
function runeRing(color){const g=new T.Group();for(const [geo,alpha] of [[glowGeometry,.16],[ringGeometry,.95]])g.add(new T.Mesh(geo,material(color,alpha)));const inner=new T.Mesh(ringGeometry,material(color,.65));inner.scale.setScalar(.73);g.add(inner);for(let i=0;i<8;i++){const mark=new T.Mesh(new T.PlaneGeometry(.035,.085),material(color,.85));const a=i*Math.PI/4;mark.position.set(Math.cos(a)*.27,Math.sin(a)*.27,.002);mark.rotation.z=a;g.add(mark);}return g;}
function tint(group,color){group.traverse(o=>o.material?.color.set(color));}
function dispose(group){group.traverse(o=>{if(o.geometry&&o.geometry!==ringGeometry&&o.geometry!==glowGeometry)o.geometry.dispose();o.material?.dispose();});group.removeFromParent();}
export class CastingFeedback{
 constructor(scene){this.scene=scene;this.actors=new Map();this.bursts=[];this.time=0;}
 actor(key){if(this.actors.has(key))return this.actors.get(key);const group=new T.Group();this.scene.add(group);const rings=Array.from({length:3},()=>{const r=runeRing('#ffffff');group.add(r);return r;});const dots=[];for(let i=0;i<48;i++){const dot=new T.Mesh(new T.CircleGeometry(.018,6),material('#ffffff',.8));group.add(dot);dots.push(dot);}const state={group,rings,dots};this.actors.set(key,state);return state;}
 charge(key,active,stage,color,positions,camera){const s=this.actor(key);s.group.visible=active&&!!positions&&key.g.visible;if(!s.group.visible)return;
 const center=positions.LeftHand.clone().add(positions.RightHand).multiplyScalar(.5);s.group.position.copy(center);s.group.quaternion.copy(camera.quaternion);
 s.rings.forEach((r,i)=>{r.visible=i<stage;if(!r.visible)return;tint(r,color);r.position.set(0,(i-(stage-1)/2)*.14,i*.03);r.rotation.z=this.time*(i%2?-1:1)*.65;r.scale.setScalar(1+Math.sin(this.time*6+i)*.04+i*.12);});
 s.dots.forEach((dot,i)=>{const t=(this.time*.6+i/48)%1,a=i*2.399+this.time*.7,r=.20+t*.36;dot.position.set(Math.cos(a)*r,Math.sin(a)*r+t*.12,.04);dot.material.color.set(color);dot.material.opacity=Math.sin(Math.PI*t)*.9;dot.scale.setScalar(.6+Math.sin(this.time*9+i)**2);});
 }
 fire(position,direction,color,tier=1){if(this.bursts.length>=12){dispose(this.bursts.shift().group);}const group=runeRing(color);group.position.copy(position);group.quaternion.setFromUnitVectors(new T.Vector3(0,0,1),direction.clone().normalize());this.scene.add(group);const flash=new T.Mesh(new T.CircleGeometry(.22,32),material('#ffffff',1));group.add(flash);this.bursts.push({group,age:0,tier,flash});}
 update(dt){this.time+=dt;for(let i=this.bursts.length-1;i>=0;i--){const b=this.bursts[i];b.age+=dt;const t=b.age/.32;b.group.scale.setScalar(.7+t*(2+b.tier*.4));b.group.traverse(o=>{if(o.material)o.material.opacity=Math.max(0,1-t)*(o===b.flash?.65:1);});if(t>=1){dispose(b.group);this.bursts.splice(i,1);}}}
 clear(){for(const b of this.bursts)dispose(b.group);this.bursts=[];for(const s of this.actors.values())s.group.visible=false;}
}

export function impactFeedback(actor,damage,dir,force){
 if(damage>0)actor.hitFlash=.12;
 if(force)actor.motion.start(dir.x,dir.z,force);
 else if(damage>0&&dir.lengthSq()>1e-8&&!actor.motion.active)actor.motion.start(dir.x,dir.z,.22);
}
