import {groundSpec,groundPoint,inGround,advanceGround} from './ground.mjs?v=zones1';
import {projectileAsset,groundAsset} from './effect-map.mjs?v=zones1';
import {PixelVFX} from './pixel-vfx.mjs?v=zones1';
import {advanceMovingWard} from './moving-ward.mjs?v=zones1';
import {FALL_SECONDS,overheadDelivery,segmentCircleHit} from './delivery.mjs?v=zones1';
import {createProgress,awardKill,requiredXP,learn,mastery,MAX_LEVEL,MAX_RANK} from './progression.mjs?v=zones1';
import {ForcedMotion} from './motion.mjs?v=zones1';
import {SpriteSpells} from './sprite-spells.mjs?v=zones1';
import {chooseLoadout,choosePlan,chooseLearnedPlan,spendEnemyPoints,OpponentCharge} from './opponent.mjs?v=zones1';
import {forceSpec,wardSpec,displacement,crossesWard,distanceToWard} from './forces.mjs?v=zones1';
import {elementalSpec,inElementCone,lightningPoint,lightningHits} from './elements.mjs?v=zones1';
import {describeSpell} from './guide.mjs?v=zones1';
import * as T from './three.module.js';
import {Charge,ELEMENTS,NAMES,resolveSpell} from './spells.mjs?v=zones1';
import {Roll,ROLL_DURATION,incomingThreat,enemyChargeProgress} from './combat.mjs?v=zones1';
import {RUNES,KEYS,DEFAULT_LOADOUT,validLoadout,assignRune,mapSequence,spellName,composition} from './loadout.mjs?v=zones1';
let loadout={...DEFAULT_LOADOUT};try{const saved=JSON.parse(localStorage.getItem('mage-loadout-v1'));if(validLoadout(saved))loadout=saved}catch{}
let progress=createProgress(loadout),monsters=[],spawnTimer=0,monsterId=0;
let draft={...loadout},activeSlot='q',selectionReturn=false;
const $=id=>document.getElementById(id),canvas=$('arena');
const renderer=new T.WebGLRenderer({canvas,antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.outputColorSpace=T.SRGBColorSpace;renderer.setClearColor(0x2c3940);
const scene=new T.Scene();scene.fog=new T.Fog(0x586367,55,100);const camera=new T.PerspectiveCamera(38,1,.1,100);camera.position.set(18,23,22);camera.lookAt(0,0,0);
const pixelVfx=new PixelVFX(scene);
const spellVfx=new SpriteSpells(pixelVfx);
pixelVfx.ready.then(()=>{if(pixelVfx.failed)flash('일부 스킬 효과를 불러오지 못했습니다. 페이지를 새로고침해 주세요.');});
scene.add(new T.HemisphereLight(0xe2efff,0x5a614c,2.3));const sun=new T.DirectionalLight(0xffe4ba,3.2);sun.position.set(-8,18,9);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-30,right:30,top:30,bottom:-30});sun.shadow.normalBias=.04;scene.add(sun);
const mat=(color,extra={})=>new T.MeshStandardMaterial({color,roughness:.87,flatShading:true,...extra});const stoneMats=[mat(0x8a928a),mat(0x93988f),mat(0x858d86),mat(0x9a9e94)];
function mesh(geo,material,x=0,y=0,z=0,parent=scene){const m=new T.Mesh(geo,material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m}
function box(x,y,z,w,h,d,material,parent=scene){return mesh(new T.BoxGeometry(w,h,d),material,x,y,z,parent)}
let seed=139;function rand(){seed=(seed*16807)%2147483647;return(seed-1)/2147483646}
box(0,-.55,0,50,1,46,mat(0x586052));
for(let x=-24;x<=24;x+=1.5)for(let z=-22.5;z<=22.5;z+=1.5){const m=box(x,-.035+rand()*.025,z,1.46,.12,1.46,stoneMats[Math.floor(rand()*4)]);m.castShadow=false;}
const wallMat=mat(0x77817a),capMat=mat(0x9da49a);
for(let x=-24;x<=24;x+=2){box(x,.62,-23,1.96,1.35,.8,wallMat);box(x,1.35,-23,2.05,.18,.98,capMat)}
for(let z=-22;z<=22;z+=2){box(-25,.62,z,.8,1.35,1.96,wallMat);box(-25,1.35,z,.98,.18,2.05,capMat)}
const obstacles=[{x:-4,z:-2,w:3,h:1.1},{x:4,z:2,w:3,h:1.1},{x:1,z:-6,w:1.8,h:1.8},{x:-1,z:6,w:1.8,h:1.8},{x:-13,z:-9,w:4,h:2},{x:12,z:10,w:4,h:2},{x:13,z:-9,w:2,h:4},{x:-12,z:12,w:2,h:4}];
for(const o of obstacles){box(o.x,.55,o.z,o.w,1.1,o.h,wallMat);box(o.x,1.16,o.z,o.w+.13,.16,o.h+.13,capMat);for(let i=0;i<3;i++){const x=o.x+(rand()-.5)*o.w;box(x,1.32,o.z,.45,.2,o.h+.18,stoneMats[2]);}}
const grass=mat(0x667955);for(let i=0;i<95;i++){let x=(rand()-.5)*25,z=(rand()-.5)*22;if(Math.abs(x)<10&&Math.abs(z)<9)continue;mesh(new T.ConeGeometry(.08+rand()*.07,.2+rand()*.25,3),grass,x,.12,z)}
for(const x of[-9,8]){box(x,1.8,-11, .13,3.6,.13,mat(0x514838));const flag=box(x+.52,2.8,-11,1,.95,.05,mat(0x37596b));flag.rotation.z=-.08;}
// Ground markings are actual geometry and remain readable beneath spells.
const emblem=mesh(new T.RingGeometry(2.1,2.15,64),mat(0xb7bca6,{transparent:true,opacity:.45}),0,.045,0);emblem.rotation.x=-Math.PI/2;emblem.castShadow=false;
function wizard(color,trim){const g=new T.Group();const robe=mat(color),edge=mat(trim),skin=mat(0xe1c4a1),dark=mat(0x26313c);mesh(new T.ConeGeometry(.48,1.1,7),robe,0,.85,0,g);mesh(new T.CylinderGeometry(.43,.49,.08,7),edge,0,.34,0,g);mesh(new T.SphereGeometry(.23,8,6),skin,0,1.5,0,g);mesh(new T.CylinderGeometry(.56,.56,.065,10),dark,0,1.72,0,g);mesh(new T.ConeGeometry(.34,.77,7),robe,-.07,2.08,0,g);mesh(new T.CylinderGeometry(.33,.35,.075,7),edge,0,1.79,0,g);box(-.2,.2,.08,.19,.34,.36,dark,g);box(.2,.2,.08,.19,.34,.36,dark,g);const arm=box(.4,1.15,.22,.22,.23,.68,robe,g);mesh(new T.SphereGeometry(.13,7,5),skin,.4,1.15,.58,g);box(-.4,.95,0,.2,.6,.22,robe,g);const selection=mesh(new T.RingGeometry(.62,.67,40),new T.MeshBasicMaterial({color:trim,transparent:true,opacity:.65,side:T.DoubleSide}),0,.065,0,g);selection.rotation.x=-Math.PI/2;selection.castShadow=false;const body=new T.Group();body.position.y=.95;for(const child of [...g.children]){if(child===selection)continue;g.remove(child);child.position.y-=.95;body.add(child)}g.add(body);g.userData.body=body;g.userData.palette=[...new Set([robe,edge,skin,dark])].map(material=>({material,color:material.color.clone()}));scene.add(g);return g}
const player={g:wizard(0x394351,0xe7b367),x:-5,z:4,hp:100,mana:100,shield:0,shieldTime:0,shieldHeat:false,dir:new T.Vector3(1,0,-1).normalize(),cool:0};
const enemy={g:wizard(0x73899c,0xc2d6df),x:5,z:-4,hp:100,mana:100,shield:0,shieldTime:0,dir:new T.Vector3(-1,0,1).normalize(),cool:2,wind:0};
player.motion=new ForcedMotion();enemy.motion=new ForcedMotion();
const roll=new Roll(),enemyCharge=new OpponentCharge();let enemyLoadout=chooseLoadout(),enemyProgress=createProgress(enemyLoadout),enemyTarget=null;let fallingStrikes=[];
const charge=new Charge(),ray=new T.Raycaster(),pointer=new T.Vector2(),ground=new T.Plane(new T.Vector3(0,1,0),0),aim=new T.Vector3(4,0,-3);let moveTarget=null,running=false,paused=false,bot=true,finished=false,clock=0,wins=0,losses=0,shots=[],fields=[],fx=[],waves=[],wards=[],history=[],toastTimer=0;
const aimLine=new T.Line(new T.BufferGeometry(),new T.LineBasicMaterial({color:0xe9e4cb,transparent:true,opacity:.35}));scene.add(aimLine);
const enemyAimLine=new T.Line(new T.BufferGeometry(),new T.LineBasicMaterial({color:0xffa58a,transparent:true,opacity:.65}));scene.add(enemyAimLine);
const attackTell=new T.Mesh(new T.BufferGeometry(),new T.MeshBasicMaterial({color:0xff9c45,side:T.DoubleSide,transparent:true,opacity:.23,depthWrite:false}));attackTell.position.y=.14;attackTell.visible=false;scene.add(attackTell);
const tellBorder=new T.Line(new T.BufferGeometry(),new T.LineBasicMaterial({color:0xffd293,transparent:true,opacity:.95,depthTest:false}));tellBorder.position.y=.15;tellBorder.visible=false;scene.add(tellBorder);
const playerTell=attackTell.clone();playerTell.geometry=new T.BufferGeometry();playerTell.material=attackTell.material.clone();scene.add(playerTell);
const playerBorder=tellBorder.clone();playerBorder.geometry=new T.BufferGeometry();playerBorder.material=tellBorder.material.clone();scene.add(playerBorder);
const wardGhost=mesh(new T.PlaneGeometry(1,2.3),new T.MeshBasicMaterial({color:0xa8dcff,transparent:true,opacity:.16,depthWrite:false}),0,1.2,0);wardGhost.castShadow=false;wardGhost.visible=false;
wardGhost.add(new T.LineSegments(new T.EdgesGeometry(wardGhost.geometry),new T.LineBasicMaterial({color:0xd4f1ff,transparent:true,opacity:.8})));



const marker=mesh(new T.RingGeometry(.23,.29,24),new T.MeshBasicMaterial({color:0xc2e3c3,transparent:true,opacity:.75,side:T.DoubleSide}),0,.07,0);marker.rotation.x=-Math.PI/2;marker.visible=false;marker.castShadow=false;
function tint(k){return new T.Color(ELEMENTS[k]?.color||'#9adfff')}
function flash(text){$('toast').textContent=text;$('toast').classList.add('show');toastTimer=2}
function ring(x,z,color,r=1,life=.4){pixelVfx.play('magic-circle',x,z,{width:r*2,color,duration:life});}
function spark(x,z,color,count=10){pixelVfx.play('hit-spark',x,z,{width:1.1,color,y:.7});}
function remove(m){scene.remove(m);m.traverse(o=>{o.geometry?.dispose();if(Array.isArray(o.material))o.material.forEach(x=>x.dispose());else o.material?.dispose()})}
function collides(x,z,r=.45){return Math.abs(x)>23.6||Math.abs(z)>21.6||obstacles.some(o=>Math.abs(x-o.x)<o.w/2+r&&Math.abs(z-o.z)<o.h/2+r)}
function wallBlocks(from,to){return wards.some(w=>w.hp>0&&w.life>0&&crossesWard(from,to,w,.5)&&distanceToWard(to,w)<=distanceToWard(from,w)+.001);}
function move(a,dx,dz){if(!collides(a.x+dx,a.z)&&!wallBlocks(a,{x:a.x+dx,z:a.z}))a.x+=dx;if(!collides(a.x,a.z+dz)&&!wallBlocks(a,{x:a.x,z:a.z+dz}))a.z+=dz}
function hit(a,damage,dir,force=0,source=null){if(finished||a.dead||(a===player&&roll.invulnerable))return false;if(a.monster&&(source===player||source===enemy)){a.aggro=true;a.aggroTarget=source;}if(a===enemy&&source===player)enemy.retaliate=6;let block=Math.min(a.shield,damage);a.shield-=block;damage-=block;if(block){pixelVfx.play('parry',a.x,a.z,{width:1.8,y:1});ring(a.x,a.z,0xafdfff,.8,.2);if(a.shieldHeat){const other=a===player?enemy:player;if(Math.hypot(other.x-a.x,other.z-a.z)<3)other.hp=Math.max(0,other.hp-block*.32)}}a.hp=Math.max(0,a.hp-damage);if(damage){pixelVfx.play('hit-spark',a.x,a.z,{width:1.1,y:1});spark(a.x,a.z,a===player?0xffca8f:0xb8ddff,5);}if(force)a.motion.start(dir.x,dir.z,force);if(a===player&&damage)flash('피격 −'+Math.round(damage));if(a.hp<=0){if(a.monster)killMonster(a,source);else endRound(a===enemy)};return true}
function castOrb(spell,dir,caster){const spec=elementalSpec(spell.sequence,spell.power),color=RUNES[spec.kind].color;
 const m=new T.Object3D();m.position.set(caster.x,.95,caster.z);scene.add(m);
 const screenStart=m.position.clone().project(camera),screenEnd=m.position.clone().add(dir).project(camera),rotation=Math.atan2(screenEnd.y-screenStart.y,screenEnd.x-screenStart.x);
 pixelVfx.play(projectileAsset(spec.kind),caster.x,caster.z,{width:Math.max(1.4,spec.radius*4),y:.95,duration:spec.range/spec.speed+1,loop:true,rotation,follow:()=>m.parent?m.position:null});
 shots.push({m,owner:caster,dir:dir.clone(),spec,color,distance:0,trail:0});if(spec.shield){caster.shield=Math.max(caster.shield,spec.shield);caster.shieldTime=2;}
}
function explodeOrb(shot){const {spec,m,owner,color}=shot,point=m.position;pixelVfx.impact(spec.kind,point.x,point.z,spec.blast);spellVfx.pulse(point.x,point.z,spec.blast,color,.45);spark(point.x,point.z,color,12+Math.round(spec.radius*14));
 for(const victim of targets(owner)){if(Math.hypot(victim.x-point.x,victim.z-point.z)>spec.blast+.4||!clearPath(point,victim))continue;const d=new T.Vector3(victim.x-owner.x,0,victim.z-owner.z),distance=d.length();d.normalize();if(hit(victim,spec.damage,d,displacement(spec.force,distance),owner))applyPayload(victim,spec,owner);}
}
function updateOrbs(dt){for(let i=shots.length-1;i>=0;i--){const s=shots[i],travel=Math.min(s.spec.range-s.distance,s.spec.speed*dt),steps=Math.max(1,Math.ceil(travel/.08));let done=false,blocked=false;
 for(let j=0;j<steps&&!done;j++){const from=s.m.position.clone(),to=from.clone().addScaledVector(s.dir,travel/steps),wall=wards.find(w=>w.owner!==s.owner&&w.hp>0&&crossesWard(from,to,w,s.spec.radius));
 if(wall){wall.hp=Math.max(0,wall.hp-s.spec.damage);spark(from.x,from.z,0xb9eaff,8);done=true;blocked=true;break;}
 if(collides(to.x,to.z,s.spec.radius)){done=true;break;}
 let nearest=1,contact=false;for(const target of targets(s.owner)){const t=segmentCircleHit(from,to,target,s.spec.radius+.4);if(t!==null&&t<=nearest){nearest=t;contact=true;}}
 s.m.position.copy(from).lerp(to,nearest);s.distance+=travel/steps*nearest;if(contact)done=true;
 }
 s.m.rotation.x+=dt*4;s.m.rotation.y+=dt*7;s.trail-=dt;if(s.trail<=0){s.trail=.045;spellVfx.particle(s.spec.kind==='i'?'shard':'chunk',[s.m.position.x,.95,s.m.position.z],[-s.dir.x*.5,.25,-s.dir.z*.5],s.spec.radius*.45,new T.Color(s.color).getHex(),.22,{stretch:1.4});}
 if(done||s.distance>=s.spec.range-.001){if(!blocked)explodeOrb(s);remove(s.m);shots.splice(i,1);}
}}
function area(a,x,z,r,damage,color,force=0,dir=null,payload=null){ring(x,z,color,r,.45);for(const target of targets(a)){const delta=new T.Vector3(target.x-x,0,target.z-z),dist=delta.length();if(dist<r+.4){delta.normalize();if(!dir||delta.dot(dir)>.3){if(hit(target,damage,delta,force,a))applyPayload(target,payload,a)}}}}
function field(a,x,z,r,damage,color,life=3,force=0,payload=null){const m=mesh(new T.CircleGeometry(r,48),new T.MeshBasicMaterial({color,transparent:true,opacity:.16,side:T.DoubleSide}),x,.085,z);m.rotation.x=-Math.PI/2;m.castShadow=false;fields.push({m,owner:a,x,z,r,damage,color,life,tick:.1,force,payload});ring(x,z,color,r,.6)}
const shields=new Map();for(const a of[player,enemy]){const m=new T.Object3D();m.userData.active=false;shields.set(a,m);}
function applyPayload(a,payload,source=null){if(!payload||finished||a.dead)return;if(payload.slow)a.slow=Math.max(a.slow||0,payload.slow);if(payload.burn){if(!(a.burn>0))a.burnTick=.5;a.burn=Math.max(a.burn||0,payload.burn);a.burnOwner=source;a.burnDamage=payload.burnDamage||2;}if(payload.echo&&!a.echo)a.echo={time:.25,damage:payload.echo,owner:source};}
function updateStatuses(dt){for(const a of[player,enemy,...monsters.filter(m=>!m.dead)]){a.slow=Math.max(0,(a.slow||0)-dt);if(a.burn>0){a.burn-=dt;a.burnTick=(a.burnTick||0)-dt;if(a.burnTick<=0){a.burnTick=.5;hit(a,a.burnDamage||2,new T.Vector3(),0,a.burnOwner);spark(a.x,a.z,0xff9c45,3)}}if(a.echo){a.echo.time-=dt;if(a.echo.time<=0){const {damage,owner}=a.echo;a.echo=null;hit(a,damage,new T.Vector3(),0,owner);ring(a.x,a.z,0xf3d56b,.75,.25)}}}}
function elementalBurst(spec,dir,caster){spellVfx.burst(spec,dir,caster,collides);}
function boltEffect(x,z,spec){spellVfx.bolt(x,z,spec);}
function targets(caster){return [caster===player?enemy:player,...monsters.filter(m=>!m.dead)];}
function chooseStrikePoint(caster,spec){
 const victims=targets(caster),inside=victims.filter(v=>Math.hypot(v.x-caster.x,v.z-caster.z)<=spec.range),reference=caster===player?aim:(enemyTarget||player);
 inside.sort((a,b)=>Math.hypot(a.x-reference.x,a.z-reference.z)-Math.hypot(b.x-reference.x,b.z-reference.z));const victim=inside[0];let point=lightningPoint(caster,victim||{x:1e6,z:1e6},spec.range,rand);
 if(!victim){for(let n=0;n<24&&collides(point.x,point.z,.05);n++)point=lightningPoint(caster,{x:1e6,z:1e6},spec.range,rand);if(collides(point.x,point.z,.05))point={x:caster.x,z:caster.z};}return {victim,point};
}
function castFalling(s,dir,caster){const spec=elementalSpec(s.sequence,s.power)||forceSpec(s.sequence);if(forceSpec(s.sequence))spec.damage*=s.mastery||1;
 const {point}=chooseStrikePoint(caster,spec),color=RUNES[s.sequence[0]].color;spellVfx.fall(point.x,point.z,spec,color);ring(point.x,point.z,color,spec.radius+.35,FALL_SECONDS);
 fallingStrikes.push({owner:caster,point,spec,color,remaining:FALL_SECONDS});if(spec.shield){caster.shield=Math.max(caster.shield,spec.shield);caster.shieldTime=2;}
}
function updateFalling(dt){for(let i=fallingStrikes.length-1;i>=0;i--){const f=fallingStrikes[i];f.remaining-=dt;if(f.remaining>0)continue;
 pixelVfx.impact(f.spec.kind,f.point.x,f.point.z,f.spec.radius);spellVfx.pulse(f.point.x,f.point.z,f.spec.radius+.35,f.color,.4);spark(f.point.x,f.point.z,f.color,14);
 for(const victim of targets(f.owner))if(lightningHits(f.point,victim,f.spec.radius+.35)){const d=new T.Vector3(victim.x-f.owner.x,0,victim.z-f.owner.z),distance=d.length();d.normalize();if(hit(victim,f.spec.damage,d,displacement(f.spec.force||0,distance),f.owner))applyPayload(victim,f.spec,f.owner);}
 fallingStrikes.splice(i,1);
}}
function castElemental(s,dir,caster){const victims=targets(caster),spec=elementalSpec(s.sequence,s.power);
 if(spec.kind==='l'){const {victim,point}=chooseStrikePoint(caster,spec);boltEffect(point.x,point.z,spec);if(victim){const d=new T.Vector3(victim.x-caster.x,0,victim.z-caster.z).normalize();if(hit(victim,spec.damage,d,spec.force,caster))applyPayload(victim,spec,caster);}}
 else {elementalBurst(spec,dir,caster);for(const victim of victims)if(inElementCone(caster,victim,dir,spec)&&clearPath(caster,victim)){const d=new T.Vector3(victim.x-caster.x,0,victim.z-caster.z).normalize();if(hit(victim,spec.damage,d,spec.force,caster))applyPayload(victim,spec,caster);}}
 if(spec.shield){caster.shield=Math.max(caster.shield,spec.shield);caster.shieldTime=2;}
}
function clearPath(a,b){const d=new T.Vector3(b.x-a.x,0,b.z-a.z),length=d.length();d.normalize();for(let t=.2;t<length;t+=.2)if(collides(a.x+d.x*t,a.z+d.z*t,.02))return false;return true;}
function castForce(s,dir,caster){const spec=forceSpec(s.sequence);spec.damage*=s.mastery||1;const color=spec.force<0?0xc49ff1:0xb4e676;spellVfx.force(spec,dir,caster);
 const m=mesh(new T.RingGeometry(.94,1,14,1,-spec.halfAngle,spec.halfAngle*2),new T.MeshBasicMaterial({color,side:T.DoubleSide,transparent:true,opacity:.8}),caster.x,.18,caster.z);m.rotation.set(-Math.PI/2,0,Math.atan2(-dir.z,dir.x));m.castShadow=false;
 waves.push({owner:caster,m,x:caster.x,z:caster.z,dir:dir.clone(),spec,radius:0,hit:new Set()});
 if(spec.shield){caster.shield=Math.max(caster.shield,spec.shield);caster.shieldTime=2;}
}
function wardPlacement(caster,dir,aimPoint,spec){const offset=aimPoint.clone().sub(new T.Vector3(caster.x,0,caster.z));if(offset.length()<.8)offset.copy(dir).multiplyScalar(.8);if(offset.length()>spec.range)offset.setLength(spec.range);
 let point=new T.Vector3(caster.x,0,caster.z),length=offset.length(),d=offset.normalize();for(let t=.2;t<=length;t+=.2){if(collides(caster.x+d.x*t,caster.z+d.z*t,.1))break;point.set(caster.x+d.x*t,0,caster.z+d.z*t);}
 const wall={x:point.x,z:point.z,nx:dir.x,nz:dir.z,width:spec.width};
 for(let i=0;i<30&&[player,enemy,...monsters.filter(m=>!m.dead)].some(a=>distanceToWard(a,wall)<.55);i++){point.addScaledVector(d,-.2);wall.x=point.x;wall.z=point.z;}
 return point;
}
function castGround(spell,caster,target){
 const spec=groundSpec(spell.sequence),point=groundPoint(caster,target,spec.range,collides),color=RUNES[spec.kind].color;
 spec.damage*=spell.mastery||1;
 for(const f of fields.filter(f=>f.owner===caster&&f.ground))remove(f.m);
 fields=fields.filter(f=>f.owner!==caster||!f.ground);
 const m=mesh(new T.CircleGeometry(spec.radius,64),new T.MeshBasicMaterial({color,transparent:true,opacity:.2,depthWrite:false,side:T.DoubleSide}),point.x,.09,point.z);m.rotation.x=-Math.PI/2;m.castShadow=false;
 const border=new T.Mesh(new T.RingGeometry(spec.radius-.04,spec.radius,64),new T.MeshBasicMaterial({color,transparent:true,opacity:.85,depthWrite:false,side:T.DoubleSide}));border.position.z=.015;m.add(border);
 const f={ground:true,owner:caster,m,x:point.x,z:point.z,r:spec.radius,life:spec.duration,tick:0,spec};fields.push(f);
 pixelVfx.play(groundAsset(spec.kind),point.x,point.z,{width:spec.radius*2,duration:spec.duration,loop:true,follow:()=>m.parent?{x:point.x,y:.12,z:point.z}:null});
 if(caster===player)flash('장판 설치 · 반경 '+spec.radius.toFixed(1)+'m · '+spec.duration+'초');
}
function tickGround(f){for(const victim of targets(f.owner)){if(!inGround(f,victim,f.r)||!clearPath(f,victim))continue;const d=new T.Vector3(victim.x-f.x,0,victim.z-f.z),distance=d.length();d.normalize();if(hit(victim,f.spec.damage,d,0,f.owner)){applyPayload(victim,f.spec,f.owner);if(f.spec.force)victim.motion.start(d.x,d.z,displacement(f.spec.force,distance));if(f.spec.shock)pixelVfx.play('static-burst',victim.x,victim.z,{width:1.2,y:.7});}}}
function castWard(s,dir,caster,aimPoint){const spec=wardSpec(s.sequence);spec.hp=Math.round(spec.hp*(s.mastery||1));const point=wardPlacement(caster,dir,spec.moving?new T.Vector3(caster.x,0,caster.z).addScaledVector(dir,1.2):aimPoint,spec);
 // One placed wall per caster; replacing it prevents an unlimited wall stack.
 for(const w of wards.filter(w=>w.owner===caster))remove(w.m);wards=wards.filter(w=>w.owner!==caster);
 const m=new T.Object3D();m.position.set(point.x,1.2,point.z);scene.add(m);
 pixelVfx.play('ice-wall',point.x,point.z,{width:spec.width*1.25,duration:spec.duration,planeAngle:Math.atan2(dir.x,dir.z),holdFrame:10,follow:()=>m.parent?{x:m.position.x,y:.12,z:m.position.z}:null});
 wards.push({owner:caster,m,x:point.x,z:point.z,nx:dir.x,nz:dir.z,width:spec.width,hp:spec.hp,maxHp:spec.hp,life:spec.duration,spec,travelled:0,speed:spec.speed||0,effectCooldown:0});ring(point.x,point.z,0xa8dcff,1,.35);if(caster===player)flash('장벽 설치 · 내구도 '+spec.hp+' · '+spec.duration+'초');
}
function updateForces(dt){
 for(let i=waves.length-1;i>=0;i--){const w=waves[i],s=w.spec,old=w.radius;w.radius=Math.min(s.range,w.radius+s.speed*dt);w.m.scale.setScalar(Math.max(.1,s.force<0?s.range-w.radius+.1:w.radius));w.m.material.opacity=.8*(1-w.radius/s.range)+.15;
 for(const victim of targets(w.owner)){const distance=Math.hypot(victim.x-w.x,victim.z-w.z),front=s.force<0?s.range-w.radius:w.radius,previous=s.force<0?s.range-old:old;
 if(!w.hit.has(victim)&&distance>=Math.min(front,previous)-.4&&distance<=Math.max(front,previous)+.4&&inElementCone(w,victim,w.dir,s)&&clearPath(w,victim)){
 w.hit.add(victim);const d=new T.Vector3(victim.x-w.x,0,victim.z-w.z).normalize();if(hit(victim,s.damage,d,0,w.owner)){applyPayload(victim,s,w.owner);const amount=displacement(s.force,distance);victim.motion.start(d.x,d.z,amount);}}
 }if(w.radius>=s.range){remove(w.m);waves.splice(i,1);}}
 for(let i=wards.length-1;i>=0;i--){const w=wards[i];advanceMovingWard(w,dt,{actors:[player,enemy,...monsters.filter(m=>!m.dead)],collides,wards});w.m.position.set(w.x,1.2,w.z);w.life-=dt;w.effectCooldown-=dt;
 if(w.hp>0&&w.life>0&&w.effectCooldown<=0){w.effectCooldown=.8;for(const victim of targets(w.owner).filter(v=>distanceToWard(v,w)<1)){const payload=w.spec;
 const side=(victim.x-w.x)*w.nx+(victim.z-w.z)*w.nz>=0?1:-1,away=new T.Vector3(w.nx*side,0,w.nz*side);
 if(payload.burn||payload.slow||payload.shock||payload.push||payload.pull){if(hit(victim,payload.shock,away,0,w.owner)){applyPayload(victim,payload,w.owner);if(payload.push)victim.motion.start(away.x,away.z,payload.push);else if(payload.pull)victim.motion.start(away.x,away.z,-payload.pull);}if(payload.shock)boltEffect(victim.x,victim.z,elementalSpec('l'));else ring(victim.x,victim.z,payload.burn?0xff9c45:payload.slow?0x72dce8:0xb4e676,.7,.3);}}
 }if(w.life<=0||w.hp<=0){spellVfx.shatter(w.x,w.z,w.width);remove(w.m);wards.splice(i,1);}}
}
function dispatchSpell(s,caster,dir,aimPoint){pixelVfx.play('magic-circle',caster.x,caster.z,{width:1.8,color:RUNES[s.sequence[0]].color,duration:.55});if(groundSpec(s.sequence))castGround(s,caster,aimPoint);else if((elementalSpec(s.sequence)||forceSpec(s.sequence))?.falling)castFalling(s,dir,caster);else if(elementalSpec(s.sequence)?.projectile)castOrb(s,dir,caster);else if(elementalSpec(s.sequence))castElemental(s,dir,caster);else if(forceSpec(s.sequence))castForce(s,dir,caster);else castWard(s,dir,caster,aimPoint);}
function cast(result){if(!running||paused||finished)return;const s=resolveSpell(result,loadout);if(s.parts.some(k=>!progress.ranks[k]))return;s.mastery=mastery(progress,s.parts[0]);s.power*=s.mastery;if(player.cool>0){flash('잠깐 기다려 주세요');return}if(bot&&player.mana<s.cost){flash('마력이 부족합니다. 잠시 쉬면 회복됩니다.');return}if(bot)player.mana-=s.cost;player.cool=s.tap?.16:.38;const seq=s.sequence,base=seq.slice(0,2),p=s.power,dir=player.dir.clone(),target=aim.clone();target.sub(new T.Vector3(player.x,0,player.z));if(target.length()>6)target.setLength(6);target.add(new T.Vector3(player.x,0,player.z));const third=seq[2];
 dispatchSpell(s,player,dir,aim);
 history.unshift({name:s.name,seq:s.keys.toUpperCase(),tier:seq.length===1?'1륜':seq.length+'중 2륜'});history=history.slice(0,4);$('history').innerHTML=history.map(h=>`<div class="history-item">${h.name}<small>${h.seq.split('').join(' → ')} · ${h.tier}</small></div>`).join('');$('spellName').textContent=s.name;$('queue').textContent=s.keys.toUpperCase().split('').join(' → ')+' / 발사 완료';$('tier').textContent=seq.length===1?'1륜 · 발동':seq.length+'중 2륜 · 발동';
}
function endRound(win){if(!bot){const a=win?enemy:player;a.hp=100;a.shield=0;a.burn=0;a.slow=0;a.echo=null;flash(win?'연습 상대의 체력을 회복했습니다':'연습 모드 · 체력을 회복했습니다');return}finished=true;charge.clear();enemyCharge.clear();moveTarget=null;if(win)wins++;else losses++;$('wins').textContent=wins;$('losses').textContent=losses;$('resultTitle').textContent=win?'승리':'패배';$('resultText').textContent=win?'주문을 조합해 상대 마법사를 제압했습니다.':'몬스터의 공격을 피하며 사냥하세요. 새 대결은 레벨 1부터 시작합니다.';$('result').classList.remove('hidden')}
function reset(){resetHunt();spellVfx.clear();pixelVfx.clear();enemy.strikePoint=null;enemy.strikeLocked=false;enemyCharge.clear();enemyLoadout=chooseLoadout();enemyProgress=createProgress(enemyLoadout);enemyTarget=null;enemy.retaliate=0;fallingStrikes=[];enemy.lastSpell="";enemy.lastSpellTime=0;for(const a of[player,enemy]){a.motion.clear();a.slow=0;a.burn=0;a.echo=null;a.burnTick=0;a.shieldHeat=false;}roll.reset();player.velocity=new T.Vector3();enemy.dodge=0;enemy.dodgeCool=0;enemy.defendCool=0;enemy.attackCount=0;enemy.sidestep=1;for(const s of shots)remove(s.m);for(const f of fields)remove(f.m);for(const f of fx)remove(f.m);for(const w of [...waves,...wards])remove(w.m);waves=[];wards=[];shots=[];fields=[];fx=[];Object.assign(player,{x:-5,z:4,hp:100,mana:100,shield:0,shieldTime:0,cool:0});Object.assign(enemy,{x:16,z:-14,hp:100,mana:100,shield:0,shieldTime:0,cool:2,wind:0});charge.clear();moveTarget=null;finished=false;paused=false;clock=0;history=[];$('history').textContent='짧게 눌러 첫 마법을 써보세요.';$('result').classList.add('hidden');$('paused').classList.add('hidden');$('pause').textContent='일시정지';$('spellName').textContent='Q · W · E';$('tier').textContent='1륜 · 준비';$('queue').textContent='길게 누르면 원이 차례로 쌓입니다'}
function pause(value=!paused){if(!running||finished)return;paused=value;charge.clear();moveTarget=null;$('paused').classList.toggle('hidden',!paused);$('pause').textContent=paused?'계속하기':'일시정지'}
function point(e){const rect=canvas.getBoundingClientRect();pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);ray.setFromCamera(pointer,camera);const pos=new T.Vector3();if(ray.ray.intersectPlane(ground,pos)){aim.copy(pos);const d=pos.clone().sub(new T.Vector3(player.x,0,player.z));if(d.length()>.1)player.dir.copy(d.normalize());}return pos}
canvas.addEventListener('pointermove',e=>{point(e);if(e.buttons===2&&running&&!paused)moveTarget=aim.clone()});canvas.addEventListener('contextmenu',e=>e.preventDefault());canvas.addEventListener('pointerdown',e=>{point(e);if(e.button===2&&running&&!paused&&!finished){moveTarget=aim.clone();marker.position.set(aim.x,.07,aim.z);marker.visible=true}});
window.addEventListener('keydown',e=>{if(!$('selection').classList.contains('hidden')){const slot={KeyQ:'q',KeyW:'w',KeyE:'e'}[e.code];if(slot){e.preventDefault();activeSlot=slot;renderSelection()}if(e.code==='Escape'&&selectionReturn){cancelSelection()}return;}if(!$('intro').classList.contains('hidden'))return;if(e.code==='Space'){e.preventDefault();if(!e.repeat&&running&&!paused&&!finished){const d=aim.clone().sub(new T.Vector3(player.x,0,player.z));if(d.length()<.1)d.copy(player.dir);if(roll.start(d.x,d.z)){player.motion.clear();moveTarget=null;marker.visible=false;ring(player.x,player.z,0xe6d5a2,.9,.3);pixelVfx.play('dash-dust',player.x,player.z,{width:1.7});flash('구르기 · 주문 유지')}else flash('구르기 재사용 '+roll.cooldown.toFixed(1)+'초')}return;}if(e.code==='KeyP'&&!e.repeat){pause();return}if(e.code==='Escape'){charge.clear();flash('주문 취소');return}const key={KeyQ:'q',KeyW:'w',KeyE:'e'}[e.code];if(key){e.preventDefault();if(running&&!paused&&!finished){if(progress.ranks[key])charge.down(key);else if(!e.repeat)flash('아직 배우지 않은 1륜입니다. 몬스터를 사냥하고 스킬 포인트로 배우세요.');}}});
window.addEventListener('keyup',e=>{const key={KeyQ:'q',KeyW:'w',KeyE:'e'}[e.code];if(key){e.preventDefault();const r=charge.up(key);if(r)cast(r)}});
window.addEventListener('blur',()=>pause(true));document.addEventListener('visibilitychange',()=>{if(document.hidden)pause(true)});
$('start').onclick=()=>{$('intro').classList.add('hidden');pause(false)};$('help').onclick=()=>{if(!running)return;pause(true);$('helpLoadout').textContent=KEYS.map(k=>k.toUpperCase()+' '+RUNES[loadout[k]].name).join(' · ');$('helpCombo').textContent=spellName(mapSequence(['q','w'],loadout),NAMES);$('intro').classList.remove('hidden');$('start').innerHTML='계속하기 <span>↗</span>'};$('pause').onclick=()=>pause();$('reset').onclick=()=>{if(!running)return;reset();running=true;$('intro').classList.add('hidden')};$('again').onclick=()=>{reset();running=true};$('botToggle').onclick=()=>{bot=!bot;reset();$('botToggle').textContent=bot?'대결 모드':'연습 모드';$('botToggle').title=bot?'연습 모드로 전환':'대결 모드로 전환';$('botToggle').classList.toggle('practice',!bot);$('modeNote').textContent=bot?'대결 모드 · 누르면 연습 모드로 전환':'연습 모드 · 상대 정지 · 마력 무제한';flash(bot?'대결 모드 · 새 대결 시작':'연습 모드 · 승패 없이 조합을 연습하세요');};
function ai(dt){
 if(!bot)return;enemy.retaliate=Math.max(0,(enemy.retaliate||0)-dt);enemy.cool=Math.max(0,enemy.cool-dt);enemy.mana=Math.min(100,enemy.mana+dt*(enemyCharge.active?3:10));enemy.lastSpellTime=Math.max(0,(enemy.lastSpellTime||0)-dt);
 if(!enemyCharge.active){const pd=Math.hypot(player.x-enemy.x,player.z-enemy.z);const prey=monsters.filter(m=>!m.dead).sort((a,b)=>Math.hypot(a.x-enemy.x,a.z-enemy.z)-Math.hypot(b.x-enemy.x,b.z-enemy.z));enemyTarget=(pd<3.5||enemy.retaliate>0&&pd<12)?player:prey[0]||player;}
 if(!enemyTarget||enemyTarget.dead){enemyCharge.clear();enemyTarget=null;return;}
 const target=enemyTarget,delta=new T.Vector3(target.x-enemy.x,0,target.z-enemy.z),dist=delta.length();delta.normalize();
 if(!enemyCharge.active||enemyCharge.remaining>.35)enemy.dir.copy(delta);
 if(!enemyCharge.active&&enemy.cool<=0&&dist<7&&enemy.mana>=25){enemyCharge.start(chooseLearnedPlan(enemyLoadout,enemyProgress,enemy.attackCount||0,enemy.hp,dist));enemy.attackCount=(enemy.attackCount||0)+1;}
 const seq=enemyCharge.active?mapSequence(enemyCharge.plan,enemyLoadout):enemyLoadout[KEYS.find(k=>enemyProgress.ranks[k]>0&&enemyLoadout[k]!=='e')];
 const spec=groundSpec(seq)||elementalSpec(seq)||forceSpec(seq)||wardSpec(seq),reach=spec.range;
 let v=delta.clone();if(dist<reach*.68)v.set(0,0,0);if(dist<1.6)v.copy(delta).multiplyScalar(-1);
 const speed=(enemy.motion.active?0:enemyCharge.active&&enemyCharge.remaining<=.35?0:enemyCharge.active?2.8:4.4)*(enemy.slow>0?.55:1),ox=enemy.x,oz=enemy.z;
 move(enemy,v.x*speed*dt,v.z*speed*dt);
 if(v.lengthSq()>0&&Math.hypot(enemy.x-ox,enemy.z-oz)<dt*.2){const side=new T.Vector3(-delta.z,0,delta.x).multiplyScalar(enemy.sidestep||1);if(collides(enemy.x+side.x*.5,enemy.z+side.z*.5)||wallBlocks(enemy,{x:enemy.x+side.x*.5,z:enemy.z+side.z*.5}))enemy.sidestep=-(enemy.sidestep||1);move(enemy,side.x*speed*dt,side.z*speed*dt);}
 if(enemyCharge.active){const spell=enemyCharge.tick(dt,enemyLoadout);if(spell){if(enemy.mana>=spell.cost){enemy.mana-=spell.cost;spell.mastery=mastery(enemyProgress,spell.parts[0]);spell.power*=spell.mastery;dispatchSpell(spell,enemy,enemy.dir.clone(),new T.Vector3(target.x,0,target.z));enemy.lastSpell=spell.name;enemy.lastSpellTime=.8;}enemy.cool=.65+rand()*.4;}}
}
function update(dt){clock+=dt;updateHunt(dt);
 for(const a of[player,enemy,...monsters.filter(m=>!m.dead)]){if(a.motion.active){const step=a.motion.tick(dt),count=Math.max(1,Math.ceil(Math.hypot(step.x,step.z)/.08));for(let i=0;i<count;i++){const dx=step.x/count,dz=step.z/count;if(collides(a.x+dx,a.z+dz)||wallBlocks(a,{x:a.x+dx,z:a.z+dz})){a.motion.clear();break;}a.x+=dx;a.z+=dz;}}}
const rolling=roll.active;const beforeX=player.x,beforeZ=player.z;if(rolling){const step=roll.tick(dt);for(let i=0;i<4;i++)move(player,step.x/4,step.z/4)}else{roll.tick(dt);charge.tick(dt)}player.cool=Math.max(0,player.cool-dt);player.mana=bot?Math.min(100,player.mana+dt*(charge.active?3:10)):100;
 if(moveTarget&&!rolling&&!player.motion.active){const d=moveTarget.clone().sub(new T.Vector3(player.x,0,player.z));if(d.length()<.15){moveTarget=null;marker.visible=false}else{d.normalize();const speed=(charge.active?2.8:4.4)*(player.slow>0?.55:1);const ox=player.x,oz=player.z;move(player,d.x*dt*speed,d.z*dt*speed);if(Math.abs(ox-player.x)+Math.abs(oz-player.z)<.001){moveTarget=null;marker.visible=false}}}
 player.velocity=new T.Vector3((player.x-beforeX)/dt,0,(player.z-beforeZ)/dt);
 const facing=aim.clone().sub(new T.Vector3(player.x,0,player.z));if(facing.length()>.1)player.dir.copy(facing.normalize());
 updateStatuses(dt);if(finished)return;
 updateForces(dt);updateFalling(dt);if(finished)return;ai(dt);
 for(const a of[player,enemy]){a.shieldTime=Math.max(0,a.shieldTime-dt);if(a.shieldTime<=0)a.shield=0}
 updateOrbs(dt);
 for(let i=fields.length-1;i>=0;i--){const f=fields[i];if(f.ground){const alive=advanceGround(f,dt,()=>tickGround(f));f.m.material.opacity=.14+.05*(1+Math.sin(clock*4));if(!alive){remove(f.m);fields.splice(i,1);}continue;}f.life-=dt;f.tick-=dt;f.m.material.opacity=.12+Math.sin(clock*5)*.04;if(f.tick<=0){f.tick=.5;area(f.owner,f.x,f.z,f.r,f.damage*.5,f.color,f.force,null,f.payload)}if(f.life<=0){remove(f.m);fields.splice(i,1)}}
 if(toastTimer>0){toastTimer-=dt;if(toastTimer<=0)$('toast').classList.remove('show')}
}
function label(el,a){const pos=new T.Vector3(a.x,2.65,a.z).project(camera);el.style.display=Math.abs(pos.x)>1||Math.abs(pos.y)>1?'none':'';el.style.left=((pos.x+1)*innerWidth/2)+'px';el.style.top=((-pos.y+1)*innerHeight/2)+'px'}
function drawTell(caster,seq,attackTell,tellBorder,urgent=false){const spec=groundSpec(seq)||elementalSpec(seq)||forceSpec(seq);if(!spec)return;
 const outline=[],color=RUNES[seq[0]].color;
 if(spec.ground){const point=groundPoint(caster,caster===player?aim:(enemyTarget||player),spec.range,collides);for(let i=0;i<=64;i++){const a=i/64*Math.PI*2;outline.push(new T.Vector3(point.x+Math.cos(a)*spec.radius,0,point.z+Math.sin(a)*spec.radius));}}
 else if(spec.projectile){let reach=spec.range;for(let t=.1;t<=spec.range;t+=.1)if(collides(caster.x+caster.dir.x*t,caster.z+caster.dir.z*t,spec.radius)){reach=t;break;}const side=new T.Vector3(-caster.dir.z,0,caster.dir.x).multiplyScalar(spec.radius+.2),start=new T.Vector3(caster.x,0,caster.z),end=start.clone().addScaledVector(caster.dir,reach);outline.push(start.clone().add(side),end.clone().add(side),end.clone().sub(side),start.clone().sub(side),start.clone().add(side));}
 else if(spec.overhead){const point=caster;for(let i=0;i<=64;i++){const angle=i/64*Math.PI*2;outline.push(new T.Vector3(point.x+Math.cos(angle)*spec.range,0,point.z+Math.sin(angle)*spec.range));}}
 else{outline.push(new T.Vector3(caster.x,0,caster.z));for(let i=0;i<=48;i++){const angle=-spec.halfAngle+i/48*spec.halfAngle*2,d=caster.dir.clone().applyAxisAngle(new T.Vector3(0,1,0),angle);let reach=spec.range;for(let t=.1;t<=spec.range;t+=.1)if(collides(caster.x+d.x*t,caster.z+d.z*t,.02)){reach=Math.max(0,t-.1);break;}outline.push(new T.Vector3(caster.x+d.x*reach,0,caster.z+d.z*reach));}outline.push(new T.Vector3(caster.x,0,caster.z));}
 const center=spec.ground?new T.Vector3(outline[0].x-spec.radius,0,outline[0].z):spec.overhead?new T.Vector3(caster.x,0,caster.z):outline[0],vertices=[];for(let i=0;i<outline.length-1;i++)vertices.push(center.x,0,center.z,outline[i].x,0,outline[i].z,outline[i+1].x,0,outline[i+1].z);
 attackTell.geometry.dispose();attackTell.geometry=new T.BufferGeometry();attackTell.geometry.setAttribute('position',new T.Float32BufferAttribute(vertices,3));attackTell.material.color.set(color);attackTell.material.opacity=urgent?.38:.21;attackTell.visible=true;
 tellBorder.geometry.dispose();tellBorder.geometry=new T.BufferGeometry().setFromPoints(outline);tellBorder.material.color.set(urgent?0xffffff:color);tellBorder.visible=true;
}
function renderAttackTell(){
 attackTell.visible=false;tellBorder.visible=false;playerTell.visible=false;playerBorder.visible=false;wardGhost.visible=false;
 if(bot&&running&&!finished&&enemyCharge.active)drawTell(enemy,mapSequence(enemyCharge.plan,enemyLoadout),attackTell,tellBorder,enemyCharge.remaining<.55);
 if(!running||finished||!charge.active){player.strikePoint=null;return;}
 const spell=resolveSpell({parts:[...charge.parts],progress:charge.progress,tap:charge.elapsed<.15},loadout),spec=groundSpec(spell.sequence)||elementalSpec(spell.sequence)||forceSpec(spell.sequence);if(!spec){player.strikePoint=null;if(spell.sequence[0]==='e'){const ward=wardSpec(spell.sequence),point=wardPlacement(player,player.dir,ward.moving?new T.Vector3(player.x,0,player.z).addScaledVector(player.dir,1.2):aim,ward);wardGhost.position.set(point.x,1.2,point.z);wardGhost.rotation.y=Math.atan2(player.dir.x,player.dir.z);wardGhost.scale.x=ward.width;wardGhost.material.color.set(RUNES[ward.colors.find(k=>k!=="e")||"e"].color);wardGhost.visible=true;if(ward.moving){const points=[point.clone().add(new T.Vector3(-player.dir.z,0,player.dir.x).multiplyScalar(ward.width/2)),point.clone().addScaledVector(player.dir,ward.travel).add(new T.Vector3(-player.dir.z,0,player.dir.x).multiplyScalar(ward.width/2)),point.clone().addScaledVector(player.dir,ward.travel).add(new T.Vector3(player.dir.z,0,-player.dir.x).multiplyScalar(ward.width/2)),point.clone().add(new T.Vector3(player.dir.z,0,-player.dir.x).multiplyScalar(ward.width/2))];points.push(points[0].clone());playerBorder.geometry.dispose();playerBorder.geometry=new T.BufferGeometry().setFromPoints(points);playerBorder.material.color.set(0xa8dcff);playerBorder.visible=true;}}return;}
 player.strikePoint=null;
 drawTell(player,spell.sequence,playerTell,playerBorder);
}
function ui(){updateCamera();renderHunt();renderAttackTell();for(const a of[player,enemy]){const burning=a.burn>0,chilled=a.slow>0,tinted=burning||chilled;const c=new T.Color(burning&&(!chilled||Math.floor(clock*4)%2===0)?0xff543e:0x479eff);for(const entry of a.g.userData.palette){entry.material.color.copy(entry.color);if(tinted)entry.material.color.lerp(c,.48);}a.g.position.set(a.x,0,a.z);a.g.rotation.y=Math.atan2(a.dir.x,a.dir.z);const shield=shields.get(a);shield.position.set(a.x,1,a.z);if(a.shield>0&&!shield.userData.active)pixelVfx.play('shield-bubble',a.x,a.z,{width:1.8,duration:a.shieldTime,loop:true,follow:()=>a.shield>0?{x:a.x,z:a.z,y:.12}:null});shield.userData.active=a.shield>0;shield.rotation.y=clock*.6}label($('playerLabel'),player);label($('enemyLabel'),enemy);$('playerHp').style.width=player.hp+'%';$('enemyHp').style.width=enemy.hp+'%';$('manaBar').style.width=player.mana+'%';$('manaText').textContent=Math.floor(player.mana);$('enemyCast').textContent=!bot?'연습 상대':enemyCharge.active?spellName(mapSequence(enemyCharge.charge.parts,enemyLoadout),NAMES)+' · 충전':enemy.lastSpellTime>0?enemy.lastSpell+' · 발사':enemy.slow>0?'감속 중':enemy.burn>0?'화상 중':(enemyTarget?.monster?'몬스터 사냥 중':'상대 마법사');$('enemyLevel').textContent='Lv. '+enemyProgress.level+' · 사냥 '+enemyProgress.kills;$('time').textContent=String(Math.floor(clock/60)).padStart(2,'0')+':'+String(Math.floor(clock%60)).padStart(2,'0');
 const ec=enemyCharge.charge,enemyCharging=bot&&running&&!finished&&ec.active;
 $('enemyOrbs').innerHTML=enemyCharging?ec.parts.map((key,i)=>{const rune=RUNES[enemyLoadout[key]];return `<div class="orb" title="${rune.name}" style="--c:${rune.color};--p:${i<ec.parts.length-1?100:ec.progress*100}%"><span>${rune.icon}</span></div>`}).join(''):'';
 $('enemyOrbs').classList.toggle('charging',enemyCharging);
 enemyAimLine.visible=enemyCharging&&enemyLoadout[ec.parts[0]]==='e';if(enemyCharging){const seq=mapSequence(ec.parts,enemyLoadout),spec=groundSpec(seq)||elementalSpec(seq)||forceSpec(seq)||wardSpec(seq),end=new T.Vector3(enemy.x,.13,enemy.z).addScaledVector(enemy.dir,spec.range);enemyAimLine.geometry.dispose();enemyAimLine.geometry=new T.BufferGeometry().setFromPoints([new T.Vector3(enemy.x,.13,enemy.z),end]);enemyAimLine.material.color.set(RUNES[seq[0]].color);}
 $('enemyLoadout').innerHTML=KEYS.map(k=>{const r=RUNES[enemyLoadout[k]];const rank=enemyProgress.ranks[k];return `<span style="color:${rank?r.color:'#75838c'}" title="${rank?'숙련 '+rank:'미습득'}">${rank?r.icon:'🔒'} ${r.name}${rank?' '+rank:''}</span>`}).join(' · ');
 $('rollStatus').textContent=roll.active?'구르는 중':roll.cooldown>0?'구르기 '+roll.cooldown.toFixed(1)+'초':'Space 구르기 · 준비';$('rollStatus').classList.toggle('ready',roll.cooldown<=0);
 for(const a of[player,enemy]){const body=a.g.userData.body;if(!body)continue;const angle=a.g.rotation.y,m=a.motion,localX=m.x*Math.cos(angle)-m.z*Math.sin(angle),localZ=m.x*Math.sin(angle)+m.z*Math.cos(angle);body.rotation.x=m.lean*localZ;body.rotation.z=-m.lean*localX;if(a===player&&roll.active){body.rotation.x=(1-roll.remaining/ROLL_DURATION)*Math.PI*2;body.rotation.z=0;}}
 for(const k of['q','w','e'])$('key-'+k).classList.toggle('active',charge.held.includes(k));
 if(charge.active){$('orbs').innerHTML=charge.parts.map((k,i)=>`<div class="orb" style="--c:${RUNES[loadout[k]].color};--p:${i<charge.parts.length-1?100:charge.progress*100}%"><span>${RUNES[loadout[k]].icon}</span></div>`).join('')+(charge.parts.length<3?`<div class="orb next" style="--c:${RUNES[loadout[charge.next()]].color};--p:100%"><span>${RUNES[loadout[charge.next()]].icon}</span></div>`:'');const seq=charge.parts.join('');$('spellName').textContent=spellName(mapSequence(charge.parts,loadout),NAMES);$('tier').textContent=charge.parts.length===1?'1륜 · 충전':charge.parts.length+'중 2륜 · 충전';$('queue').textContent=seq.toUpperCase().split('').join(' → ')+(charge.parts.length<3?'  / 다음 '+charge.next().toUpperCase():charge.progress>=1?'  / 놓으면 발사':'');$('chargeBar').style.width=(charge.progress*100)+'%';$('chargeBar').style.background=RUNES[loadout[charge.parts.at(-1)]].color;
 }else{$('orbs').innerHTML='';$('chargeBar').style.width='0%'}
 const end=new T.Vector3(player.x, .08,player.z).addScaledVector(player.dir,charge.active?7:3);aimLine.geometry.dispose();aimLine.geometry=new T.BufferGeometry().setFromPoints([new T.Vector3(player.x,.08,player.z),end]);aimLine.visible=running&&!finished;
}
function renderGuide(){const n=Number($('guideTier').value),first=$('guideFirst').value;let rows=[first];for(let i=1;i<n;i++)rows=rows.flatMap(s=>KEYS.map(k=>s+k));$('guideList').innerHTML=rows.map(keys=>{const seq=mapSequence([...keys],loadout);return `<div class="guide-item"><b>${keys.toUpperCase().split('').join(' → ')} · ${spellName(seq,NAMES)}</b><span>${describeSpell(seq)}</span></div>`}).join('');}
$('guideTier').onchange=renderGuide;$('guideFirst').onchange=renderGuide;
function syncLoadout(){renderGuide();for(const k of KEYS){const r=RUNES[loadout[k]],node=$('key-'+k);node.style.setProperty('--key',r.color);node.querySelector('.glyph').textContent=r.icon;node.querySelector('b').textContent=r.name;node.querySelector('small').textContent=r.hint;}}
function renderSelection(){
 $('slotPicker').innerHTML=KEYS.map(k=>{const r=RUNES[draft[k]];return `<button type="button" class="slot-btn" data-slot="${k}" aria-pressed="${k===activeSlot}" aria-label="${k.toUpperCase()} 슬롯 ${r.name}" style="--rune:${r.color}"><kbd>${k.toUpperCase()}</kbd><span class="slot-glyph">${r.icon}</span><b>${r.name}</b></button>`}).join('');
 $('runePicker').innerHTML=Object.entries(RUNES).map(([id,r])=>{const assigned=KEYS.find(k=>draft[k]===id);return `<button type="button" class="rune-btn" data-rune="${id}" aria-label="${r.name} 선택" aria-pressed="${!!assigned}" style="--rune:${r.color}"><span class="rune-symbol">${r.icon}</span><strong>${r.name}</strong>${assigned?`<span class="assigned">${assigned.toUpperCase()}</span>`:''}<small>${r.desc}</small></button>`}).join('');
 $('selectionMessage').textContent=activeSlot.toUpperCase()+'에 넣을 마법을 선택하세요. 이미 배치된 마법을 고르면 서로 자리를 바꿉니다.';
 $('comboPreview').innerHTML=[['q','w'],['w','q'],['q','e']].map(keys=>`<span class="preview-item"><b>${keys.join(' → ').toUpperCase()}</b>${spellName(mapSequence(keys,draft),NAMES)}</span>`).join('');
}
function openSelection(){selectionReturn=running&&!finished;pause(true);charge.clear();draft={...loadout};activeSlot='q';$('intro').classList.add('hidden');$('result').classList.add('hidden');$('cancelSelection').classList.toggle('hidden',!selectionReturn);$('confirmSelection').textContent=running?'이 마법으로 새 결투 시작 ↗':'선택한 마법으로 시작 ↗';$('selection').classList.remove('hidden');renderSelection();}
function cancelSelection(){$('selection').classList.add('hidden');if(selectionReturn)pause(false)}
 $('slotPicker').onclick=e=>{const b=e.target.closest('[data-slot]');if(b){activeSlot=b.dataset.slot;renderSelection()}};
 $('runePicker').onclick=e=>{const b=e.target.closest('[data-rune]');if(b){draft=assignRune(draft,activeSlot,b.dataset.rune);renderSelection()}};
 $('confirmSelection').onclick=()=>{if(!validLoadout(draft))return;loadout={...draft};try{localStorage.setItem('mage-loadout-v1',JSON.stringify(loadout))}catch{}syncLoadout();reset();running=true;$('selection').classList.add('hidden');const first=KEYS.find(k=>progress.ranks[k]);flash(first.toUpperCase()+' '+RUNES[loadout[first]].name+' 습득 · 몬스터를 처치해 나머지 마법을 배우세요.');};
 $('cancelSelection').onclick=cancelSelection;$('choose').onclick=openSelection;$('resultChoose').onclick=openSelection;

