import * as T from './three.module.js';

// Original mesh-based spell effects. Shared instanced pools bound GPU resources.
const PALETTES={fire:[0xff4925,0xff9138,0xffd77b],ice:[0x4c9fce,0x80d9ee,0xdcffff],push:[0x92cc78,0xd8efaf],pull:[0x9873c9,0xd9b7ff]};
export class LowPolyVFX {
 constructor(scene){
  this.scene=scene;this.time=0;this.serial=0;this.active=[];this.transients=[];
  this.dummy=new T.Object3D();this.color=new T.Color();
  this.pools={};
  for(const [name,geometry] of Object.entries({chunk:new T.IcosahedronGeometry(1,0),shard:new T.OctahedronGeometry(1,0)})){
   const mesh=new T.InstancedMesh(geometry,new T.MeshStandardMaterial({flatShading:true,roughness:1,metalness:0,emissive:0x222222}),420);
   mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);mesh.frustumCulled=false;mesh.count=0;scene.add(mesh);this.pools[name]=mesh;
  }
 }
 particle(kind,position,velocity,size,color,life,options={}){
  if(this.active.length>=700)return;
  this.active.push({kind,p:new T.Vector3(...position),v:new T.Vector3(...velocity),size,color,life,max:life,spin:(Math.random()-.5)*5,rotation:Math.random()*6,gravity:options.gravity??0,stretch:options.stretch??1,delay:options.delay??0});
 }
 burst(spec,dir,caster,blocked){
  const cold=spec.kind==='i',palette=PALETTES[cold?'ice':'fire'];
  // Seed the entire struck cone immediately; following motion supplies the flow.
  const count=38+spec.rings*17;
  for(let i=0;i<count;i++){
   const a=Math.atan2(dir.z,dir.x)+(Math.random()-.5)*spec.halfAngle*2;
   const d=.35+Math.sqrt(Math.random())*(spec.range-.35),dx=Math.cos(a),dz=Math.sin(a);
   let clear=true;for(let t=.25;t<=d;t+=.25)if(blocked(caster.x+dx*t,caster.z+dz*t,.03)){clear=false;break;}if(!clear)continue;
   const x=caster.x+dx*d,z=caster.z+dz*d;
   const size=(cold?.09:.14)+Math.random()*(cold?.13:.21),life=cold?.32+Math.random()*.3:.28+Math.random()*.35;
   this.particle(cold?'shard':'chunk',[x,.25+Math.random()*.55,z],[dx*.25,cold?.25:.8,dz*.25],size,palette[i%3],life,{gravity:cold?1:-.3,stretch:cold?2.8:1.65});
   if(i%4===0)this.particle('shard',[x,.5,z],[dx*.45,1.2+Math.random(),dz*.45],.045,cold?0xe0ffff:0xffe69c,.65,{gravity:1.5});
   if(!cold&&i%6===0)this.particle('chunk',[x,.6,z],[dx*.12,1.1,dz*.12],.22,0x616274,.7,{delay:.15,stretch:1.1});
  }
 }
 segment(parent,a,b,r,color){
  const d=b.clone().sub(a),m=new T.Mesh(new T.CylinderGeometry(r*.65,r,d.length(),5),new T.MeshBasicMaterial({color}));
  m.position.copy(a).add(b).multiplyScalar(.5);m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize());parent.add(m);return m;
 }
 bolt(x,z,spec){
  const g=new T.Group();g.position.set(x,0,z);this.scene.add(g);
  const pts=[];for(let i=0;i<=8;i++)pts.push(new T.Vector3(i===8?0:(Math.random()-.5)*.7*spec.rings,spec.height*(1-i/8)+.12,(Math.random()-.5)*.3));
  for(let i=1;i<pts.length;i++){
   this.segment(g,pts[i-1],pts[i],.055*spec.rings,0xffc95c);
   this.segment(g,pts[i-1],pts[i],.022*spec.rings,0xfffce0);
   if(i===3||i===5){const end=pts[i].clone().add(new T.Vector3((i%2?1:-1)*.65*spec.rings,-.6,.3));this.segment(g,pts[i],end,.025*spec.rings,0xffe8a4);}
  }
  this.transients.push({g,life:.3,max:.3,type:'bolt'});
  this.pulse(x,z,spec.radius*2.3,0xffe195,.4);
  for(let i=0;i<22+spec.rings*7;i++){const a=Math.random()*Math.PI*2,s=1+Math.random()*3;this.particle('shard',[x,.18,z],[Math.cos(a)*s,.5+Math.random()*3,Math.sin(a)*s],.035+Math.random()*.07,i%2?0xffd16d:0xfffbe5,.3+Math.random()*.35,{gravity:7,stretch:2});}
 }
 fall(x,z,spec,color){
  const g=new T.Group();g.position.set(x,spec.height,z);this.scene.add(g);
  const cold=spec.kind==='i',force='wg'.includes(spec.kind);
  const core=new T.Mesh(force?new T.TorusGeometry(.35,.07,5,12):cold?new T.OctahedronGeometry(.3,0):new T.IcosahedronGeometry(.32,1),new T.MeshBasicMaterial({color}));
  if(force)core.rotation.x=Math.PI/2;else core.scale.y=cold?2.6:1.5;g.add(core);
  for(let i=0;i<6;i++){const trail=new T.Mesh(new T.ConeGeometry(.08+(6-i)*.025,.5,5),new T.MeshBasicMaterial({color,transparent:true,opacity:.7-i*.08}));trail.position.set((Math.random()-.5)*.2,.4+i*.28,(Math.random()-.5)*.2);g.add(trail);}
  this.transients.push({g,life:.28,max:.28,type:'fall',height:spec.height});
 }
 pulse(x,z,r,color,life){
  const g=new T.Mesh(new T.RingGeometry(.86,1,12),new T.MeshBasicMaterial({color,side:T.DoubleSide,transparent:true,opacity:.7,depthWrite:false}));g.rotation.x=-Math.PI/2;g.position.set(x,.13,z);this.scene.add(g);this.transients.push({g,life,max:life,type:'pulse',r});
 }
 force(spec,dir,caster){
  const pull=spec.force<0,g=new T.Group();g.position.set(caster.x,.18,caster.z);g.rotation.y=-Math.atan2(dir.z,dir.x);this.scene.add(g);
  const color=pull?0xc6a3ff:0xc8eda0;
  // Three faceted upright ribbons reveal the wave's volume without hiding the floor.
  for(let layer=0;layer<3;layer++){
   const vertices=[];const segments=14;
   for(let i=0;i<segments;i++){
    const a=-spec.halfAngle+i/segments*2*spec.halfAngle,b=-spec.halfAngle+(i+1)/segments*2*spec.halfAngle,r=1-layer*.09,h=.08+layer*.045;
    const p=[Math.cos(a)*r,0,Math.sin(a)*r],q=[Math.cos(b)*r,0,Math.sin(b)*r],u=[q[0],h,q[2]],v=[p[0],h,p[2]];vertices.push(...p,...q,...u,...p,...u,...v);
   }
   const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(vertices,3));
   const m=new T.Mesh(geo,new T.MeshBasicMaterial({color,side:T.DoubleSide,transparent:true,opacity:.65-layer*.13,depthWrite:false}));g.add(m);
  }
  this.transients.push({g,life:spec.range/spec.speed,max:spec.range/spec.speed,type:'wave',r:spec.range,pull});
  for(let i=0;i<24;i++){const a=Math.atan2(dir.z,dir.x)+(Math.random()-.5)*spec.halfAngle*2,d=pull?spec.range:.4,s=(pull?-1:1)*spec.speed*.75;this.particle('shard',[caster.x+Math.cos(a)*d,.2+Math.random()*.3,caster.z+Math.sin(a)*d],[Math.cos(a)*s,0,Math.sin(a)*s],.05,color,spec.range/spec.speed,{stretch:1.6});}
 }
 ward(m,width){
  // Each panel has its own geometry so the game's normal wall cleanup is safe.
  for(let col=0;col<5;col++)for(let row=0;row<3;row++){
   const geo=new T.CircleGeometry(.23,6),panel=new T.Mesh(geo,new T.MeshBasicMaterial({color:(col+row)%2?0xa3e9ff:0x59b1dc,transparent:true,opacity:.19,side:T.DoubleSide,depthWrite:false}));
   panel.position.set((col-2)*width/5,(row-1)*.64,.075);panel.scale.set(width/2.6,1.2,1);m.add(panel);
   const edge=new T.LineLoop(new T.BufferGeometry().setFromPoints(Array.from({length:6},(_,i)=>new T.Vector3(Math.cos(i*Math.PI/3)*.23,Math.sin(i*Math.PI/3)*.23,0))),new T.LineBasicMaterial({color:0xbcf2ff,transparent:true,opacity:.55}));panel.add(edge);
  }
  for(const side of[-1,1]){const p=new T.Mesh(new T.OctahedronGeometry(.14,0),new T.MeshBasicMaterial({color:0xe0faff}));p.position.set(side*(width/2-.07),-1.05,0);p.scale.y=2;m.add(p);}
  this.pulse(m.position.x,m.position.z,width*.55,0x93d9ff,.45);
 }
 shatter(x,z,width=2.6){for(let i=0;i<24;i++)this.particle('shard',[x+(Math.random()-.5)*width,.2+Math.random()*2,z],[(Math.random()-.5)*2,Math.random()*2,(Math.random()-.5)*2],.06+Math.random()*.09,0xa9eaff,.5+Math.random()*.25,{gravity:5,stretch:1.8});}
 disposeObject(g){this.scene.remove(g);g.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});}
 clear(){this.active.length=0;for(const t of this.transients)this.disposeObject(t.g);this.transients.length=0;for(const p of Object.values(this.pools))p.count=0;}
 update(dt){
  this.time+=dt;const counts={chunk:0,shard:0};
  for(let i=this.active.length-1;i>=0;i--){const p=this.active[i];if(p.delay>0){p.delay-=dt;continue;}p.life-=dt;if(p.life<=0){this.active.splice(i,1);continue;}p.p.addScaledVector(p.v,dt);p.v.y-=p.gravity*dt;p.rotation+=p.spin*dt;
   const pool=this.pools[p.kind],index=counts[p.kind]++;if(index>=420){counts[p.kind]=420;continue;}
   const age=1-p.life/p.max,scale=p.size*Math.min(1,(1-age)*3)*(1+age*.25);this.dummy.position.copy(p.p);this.dummy.rotation.set(p.rotation*.4,p.rotation,p.rotation*.7);this.dummy.scale.set(scale,scale*p.stretch,scale);this.dummy.updateMatrix();pool.setMatrixAt(index,this.dummy.matrix);pool.setColorAt(index,this.color.setHex(p.color));
  }
  for(const [name,pool] of Object.entries(this.pools)){pool.count=counts[name];pool.instanceMatrix.needsUpdate=true;if(pool.instanceColor)pool.instanceColor.needsUpdate=true;}
  for(let i=this.transients.length-1;i>=0;i--){const t=this.transients[i];t.life-=dt;if(t.life<=0){this.disposeObject(t.g);this.transients.splice(i,1);continue;}const p=1-t.life/t.max;
   if(t.type==='pulse'){t.g.scale.setScalar(t.r*(.4+p*.6));t.g.material.opacity=(1-p)*.65;}
   if(t.type==='fall'){t.g.position.y=.15+t.height*(1-p);t.g.rotation.y+=dt*4;}
   if(t.type==='bolt')t.g.visible=p<.45||p>.6;
   if(t.type==='wave'){const r=Math.max(.05,t.r*(t.pull?1-p:p));t.g.scale.set(r,1,r);for(const m of t.g.children)m.material.opacity=(1-p)*.55;}
  }
 }
 stats(){return {particles:this.active.length,effects:this.transients.length,style:'lowpoly-v1'};}
}
