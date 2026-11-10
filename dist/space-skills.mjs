import {areaTouches} from './combat-hit.mjs?v=smooth-motion-1';
export const SPACE_SKILLS={
 q:{name:'불길 돌파',duration:.32,distance:2.6,cooldown:4,color:0xff6828,desc:'짧게 돌진하고 출발 지점에 2초간 불길을 남깁니다. 불길은 0.5초마다 피해 2를 줍니다.'},
 i:{name:'빙판 미끄럼',duration:.28,distance:5.5,cooldown:4.5,color:0x8bdcff,desc:'마우스 지점까지 빠르게 미끄러집니다. 최대 5.5m이며 벽을 넘지 못합니다. 얼음길을 밟은 적은 느려집니다.'},
 l:{name:'번쩍 스텝',duration:.18,distance:2.3,cooldown:4,color:0xffe86c,desc:'짧고 빠르게 이동합니다. 처음 0.12초 동안 공격을 피합니다.'},
 d:{name:'흙으로 버티기',duration:.65,distance:0,cooldown:5,color:0xb38b63,desc:'제자리에서 피해를 70% 줄이고 밀려나지 않습니다.'},
 p:{name:'긴급 분사',duration:.35,distance:-2.2,cooldown:5,color:0x9bb46b,desc:'뒤로 물러나며 앞에 작은 연막을 남깁니다. 연막은 양쪽의 시야를 가립니다.'},
 e:{name:'진입 금지',duration:.55,distance:1.4,cooldown:5,color:0x8fbcff,desc:'옆으로 이동하며 정면 투사체를 막습니다. 근접 공격도 정면에서 피해가 줄어듭니다.'},
 t:{name:'안전 구역',duration:.3,distance:0,cooldown:5,color:0x70e5b4,desc:'3초간 안전 구역을 만듭니다. 안에서는 둔화가 풀리고 이동 속도가 35% 빨라집니다.'},
 g:{name:'저쪽으로 갈래',duration:.5,delay:.15,distance:3.8,cooldown:4.5,color:0xc593ed,desc:'잠깐 준비한 뒤 지면을 향해 몸을 끌어갑니다. 벽은 통과하지 못합니다.'},
 s:{name:'틈새 베기',duration:.32,distance:1.7,cooldown:4,color:0xe4edf6,desc:'옆으로 비키며 정면 투사체 하나를 잘라냅니다. 장판과 낙뢰는 막지 못합니다.'},
 h:{name:'어깨 밀치기',duration:.5,distance:3,cooldown:5,color:0xf4aa7c,desc:'어깨로 돌진합니다. 충돌한 적에게 피해 3과 큰 넉백을 주며 멈춥니다. 끝에 짧은 빈틈이 있습니다.'},
 w:{name:'밀어 뛰기',duration:.32,distance:2.6,cooldown:4,color:0xe3d68c,desc:'미는 힘으로 짧게 이동합니다.'}
};
export class SpaceSkill{
 constructor(kind='q'){this.kind=kind;this.reset();}
 get spec(){return SPACE_SKILLS[this.kind]||SPACE_SKILLS.q;}
 get active(){return this.remaining>1e-8;}
 get invulnerable(){return this.active&&this.kind==='l'&&this.age<.12;}
 reset(){this.remaining=0;this.cooldown=0;this.x=0;this.z=1;this.faceX=0;this.faceZ=1;this.age=0;this.zones=[];this.parrySpent=false;this.hitDone=false;this.pendingRelease=false;this.speedBoost=false;this.trailClock=0;}
 start(x,z,actor={x:0,z:0},kind=this.kind,target=null){if(this.active||this.cooldown>0||Math.hypot(x,z)<.001)return false;this.kind=kind;this.travelDistance=kind==='i'&&target?Math.min(this.spec.distance,Math.hypot(target.x-actor.x,target.z-actor.z)):this.spec.distance;const n=Math.hypot(x,z);this.faceX=x/n;this.faceZ=z/n;this.x=this.faceX;this.z=this.faceZ;if(['e','s'].includes(kind)){this.x=this.faceZ;this.z=-this.faceX;}this.age=0;this.remaining=this.spec.duration;this.cooldown=this.spec.cooldown;this.hitDone=false;this.parrySpent=false;this.trailClock=0;this.pendingRelease=false;
 if(['q','p','t','l','g'].includes(kind))this.zones.push({x:actor.x+(kind==='p'?this.faceX:kind==='g'?this.faceX*3.8:0),z:actor.z+(kind==='p'?this.faceZ:kind==='g'?this.faceZ*3.8:0),radius:kind==='t'?1.7:kind==='p'?1.25:.85,life:kind==='q'?2:kind==='p'?1.8:kind==='t'?3:.5,kind,tick:0});return true;}
 guard(damage,force,dir,source,actor){if(!this.active)return {damage,force};if(this.invulnerable)return {damage:0,force:0,blocked:true};if(this.kind==='d')return {damage:damage*.3,force:0};if(this.kind==='e'&&source&&Math.hypot(source.x-actor.x,source.z-actor.z)<2.1&&(-dir.x*this.faceX-dir.z*this.faceZ)>.4)return {damage:damage*.2,force:0};return {damage,force};}
 tick(dt,actor=null,api=null){const was=this.active,before=this.age,used=Math.min(dt,this.remaining);this.age+=used;this.remaining=Math.max(0,this.remaining-dt);this.cooldown=Math.max(0,this.cooldown-dt);this.speedBoost=false;
 if(actor&&api){for(const zone of this.zones){zone.life-=dt;zone.tick-=dt;if(zone.kind==='t'&&Math.hypot(actor.x-zone.x,actor.z-zone.z)<zone.radius){actor.slow=0;actor.frostSlow=0;this.speedBoost=true;}if(zone.life>0&&zone.tick<=0){zone.tick=.5;for(const target of api.targets(actor)){if(!areaTouches(target,zone,zone.radius,null,false,false,.2)||!api.clearPath(zone,target))continue;if(zone.kind==='q')api.hit(target,2,{x:0,z:0},0,actor);if(zone.kind==='i')target.slow=Math.max(target.slow||0,.7);}}}this.zones=this.zones.filter(z=>z.life>0);
 if(was&&this.kind==='i'){this.trailClock-=dt;if(this.trailClock<=0){this.trailClock=.03;this.zones.push({x:actor.x,z:actor.z,radius:.65,life:2,kind:'i',tick:0});}}
 if(was&&this.kind==='h'&&!this.hitDone){const target=api.targets(actor).find(t=>areaTouches(t,actor,1,{x:this.faceX,z:this.faceZ},true)&&api.clearPath(actor,t));if(target){api.hit(target,3,{x:this.faceX,z:this.faceZ},4.8,actor);this.hitDone=true;}}
 }
 const delay=this.spec.delay||0,end=this.kind==='h'?.32:this.spec.duration;
 const fraction=Math.max(0,Math.min(end,this.age)-Math.max(delay,before))/Math.max(.01,end-delay);
 return {x:this.hitDone?0:this.x*this.travelDistance*fraction,z:this.hitDone?0:this.z*this.travelDistance*fraction,chargeDt:Math.max(0,dt-used)};}
 get smoke(){return this.zones.filter(z=>z.kind==='p'&&z.life>0);}
 snapshot(){return JSON.parse(JSON.stringify(this));}
}
// Intercept only moving shots, never ground fields, falling strikes or melee attacks.
export function interceptSpaceShots(actors,magic,dt,remove){for(const list of [magic.effects,magic.fire.effects,...(magic.ice?[magic.ice.effects]:[])])for(let i=list.length-1;i>=0;i--){const shot=list[i];if(!['projectile','shot'].includes(shot.type)||!shot.dir||!(shot.speed||shot.s?.speed||(shot.redLightning?15:0)))continue;const from=shot.mesh.position,to={x:from.x+shot.dir.x*(shot.speed||shot.s?.speed||(shot.redLightning?15:0))*dt,z:from.z+shot.dir.z*(shot.speed||shot.s?.speed||(shot.redLightning?15:0))*dt};for(const a of actors){const r=a.roll;if(a===shot.owner||!r?.active||!['e','s'].includes(r.kind)||r.kind==='s'&&r.parrySpent)continue;if(-shot.dir.x*r.faceX-shot.dir.z*r.faceZ<.25)continue;const dx=to.x-from.x,dz=to.z-from.z,n=dx*dx+dz*dz,t=n?Math.max(0,Math.min(1,((a.x-from.x)*dx+(a.z-from.z)*dz)/n)):0;if(Math.hypot(from.x+dx*t-a.x,from.z+dz*t-a.z)>1.4)continue;r.parrySpent=true;remove(shot.mesh);list.splice(i,1);break;}}}
