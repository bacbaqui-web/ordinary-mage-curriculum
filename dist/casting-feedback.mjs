import * as T from './three.module.js';
export class ChargeCamera{
 constructor(){this.level=0;this.time=0;this.kick=0;}
 fire(tier){this.kick=Math.min(.16,.045*tier);}
 update(dt,active,tier,progress=0){this.time+=dt;const target=active?Math.min(3,tier+progress*.25):0;this.level+=(target-this.level)*(1-Math.exp(-dt/(active?.35:.5)));this.kick*=Math.exp(-dt*10);const shake=Math.max(0,this.level-2)*.075+this.kick;return {distance:1-this.level*.115,fov:38+this.level*3.2,x:Math.sin(this.time*43)*shake,y:Math.sin(this.time*57+.7)*shake*.65};}
}
const ringGeometry=new T.RingGeometry(.97,1.03,80),glowGeometry=new T.RingGeometry(.85,1.15,80),lineGeometry=new T.PlaneGeometry(1,1);
function material(color,opacity){const m=new T.MeshBasicMaterial({color,transparent:true,opacity,blending:T.AdditiveBlending,depthWrite:false,side:T.DoubleSide});m.userData.opacity=opacity;return m;}
function runeRing(){const g=new T.Group();for(const [geo,alpha,scale] of [[glowGeometry,.10,1.1],[glowGeometry,.23,1],[ringGeometry,.95,1]]){const m=new T.Mesh(geo,material('#ffffff',alpha));m.scale.setScalar(scale);g.add(m);}return g;}
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
 line.position.set((a.x+ux*a.r+b.x-ux*b.r)/2,(a.y+uy*a.r+b.y-uy*b.r)/2,0);line.rotation.z=Math.atan2(dy,dx);line.children.forEach((m,j)=>{m.scale.set(length,j===0?.05:.012,1);m.material.color.set(b.color);});});return layout;
}
const noise=n=>{const x=Math.sin(n*127.1+311.7)*43758.5453;return x-Math.floor(x);};
export class CastingFeedback{
 constructor(scene){this.scene=scene;this.actors=new Map();this.bursts=[];this.time=0;}
 actor(key){if(this.actors.has(key))return this.actors.get(key);const state=diagram();this.scene.add(state.group);state.dots=[];for(let i=0;i<48;i++){const dot=new T.Mesh(new T.CircleGeometry(.014,6),material('#ffffff',.8));state.group.add(dot);state.dots.push(dot);}this.actors.set(key,state);return state;}
 charge(key,active,stage,colors,positions,camera){const s=this.actor(key);s.group.visible=active&&!!positions&&key.g.visible;if(!s.group.visible)return;
 s.group.position.copy(positions.LeftHand).add(positions.RightHand).multiplyScalar(.5);s.group.quaternion.copy(camera.quaternion);
 const layout=arrange(s,stage,colors,this.time);
 s.dots.forEach((dot,i)=>{const life=.45+noise(i)*.55,age=this.time/life+i*.618,cycle=Math.floor(age),t=age-cycle,spec=layout.rings[i%layout.rings.length],angle=noise(i+cycle*49)*Math.PI*2,travel=t*(.25+noise(i+cycle+80)*.45),r=spec.r+travel;
 dot.position.set(spec.x+Math.cos(angle)*r,spec.y+Math.sin(angle)*r-t*t*.10,.04);dot.material.color.set(i%4===0?'#ffffff':spec.color);dot.material.opacity=(1-t)*(.65+.3*Math.sin(t*30+i)**2);dot.scale.setScalar(.5+noise(i+cycle*13));});
 }
 fire(position,direction,colors,tier=1){if(this.bursts.length>=12)dispose(this.bursts.shift().group);const state=diagram(),{group}=state;arrange(state,tier,colors);group.position.copy(position);group.quaternion.setFromUnitVectors(new T.Vector3(0,0,1),direction.clone().normalize());this.scene.add(group);const flash=new T.Mesh(new T.CircleGeometry(.22,32),material('#ffffff',.65));group.add(flash);this.bursts.push({group,age:0,tier,flash});}
 update(dt){this.time+=dt;for(let i=this.bursts.length-1;i>=0;i--){const b=this.bursts[i];b.age+=dt;const t=b.age/.32;b.group.scale.setScalar(.7+t*(2+b.tier*.4));b.group.traverse(o=>{if(o.material)o.material.opacity=Math.max(0,1-t)*o.material.userData.opacity;});if(t>=1){dispose(b.group);this.bursts.splice(i,1);}}}
 clear(){for(const b of this.bursts)dispose(b.group);this.bursts=[];for(const s of this.actors.values())s.group.visible=false;}
}

export function impactFeedback(actor,damage,dir,force){
 if(damage>0)actor.hitFlash=.12;
 if(force)actor.motion.start(dir.x,dir.z,force);
 else if(damage>0&&dir.lengthSq()>1e-8&&!actor.motion.active)actor.motion.start(dir.x,dir.z,.22);
}
