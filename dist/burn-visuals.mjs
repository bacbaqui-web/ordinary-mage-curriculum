import * as T from './three.module.js';
import {FireSpells} from './fire-spells.mjs?v=fire10';
export function applyBurnVisual(a,p){if(p.ash)a.ashTime=Math.max(a.ashTime||0,p.ash);if(p.greenFire)a.greenFireTime=Math.max(a.greenFireTime||0,p.greenFire);}
export class BurnVisuals{
 constructor(scene){this.scene=scene;this.states=new Map();this.factory=new FireSpells({scene});this.time=0;}
 remove(a){const s=this.states.get(a);if(!s)return;s.group.removeFromParent();s.group.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});this.states.delete(a);}
 clear(){for(const a of this.states.keys())this.remove(a);}
 create(a){const group=new T.Group(),flames=[],ash=[],smoke=[];for(let i=0;i<7;i++){const m=this.factory.flame(i*2.3);m.scale.set(.13,.42+i%3*.12,.13);group.add(m);flames.push(m);}for(let i=0;i<28;i++){const m=new T.Mesh(new T.IcosahedronGeometry(.04+i%3*.012,0),new T.MeshBasicMaterial({color:i%3?0x171310:0x39332d}));group.add(m);ash.push(m);}for(let i=0;i<5;i++){const m=new T.Mesh(new T.SphereGeometry(.2,8,6),this.factory.fogMaterial(0x393536,.2));group.add(m);smoke.push(m);}this.scene.add(group);const s={group,flames,ash,smoke};this.states.set(a,s);return s;}
 update(dt,actors){this.time+=dt;const active=new Set(actors);for(const a of this.states.keys())if(!active.has(a))this.remove(a);
 for(const a of actors){a.ashTime=Math.max(0,(a.ashTime||0)-dt);a.greenFireTime=Math.max(0,(a.greenFireTime||0)-dt);const burn=a.burn>0,ash=a.ashTime>0;if(a.dead||a.hp<=0||(!burn&&!ash)){this.remove(a);continue;}const s=this.states.get(a)||this.create(a);s.group.visible=a.g.visible;const bones=a.g.userData.puppet?.lastPositions,names=['Spine','LeftArm','RightArm','LeftUpLeg','RightUpLeg','LeftForeArm','RightForeArm'];
 const anchor=i=>bones?.[names[i%names.length]]?.clone()||new T.Vector3(a.x+Math.cos(i*2.4)*.35,.5+(i%3)*.18,a.z+Math.sin(i*2.4)*.35);
 s.flames.forEach((m,i)=>{m.visible=burn;m.position.copy(anchor(i)).add(new T.Vector3(Math.sin(i)*.22,0,.25));m.material.uniforms.time.value=this.time;m.material.uniforms.poison.value=a.greenFireTime>0?1:0;m.material.uniforms.alpha.value=Math.min(1,a.burn/.25);});
 s.ash.forEach((m,i)=>{m.visible=ash;m.position.copy(anchor(i)).add(new T.Vector3(Math.cos(i*2.4)*.16,Math.sin(i*1.7)*.12,Math.sin(i*2.4)*.16));m.rotation.set(i+this.time*.15,i,0);m.scale.setScalar(Math.min(1,a.ashTime/.3));});
 s.smoke.forEach((m,i)=>{m.visible=burn;const t=(this.time*.7+i*.2)%1;m.position.copy(anchor(i)).add(new T.Vector3(Math.sin(this.time+i)*.12,t*.9,.05));m.scale.setScalar(.6+t*1.4);m.material.uniforms.alpha.value=.34*(1-t)*Math.min(1,a.burn/.3);});
 }}
}
