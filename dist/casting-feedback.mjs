import * as T from './three.module.js';
export class ChargeCamera{
 constructor(){this.clear();}
 clear(){this.level=0;this.time=0;this.kick=0;this.flash=0;}
 fire(tier){const i=Math.max(0,Math.min(2,tier-1));this.kick=[.07,.12,.18][i];this.flash=[.12,.18,.25][i];}
 update(dt,active,tier,progress=0){
  this.time+=dt;const target=active?Math.min(3,tier+progress*.25):0;
  this.level+=(target-this.level)*(1-Math.exp(-dt/(active?.35:.5)));
  this.kick*=Math.exp(-dt*14);this.flash=Math.max(0,this.flash-dt*1.8);
  const chargeShake=Math.min(1,Math.max(0,this.level-1))*.0039+Math.max(0,this.level-2)*.0065;
  const shake=chargeShake+this.kick;
  return {distance:1-this.level*.115+this.kick*.07,fov:38+this.level*3.2,
   x:(Math.sin(this.time*43)+Math.sin(this.time*71)*.3)*shake,
   y:(Math.sin(this.time*57+.7)+Math.cos(this.time*83)*.25)*shake*.7,flash:this.flash};
 }
}
export const RUNE_STROKE=.0408;
const ringGeometry=new T.RingGeometry(.94,1.06,80),glowGeometry=new T.PlaneGeometry(2.6,2.6),lineGeometry=new T.PlaneGeometry(1,1);
function material(color,opacity){const m=new T.MeshBasicMaterial({color,transparent:true,opacity,blending:T.AdditiveBlending,depthWrite:false,side:T.DoubleSide});m.userData.opacity=opacity;return m;}
// A radial alpha texture keeps the center fully transparent, with light only at the rim.
const glowSize=256,glowPixels=new Uint8Array(glowSize*glowSize*4);
for(let y=0;y<glowSize;y++)for(let x=0;x<glowSize;x++){
 const r=Math.hypot((x+.5)/glowSize*2.6-1.3,(y+.5)/glowSize*2.6-1.3),i=(y*glowSize+x)*4;
 glowPixels[i]=glowPixels[i+1]=glowPixels[i+2]=255;
 glowPixels[i+3]=r<.80||r>1.20?0:Math.round(255*Math.exp(-(((r-1)/.085)**2)));
}
const rimGlow=new T.DataTexture(glowPixels,glowSize,glowSize);rimGlow.magFilter=T.LinearFilter;rimGlow.minFilter=T.LinearFilter;rimGlow.needsUpdate=true;
function runeRing(){const g=new T.Group();for(const [geo,alpha] of [[glowGeometry,.45],[glowGeometry,.7],[ringGeometry,1]]){const mat=material('#ffffff',alpha);if(geo===glowGeometry)mat.map=rimGlow;g.add(new T.Mesh(geo,mat));}return g;}
export function runeLayout(stage,colors){
 const c=Array.isArray(colors)?colors:[colors],main=c[0]||'#ffffff',level=Math.max(1,Math.min(3,stage));
 const rings=[{x:0,y:0,r:.34,color:main,white:level===1}];
 if(level>=2){rings.push({x:0,y:0,r:.18,color:main});rings.push({x:level===2?.30:.62,y:level===2?.20:.12,r:.15,color:c[1]||main});}
 if(level===3)rings.push({x:.82,y:.56,r:.12,color:c[2]||main});
 return {rings,links:level===3?[[0,2],[2,3]]:[]};
}
function dispose(group){group.traverse(o=>{if(o.geometry&&![ringGeometry,glowGeometry,lineGeometry].includes(o.geometry))o.geometry.dispose();o.material?.dispose();});group.removeFromParent();}
function diagram(){const group=new T.Group(),rings=Array.from({length:4},()=>{const r=runeRing();group.add(r);return r;}),links=Array.from({length:2},()=>{const g=new T.Group();for(const opacity of [.15,.85])g.add(new T.Mesh(lineGeometry,material('#ffffff',opacity)));group.add(g);return g;});return {group,rings,links};}
function arrange(s,stage,colors,time=0){const layout=runeLayout(stage,colors),pulse=1+Math.sin(time*5)*.025;
 s.rings.forEach((r,i)=>{const spec=layout.rings[i];r.visible=!!spec;if(!spec)return;r.position.set(spec.x,spec.y,.01);r.scale.setScalar(spec.r*pulse);r.children.forEach((m,j)=>m.material.color.set(j===2&&spec.white?'#ffffff':spec.color));});
 s.links.forEach((line,i)=>{const pair=layout.links[i];line.visible=!!pair;if(!pair)return;const a=layout.rings[pair[0]],b=layout.rings[pair[1]],dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy),ux=dx/d,uy=dy/d,length=d-a.r-b.r;
 line.position.set((a.x+ux*a.r+b.x-ux*b.r)/2,(a.y+uy*a.r+b.y-uy*b.r)/2,0);line.rotation.z=Math.atan2(dy,dx);line.children.forEach((m,j)=>{m.scale.set(length,j===0?.10:RUNE_STROKE,1);m.material.color.set(b.color);});});return layout;
}
const noise=n=>{const x=Math.sin(n*127.1+311.7)*43758.5453;return x-Math.floor(x);};
export class CastingFeedback{
 constructor(scene){this.scene=scene;this.actors=new Map();this.bursts=[];this.beams=[];this.time=0;}
 actor(key){if(this.actors.has(key))return this.actors.get(key);const state=diagram();this.scene.add(state.group);state.dots=[];for(let i=0;i<48;i++){const dot=new T.Mesh(new T.CircleGeometry(.014,6),material('#ffffff',.8));state.group.add(dot);state.dots.push(dot);}this.actors.set(key,state);return state;}
 charge(key,active,stage,colors,positions,camera){const s=this.actor(key);s.group.visible=active&&!!positions&&key.g.visible;if(!s.group.visible)return;
 s.group.position.copy(positions.LeftHand).add(positions.RightHand).multiplyScalar(.5);s.group.quaternion.copy(camera.quaternion);
 const layout=arrange(s,stage,colors,this.time);
 s.dots.forEach((dot,i)=>{const life=.45+noise(i)*.55,age=this.time/life+i*.618,cycle=Math.floor(age),t=age-cycle,spec=layout.rings[i%layout.rings.length],angle=noise(i+cycle*49)*Math.PI*2,travel=t*(.25+noise(i+cycle+80)*.45),r=spec.r+travel;
 dot.position.set(spec.x+Math.cos(angle)*r,spec.y+Math.sin(angle)*r-t*t*.10,.04);dot.material.color.set(i%4===0?'#ffffff':spec.color);dot.material.opacity=(1-t)*(.65+.3*Math.sin(t*30+i)**2);dot.scale.setScalar(.5+noise(i+cycle*13));});
 }
 fire(position,direction,colors,tier=1){if(this.bursts.length>=12)dispose(this.bursts.shift().group);const state=diagram(),{group}=state;arrange(state,tier,colors);group.position.copy(typeof position==='function'?position():position);group.quaternion.setFromUnitVectors(new T.Vector3(0,0,1),direction.clone().normalize());this.scene.add(group);this.bursts.push({group,age:0,tier,follow:typeof position==='function'?position:null});}
 beam(start,target,colors,visible=()=>true,tier=1){
  const color=Array.isArray(colors)?colors[0]:colors,follow=typeof start==='function'?start:null;start=follow?follow():start;
  if(this.beams.length>=12)dispose(this.beams.shift().group);
  const group=new T.Group(),segments=[],source=diagram();arrange(source,tier,colors);source.group.position.copy(start);group.add(source.group);this.scene.add(group);
  for(let i=0;i<8;i++){const layers=[];for(const [radius,opacity,tint] of [[RUNE_STROKE*1.6,.17,color],[RUNE_STROKE*.5,.95,color]]){const mesh=new T.Mesh(new T.CylinderGeometry(radius,radius,1,6),material(tint,opacity));group.add(mesh);layers.push(mesh);}segments.push(layers);}
  const beam={group,segments,follow,source:source.group,start:start.clone(),end:start.clone(),target,visible,age:0,fade:null};this.beams.push(beam);this.updateBeam(beam,0);return beam;
 }
 updateBeam(b,dt){
  b.age+=dt;if(b.follow){b.start.copy(b.follow());b.source.position.copy(b.start);}const result=b.target();if(result?.point)b.end.copy(result.point);if((!result?.active||b.age>4)&&b.fade===null)b.fade=0;if(b.fade!==null)b.fade+=dt;
  b.group.visible=b.visible();const delta=b.end.clone().sub(b.start),side=new T.Vector3(-delta.z,0,delta.x);if(side.lengthSq()<1e-8)side.set(1,0,0);side.normalize();const length=delta.length(),points=[];if(length>.001)b.source.quaternion.setFromUnitVectors(new T.Vector3(0,0,1),delta.clone().normalize());b.source.traverse(o=>{if(o.material)o.material.opacity=o.material.userData.opacity*(b.fade===null?1:Math.max(0,1-b.fade/.24));});
  for(let i=0;i<=8;i++){const t=i/8,offset=i===0||i===8?0:Math.sin(i*7.13)*Math.min(.16,length*.025);points.push(b.start.clone().addScaledVector(delta,t).addScaledVector(side,offset));}
  for(let i=0;i<8;i++){const a=points[i],c=points[i+1],d=c.clone().sub(a),n=d.length();for(const mesh of b.segments[i]){mesh.position.copy(a).add(c).multiplyScalar(.5);mesh.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize());mesh.scale.y=n;mesh.material.opacity=mesh.material.userData.opacity*(b.fade===null?1:Math.max(0,1-b.fade/.24));}}
 }
 update(dt){this.time+=dt;for(let i=this.beams.length-1;i>=0;i--){const b=this.beams[i];this.updateBeam(b,dt);if(b.fade>=.24){dispose(b.group);this.beams.splice(i,1);}}for(let i=this.bursts.length-1;i>=0;i--){const b=this.bursts[i];b.age+=dt;if(b.follow)b.group.position.copy(b.follow());const t=b.age/.32;b.group.scale.setScalar(.7+t*(2+b.tier*.4));b.group.traverse(o=>{if(o.material)o.material.opacity=Math.max(0,1-t)*o.material.userData.opacity;});if(t>=1){dispose(b.group);this.bursts.splice(i,1);}}}
 clear(){for(const b of this.beams)dispose(b.group);this.beams=[];for(const b of this.bursts)dispose(b.group);this.bursts=[];for(const s of this.actors.values())s.group.visible=false;}
}

export function impactFeedback(actor,damage,dir,force){
 if(damage>0)actor.hitFlash=.12;
 if(force)actor.motion.start(dir.x,dir.z,force);
 else if(damage>0&&dir.lengthSq()>1e-8&&!actor.motion.active)actor.motion.start(dir.x,dir.z,.22);
}