function spawnMonster(near=null){if(monsters.filter(m=>!m.dead).length>=12)return;
 let x,z,valid=false;for(let n=0;n<80;n++){x=near?near.x+(Math.random()-.5)*4:(Math.random()-.5)*44;z=near?near.z+(Math.random()-.5)*4:(Math.random()-.5)*40;
 if(!collides(x,z,.8)&&!wards.some(w=>distanceToWard({x,z},w)<1)&&Math.hypot(x-player.x,z-player.z)>2.5&&Math.hypot(x-enemy.x,z-enemy.z)>2.5&&!monsters.some(m=>!m.dead&&Math.hypot(m.x-x,m.z-z)<1.6)){valid=true;break;}}
 if(!valid)return;const type=Math.floor(Math.random()*3),colors=[0x9cc96e,0xd5aa68,0x9ba8da],hp=[22,30,38][type],g=new T.Group();scene.add(g);const body=mesh(new T.IcosahedronGeometry(.5+type*.06,1),mat(colors[type]),0,.65,0,g);body.scale.y=.8;for(const dx of[-.17,.17])mesh(new T.SphereGeometry(.08,6,4),mat(0x172328),dx,.76,.4,g);
 const back=box(0,1.35,0,.85,.07,.07,mat(0x242d32),g),bar=box(0,1.36,.01,.82,.055,.08,mat(0x9ae36d),g);
 monsters.push({id:++monsterId,monster:true,g,body,bar,color:new T.Color(colors[type]),x,z,homeX:x,homeZ:z,hp,maxHp:hp,xp:[20,25,30][type],shield:0,motion:new ForcedMotion(),dir:new T.Vector3(0,0,1),cool:1,wind:0,type,dead:false});ring(x,z,0xb7d38b,.8,.5);
}
function resetHunt(){for(const m of monsters)remove(m.g);monsters=[];progress=createProgress(loadout);spawnTimer=0;renderProgress();}
function killMonster(m,source){if(m.dead)return;m.dead=true;ring(m.x,m.z,0xe9cb73,1,.5);remove(m.g);
 if(source===player||source===enemy){const state=source===player?progress:enemyProgress,levels=awardKill(state,m.xp);if(levels)pixelVfx.play('level-up',source.x,source.z,{width:2});source.mana=Math.min(100,source.mana+10);
 if(levels){source.hp=Math.min(100,source.hp+20);ring(source.x,source.z,0xffdf83,2,.8);if(source===enemy)spendEnemyPoints(enemyProgress,enemyLoadout);else flash('레벨 '+progress.level+' · 스킬 포인트 +'+levels);}else if(source===player)flash('몬스터 처치 · 경험치 +'+m.xp);if(source===player)renderProgress();}}
