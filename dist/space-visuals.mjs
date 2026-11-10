import * as T from './three.module.js';
import {SPACE_SKILLS} from './space-skills.mjs?v=run-walk-1';
export class SpaceVisuals{
 constructor(scene){this.scene=scene;this.pool=[];this.used=0;this.geometries={sphere:new T.IcosahedronGeometry(1,1),cone:new T.ConeGeometry(1,1,7),box:new T.BoxGeometry(1,1,1),ring:new T.TorusGeometry(1,.045,5,36)};}
 mesh(shape,color,x,y,z,sx,sy,sz,opacity=.7,ry=0){const index=this.used++;let m=this.pool[index];if(!m){m=new T.Mesh(this.geometries[shape],new T.MeshBasicMaterial({transparent:true,depthWrite:false}));this.pool.push(m);this.scene.add(m);}m.geometry=this.geometries[shape];m.material.color.setHex(color);m.material.opacity=opacity;m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.rotation.set(shape==='ring'?Math.PI/2:0,ry,0);m.visible=true;return m;}
 update(actors){this.used=0;for(const a of actors){const r=a.roll;if(!r)continue;const color=(SPACE_SKILLS[r.kind]||SPACE_SKILLS.q).color;
 for(const z of r.zones){const fade=Math.min(1,z.life/.4),c=SPACE_SKILLS[z.kind].color;
 if(z.kind==='p'){for(let j=0;j<7;j++){const angle=j*2.4;this.mesh('sphere',0x9caa85,z.x+Math.cos(angle)*.7,.55+(j%3)*.25,z.z+Math.sin(angle)*.7,.7,.6,.7,.45*fade);}}
 else if(z.kind==='q'){this.mesh('sphere',0x38221b,z.x,.04,z.z,z.radius,.04,z.radius,.7*fade);for(let j=0;j<7;j++){const angle=j*2.4,h=.4+.25*Math.sin(z.life*12+j);this.mesh('cone',j%2?0xff4c16:0xffbd36,z.x+Math.cos(angle)*.6,h/2,z.z+Math.sin(angle)*.6,.18,h,.18,.85*fade);}}
 else if(z.kind==='i'){this.mesh('sphere',c,z.x,.045,z.z,z.radius,.035,z.radius,.45*fade);this.mesh('cone',0xd3f4ff,z.x,.12,z.z,.15,.25,.15,.6*fade);}
 else if(z.kind==='l'){this.mesh('sphere',c,z.x,.9,z.z,.3,.8,.3,.3*fade);}
 else if(z.kind==='g'){this.mesh('ring',c,z.x,.08,z.z,.5,.5,.5,.6*fade);}
 else if(z.kind==='t'){this.mesh('ring',c,z.x,.06,z.z,z.radius,z.radius,z.radius,.8*fade);for(let j=0;j<4;j++){const angle=j*Math.PI/2;this.mesh('box',c,z.x+Math.cos(angle)*1.25,.05,z.z+Math.sin(angle)*1.25,.45,.06,.2,.5*fade,angle);}}
 }
 if(!r.active)continue;const angle=Math.atan2(r.faceX,r.faceZ);
 if(r.kind==='d'){for(let j=0;j<7;j++){const t=j/7*Math.PI*2;this.mesh('sphere',j%2?color:0x725640,a.x+Math.cos(t)*.45,.6+(j%2)*.35,a.z+Math.sin(t)*.45,.3,.5,.3,.95);}}
 else if(r.kind==='e'){this.mesh('box',color,a.x+r.faceX*.8,1,a.z+r.faceZ*.8,1.7,1.8,.12,.55,angle);}
 else if(r.kind==='s'){const arc=this.mesh('ring',color,a.x+r.faceX*.7,.8,a.z+r.faceZ*.7,1,1,1,.8);arc.geometry=this.arcGeometry??=new T.TorusGeometry(1,.065,5,24,Math.PI);arc.rotation.set(Math.PI/2,0,-angle);}
 else if(r.kind==='g'){const length=2.3;this.mesh('box',color,a.x+r.faceX*length/2,.3,a.z+r.faceZ*length/2,.035,.035,length,.7,angle);}
 else if(r.kind==='h'){this.mesh('box',color,a.x+r.faceX*.4,1.1,a.z+r.faceZ*.4,.8,.5,.45,.7,angle);}
 else{for(let j=0;j<4;j++)this.mesh('sphere',color,a.x-r.faceX*j*.3,.4+j*.15,a.z-r.faceZ*j*.3,.2,.2,.2,.65-j*.12);}
 }
 for(let i=this.used;i<this.pool.length;i++)this.pool[i].visible=false;
 }
}
