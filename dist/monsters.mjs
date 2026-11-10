import {attachWolf,animateWolf} from './wolf-monster.mjs?v=points-1';
import * as T from './three.module.js';
export const MONSTERS=[
 {name:'잿빛 사냥개',color:0x303447,hp:34,xp:25,speed:3.6,range:4.2,wind:.65,duration:.42,recovery:1.3,damage:8},
 {name:'낫발 벌레',color:0x175451,hp:42,xp:30,speed:2.9,range:2.2,wind:.7,duration:.3,recovery:1.5,damage:10},
 {name:'갈퀴 임프',color:0x8d263e,hp:38,xp:30,speed:3.2,range:4,wind:.8,duration:.65,recovery:1.6,damage:12}
];
export function createMonster(type){
 const spec=MONSTERS[type],g=new T.Group(),rig=new T.Group();g.add(rig);
 const dark=new T.MeshStandardMaterial({color:spec.color,flatShading:true,roughness:.85}),bone=new T.MeshStandardMaterial({color:0xe4d9b7,flatShading:true}),eye=new T.MeshStandardMaterial({color:0xffcc35,emissive:0xffa000,emissiveIntensity:1.4});
 const parts=[],legs=[],arms=[];
 function ball(parent,material,pos,scale){const m=new T.Mesh(new T.IcosahedronGeometry(1,1),material);m.position.set(...pos);m.scale.set(...scale);m.castShadow=true;parent.add(m);parts.push(m);return m;}
 function rod(parent,a,b,r,material=dark,end=r*.65){const av=new T.Vector3(...a),bv=new T.Vector3(...b),v=bv.clone().sub(av),m=new T.Mesh(new T.CylinderGeometry(end,r,v.length(),5),material);m.position.copy(av.add(bv).multiplyScalar(.5));m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),v.normalize());m.castShadow=true;parent.add(m);parts.push(m);return m;}
 function limb(x,y,z,side,insect=false){const p=new T.Group();p.position.set(x,y,z);rig.add(p);const knee=[side*(insect?.57:.09),-.25,insect?-.05:-.13],foot=[side*(insect?.9:.13),-y,.15];rod(p,[0,0,0],knee,.105);rod(p,knee,foot,.075,bone,.015);legs.push(p);}
 let body;
 if(type===0){body=ball(rig,dark,[0,.78,0],[.42,.43,.83]);ball(rig,dark,[0,.91,.73],[.35,.32,.45]);ball(rig,bone,[0,.75,1.05],[.27,.16,.39]);for(const s of[-1,1]){limb(s*.3,.72,.43,s);limb(s*.3,.72,-.55,s);ball(rig,eye,[s*.24,1.01,.96],[.07,.06,.09]);rod(rig,[s*.22,1.1,.65],[s*.29,1.48,.28],.12,bone,.005);}rod(rig,[0,.85,-.65],[0,1.02,-1.25],.12);rod(rig,[0,1.02,-1.25],[.15,1.35,-1.7],.06,dark,.005);}
 else if(type===1){body=ball(rig,dark,[0,.65,-.2],[.59,.4,.73]);ball(rig,dark,[0,.65,.54],[.3,.23,.34]);for(const s of[-1,1]){limb(s*.36,.55,.05,s,true);limb(s*.4,.55,-.52,s,true);ball(rig,eye,[s*.17,.77,.73],[.11,.045,.08]);const a=new T.Group();a.position.set(s*.34,.7,.4);rig.add(a);rod(a,[0,0,0],[s*.4,.32,.3],.09);rod(a,[s*.4,.32,.3],[s*.5,.2,.72],.09);rod(a,[s*.5,.2,.72],[s*.12,-.3,1.1],.16,bone,.005);arms.push(a);}}
 else{body=ball(rig,dark,[0,1,0],[.35,.47,.25]);ball(rig,dark,[0,1.58,.1],[.29,.32,.25]);for(const s of[-1,1]){limb(s*.22,.75,-.05,s);ball(rig,eye,[s*.13,1.62,.31],[.07,.045,.04]);rod(rig,[s*.18,1.77,.03],[s*.28,2.08,-.22],.1,bone,.005);const a=new T.Group();a.position.set(s*.3,1.3,0);rig.add(a);rod(a,[0,0,0],[s*.25,-.32,.1],.105);rod(a,[s*.25,-.32,.1],[s*.35,-.7,.3],.075);rod(a,[s*.35,-.7,.3],[s*.38,-.85,.64],.12,bone,.05);rod(a,[s*.38,-.85,.64],[s*.2,-.65,.82],.06,bone,.005);arms.push(a);}rod(rig,[0,.8,-.15],[.2,.6,-.8],.08);rod(rig,[.2,.6,-.8],[.45,.9,-1.05],.045,dark,.005);}
 g.scale.setScalar(.5);g.userData.monsterParts=parts;g.userData.rig={rig,legs,arms,dark};if(type===0&&typeof document!=='undefined')attachWolf(g);return {g,body};
}
export function animateMonster(m,time){if(m.type===0&&animateWolf(m,time))return;const {rig,legs,arms,dark}=m.g.userData.rig,phase=m.attackPhase,wind=phase==='windup',active=phase==='attack';const gait=(m.moving?1:0)*.5;legs.forEach((l,i)=>l.rotation.x=Math.sin(time*14+i*Math.PI)*gait);arms.forEach((a,i)=>{a.rotation.x=wind?-1:active?1.2:Math.sin(time*3+i)*.08;});rig.position.y=wind?-.12:m.type===2&&active?Math.sin(Math.PI*m.attackElapsed/MONSTERS[2].duration)*1.45:0;rig.rotation.x=wind?.15:0;dark.color.set(m.hitFlash>0?0xffffff:MONSTERS[m.type].color);if(wind)dark.color.lerp(new T.Color(0xff6655),.28);if(m.frostSlow>0||m.slow>0)dark.color.lerp(new T.Color(0x479eff),.4);m.g.position.set(m.x,0,m.z);m.g.rotation.y=Math.atan2(m.dir.x,m.dir.z);}
export function cancelMonsterAttack(m){m.attackPhase='recover';m.attackElapsed=0;m.wind=0;m.cool=Math.max(m.cool,.7);}
export function tickMonster(m,target,dt,{move,hit,visible,clearPath}){
 const s=MONSTERS[m.type];m.moving=false;m.locomotion='idle';m.cool=Math.max(0,m.cool-dt);const dx=target.x-m.x,dz=target.z-m.z,d=Math.hypot(dx,dz),slow=m.frostSlow>0?.35:m.slow>0?.55:1;
 const walk=(x,z)=>{if(m.rooted>0||m.motion.active)return;const steps=Math.max(1,Math.ceil(Math.hypot(x,z)/.08));for(let i=0;i<steps;i++)move(m,x/steps,z/steps);m.moving=true;m.locomotion=Math.hypot(x,z)/Math.max(dt,.001)>2?'run':'walk';};
 if(m.attackPhase==='windup'){m.attackElapsed+=dt;m.wind=Math.max(0,s.wind-m.attackElapsed);if(m.attackElapsed>=s.wind){m.attackPhase='attack';m.attackElapsed=0;m.didHit=false;}return;}
 if(m.attackPhase==='attack'){
 m.attackElapsed+=dt;if(m.type!==1)walk(m.attackDX*s.range/s.duration*dt*slow,m.attackDZ*s.range/s.duration*dt*slow);
 const impact=m.type!==2||m.attackElapsed>=s.duration*.8;
 if(impact&&!m.didHit&&Math.hypot(target.x-m.x,target.z-m.z)<(m.type===1?2:1.25)&&clearPath(m,target)&&((target.x-m.x)*m.attackDX+(target.z-m.z)*m.attackDZ>-.3)){hit(target,s.damage,m.dir,0,m);m.didHit=true;}
 if(m.attackElapsed>=s.duration){m.attackPhase='recover';m.attackElapsed=0;m.cool=s.recovery;}return;
 }
 if(m.cool>0&&m.attackPhase==='recover')return;m.attackPhase='chase';
 if(d<(m.aggro?10:7)&&visible(m,target)){m.dir.set(dx,0,dz).normalize();if(d<s.range&&m.cool<=0&&clearPath(m,target)){m.attackPhase='windup';m.attackElapsed=0;m.wind=s.wind;m.attackDX=m.dir.x;m.attackDZ=m.dir.z;return;}
 if(d>1.2){const side=m.type===1?Math.sin((m.id||0)+ (m.age||0)*2)*.8:0;walk((m.dir.x-m.dir.z*side)*s.speed*slow*dt,(m.dir.z+m.dir.x*side)*s.speed*slow*dt);}}
 else{m.aggro=false;m.aggroTarget=null;const hx=m.homeX-m.x,hz=m.homeZ-m.z,hd=Math.hypot(hx,hz);if(hd>.5){m.dir.set(hx/hd,0,hz/hd);walk(hx/hd*dt,hz/hd*dt);}}
 m.age=(m.age||0)+dt;
}