function updateHunt(dt){spawnTimer-=dt;if(spawnTimer<=0){spawnTimer=5;if(!monsters.length){for(const p of[{x:-10,z:3},{x:-7,z:10},{x:-15,z:-3},{x:8,z:6},{x:12,z:-15},{x:18,z:-9},{x:20,z:-17}])spawnMonster(p);}spawnMonster();}
 for(const m of monsters){if(m.dead)continue;m.cool=Math.max(0,m.cool-dt);const nearest=bot&&Math.hypot(enemy.x-m.x,enemy.z-m.z)<Math.hypot(player.x-m.x,player.z-m.z)?enemy:player,target=m.aggroTarget&&(m.aggroTarget!==enemy||bot)?m.aggroTarget:nearest,dx=target.x-m.x,dz=target.z-m.z,d=Math.hypot(dx,dz),speed=(m.slow>0?.55:1)*1.45;
 if(d<(m.aggro?6.5:3.2)){m.dir.set(dx,0,dz).normalize();if(m.wind>0){m.wind-=dt;if(m.wind<=0){if(d<1.5)hit(target,2+m.type,m.dir,0,m);m.cool=2;}}else if(d<1.2&&m.cool<=0){m.wind=.5;}else if(d>1&&!m.motion.active)move(m,m.dir.x*speed*dt,m.dir.z*speed*dt);}
 else {m.wind=0;m.aggro=false;m.aggroTarget=null;const hx=m.homeX-m.x,hz=m.homeZ-m.z,hd=Math.hypot(hx,hz);if(hd>.5&&!m.motion.active)move(m,hx/hd*dt,hz/hd*dt);}
 m.g.position.set(m.x,0,m.z);m.g.rotation.y=Math.atan2(m.dir.x,m.dir.z);m.body.position.y=.65+Math.sin(clock*5+m.id)*.06;m.body.material.color.copy(m.color);if(m.wind>0)m.body.material.color.set(0xff6655);else if(m.burn>0)m.body.material.color.lerp(new T.Color(0xff543e),.6);else if(m.slow>0)m.body.material.color.lerp(new T.Color(0x479eff),.6);m.bar.scale.x=m.hp/m.maxHp;
 }monsters=monsters.filter(m=>!m.dead);
}
function renderProgress(){if(!$('growth'))return;$('growthLevel').textContent='레벨 '+progress.level;$('skillPoints').textContent='스킬 포인트 '+progress.points;
 for(const k of KEYS){const n=progress.ranks[k],r=RUNES[loadout[k]],el=$('learn-'+k);el.disabled=progress.points<1||n>=MAX_RANK;el.textContent=n===0?r.name+' 배우기':n<MAX_RANK?r.name+' 강화 '+(n+1):r.name+' 숙련 완료';$('key-'+k).classList.toggle('unlearned',n===0);$('key-'+k).querySelector('small').textContent=n?'숙련 '+n+' / 3 · '+(n===1?'기본 위력':(loadout[k]==='e'?'내구도':'직접 피해')+' +'+((n-1)*15)+'%'):'미습득 · 스킬 포인트 필요';}
}
function updateCamera(){const fit=Math.max(1,1.1/camera.aspect);camera.position.set(player.x+12*fit,17*fit,player.z+15*fit);camera.lookAt(player.x,0,player.z);camera.updateMatrixWorld();}
function renderHunt(){const need=requiredXP(progress.level);$('xpText').textContent=progress.level===MAX_LEVEL?'최대 레벨 · 사냥 '+progress.kills:progress.xp+' / '+need+' XP · 사냥 '+progress.kills;$('xpBar').style.width=(progress.level===MAX_LEVEL?100:progress.xp/need*100)+'%';
 const c=$('minimap').getContext('2d');c.fillStyle='#17242b';c.fillRect(0,0,180,160);const p=a=>({x:(a.x+25)/50*180,y:(a.z+23)/46*160});for(const o of obstacles){const q=p(o);c.fillStyle='#637272';c.fillRect(q.x-o.w*1.8,q.y-o.h*1.74,o.w*3.6,o.h*3.48);}for(const a of [...monsters,enemy,player]){if(a.dead)continue;const q=p(a);c.fillStyle=a===player?'#e9d393':a===enemy?'#ff837b':'#a7d878';c.beginPath();c.arc(q.x,q.y,a.monster?2.5:3.5,0,7);c.fill();}}
for(const k of KEYS){$('learn-'+k).onclick=()=>{if(!running||paused||finished)return;if(learn(progress,k)){charge.clear();renderProgress();flash(RUNES[loadout[k]].name+(progress.ranks[k]===1?' 습득 · '+k.toUpperCase()+'로 사용':' 숙련도 상승'));}};}
 syncLoadout();renderProgress();renderSelection();
function resize(){renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.fov=38;const fit=Math.max(1,1.4/camera.aspect);camera.position.set(player.x+12*fit,17*fit,player.z+15*fit);camera.far=140*fit;camera.lookAt(player.x,0,player.z);camera.updateProjectionMatrix()}window.addEventListener('resize',resize);resize();
let prev=performance.now();function frame(now){requestAnimationFrame(frame);const dt=Math.min(.04,(now-prev)/1000);prev=now;if(running&&!paused&&!finished)update(dt);if(!paused)for(let i=fx.length-1;i>=0;i--){const f=fx[i];f.life-=dt;if(f.ring){f.m.scale.setScalar(f.r*(.55+.45*(1-f.life/f.max)));f.m.material.opacity=Math.max(0,f.life/f.max*.65)}else if(f.v){f.m.position.addScaledVector(f.v,dt);f.v.y-=dt*8}else if(f.m.material.transparent)f.m.material.opacity=Math.max(0,f.life/f.max*.5);if(f.life<=0){remove(f.m);fx.splice(i,1)}}if(!paused){spellVfx.update(dt);pixelVfx.update(dt);}ui();renderer.render(scene,camera)}requestAnimationFrame(frame);
// Read-only diagnostics for input and rendering verification.
window.mageDebug=()=>({loadout:{...loadout},running,paused,bot,finished,charge:{parts:[...charge.parts],held:[...charge.held],progress:charge.progress},history:[...history],roll:{active:roll.active,cooldown:roll.cooldown,invulnerable:roll.invulnerable},progress:structuredClone(progress),monsters:monsters.filter(m=>!m.dead).map(m=>({id:m.id,x:m.x,z:m.z,hp:m.hp})),player:{x:player.x,z:player.z,hp:player.hp,mana:player.mana},enemy:{progress:structuredClone(enemyProgress),target:enemyTarget?.monster?'monster':enemyTarget?'player':null,x:enemy.x,z:enemy.z,hp:enemy.hp,mana:enemy.mana,loadout:{...enemyLoadout},charge:{parts:[...enemyCharge.charge.parts],progress:enemyCharge.charge.progress,remaining:enemyCharge.remaining},lastSpell:enemy.lastSpell},groundZones:fields.filter(f=>f.ground).map(f=>({x:f.x,z:f.z,radius:f.r,life:f.life})),projectiles:shots.map(s=>({kind:s.spec.kind,radius:s.spec.radius,speed:s.spec.speed,distance:s.distance})),walls:wards.map(w=>({x:w.x,z:w.z,moving:w.speed>0,travelled:w.travelled})),vfx:spellVfx.stats(),pixelVfx:pixelVfx.stats(),objects:scene.children.length});
