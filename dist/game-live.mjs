import {wheelZoomSpan} from './camera-zoom.mjs';
import {MONSTERS,createMonster,animateMonster,tickMonster,cancelMonsterAttack} from './monsters.mjs?v=half-size-1';
import {toolbarIcon} from './toolbar-icons.mjs?v=toolbar-icons-1';
import {ImpactFeedback} from './impact-feedback.mjs?v=game-impact-1';
import {iceMovement} from './ice-motion.mjs?v=ice-detail-1';
import {roundDamage} from './damage-number.mjs?v=integer-damage-1';
import {projectileGuideSpec,projectileGuidePoints} from './projectile-guide.mjs?v=forward-glow-1';
import {cursorAim,spellAimHeight} from './cursor-aim.mjs?v=shift-trajectory-1';
import {hasIceRecipe,iceSpec} from './ice-spec.mjs?v=shift-trajectory-1';
import {HealthHUD} from './health-hud.mjs?v=game-impact-1';
import {renderSkillUpgrades} from './skill-upgrades.mjs?v=shift-trajectory-1';
import {readMovement} from './character-movement.mjs?v=turn-rates-1';
import {BodyFollow} from './body-follow.mjs?v=wasd-facing-1';
import {attackCooldown} from './attack-cooldown.mjs';
import {wardTouches,setCombatCamera} from './combat-hit.mjs?v=monsters-half-1';
import {HitboxView} from './hitbox-view.mjs?v=no-floor-rings-1';
import {LevelUpVfx} from './level-up-vfx.mjs?v=screenhit10';
import {FrostVisuals} from './frost-visuals.mjs?v=shift-trajectory-1';
import {ICE_BASIC} from './ice-basic.mjs?v=forward-glow-1';
import {SpaceSkill,SPACE_SKILLS,interceptSpaceShots} from './space-skills.mjs?v=ice-trail-fall-1';
import {SpaceVisuals} from './space-visuals.mjs?v=ice-trail-fall-1';
import {CHARACTERS,characterFor,chooseCharacter,chooseSupport} from './character-loadout.mjs?v=integer-damage-1';
import {GameAudio} from './game-audio.mjs?v=game-impact-1';
import {damageSummary} from './damage-display.mjs?v=integer-damage-1';
import {Duel,STEP} from './duel.mjs?v=ice-trail-fall-1';
import {mountPvpUI} from './pvp-ui.mjs?v=game-selection-1';
import {OBSTACLES,arenaCollision} from './arena-rules.mjs';
import {buildTownMap,lightTown} from './town-map.mjs';
import {TOWN_HALF,ENCOUNTERS,DISTRICTS} from './town-layout.mjs';
import {createTownCamera,positionTownCamera} from './town-camera.mjs';
let onlineCore=null,pvp=null,onlineResultShown=false,lastOnlineAim=0,onlineRenderAt=0,onlinePrevious=null;
import {redLightningPlacement} from './red-lightning-spec.mjs?v=bolt17';
import {steamPlacement} from './steam-spec.mjs?v=bolt17';
import {BurnVisuals,applyBurnVisual} from './burn-visuals.mjs?v=no-floor-rings-1';
import {castWithPresentation,renderCastPresentation} from './cast-presentation.mjs?v=forward-glow-1';
import {CastRecoil,HitScreen,chargeSetback} from './combat-response.mjs?v=rim9';
import {VisionShade} from './vision-shade.mjs';
import {CastingFeedback,ChargeCamera,impactFeedback,RUNE_FORWARD} from './casting-feedback.mjs?v=forward-glow-1';
import {castControlsLocked,followCastAim,chargeTurnScale} from './cast-lock.mjs?v=charge-move-1';
import {chargeMoveScale} from './magic-motion.mjs?v=charge-move-1';
import {canSee} from './vision.mjs';
import {fireSpec,hasFireRecipe} from './fire-spec.mjs?v=bolt17';
import {bindDuelControls,mouseRecipe} from './duel-controls.mjs?v=shift-trajectory-1';
let walkDirection={x:0,z:0},icePressHand='left',moveSpeedScale=1;

const slotLabel=k=>({q:'기본',w:'좌클릭',e:'우클릭'}[k]);
import {createWizard,animateWizard,projectWizard,setWizardCharacter} from './wizard.mjs?v=no-floor-rings-1';
import {QueuedCharge} from './queued-charge.mjs?v=instant-first-ring-1';
import {LiveMagic} from './live-magic.mjs?v=ice-trail-fall-1';
import {spellReach} from './live-spells.mjs?v=integer-damage-1';
import {describe as describeDesign} from './combo-design.mjs?v=shift-trajectory-1';
import {MeshFeedback} from './mesh-feedback.mjs';
import {groundSpec,groundPoint,inGround,advanceGround} from './ground.mjs?v=integer-damage-1';
import {projectileAsset,groundAsset} from './effect-map.mjs?v=zones1';

import {advanceMovingWard} from './moving-ward.mjs?v=zones1';
import {FALL_SECONDS,overheadDelivery,segmentCircleHit} from './delivery.mjs?v=zones1';
import {createProgress,awardKill,requiredXP,learn,mastery,MAX_LEVEL,MAX_RANK} from './progression.mjs?v=zones1';
import {ForcedMotion} from './motion.mjs?v=zones1';
import {LowPolyVFX} from './lowpoly-vfx.mjs';
import {chooseLoadout,choosePlan,chooseLearnedPlan,spendEnemyPoints,OpponentCharge} from './live-opponent.mjs?v=integer-damage-1';
import {forceSpec,wardSpec,displacement,crossesWard,distanceToWard} from './forces.mjs?v=zones1';
import {elementalSpec,inElementCone,lightningPoint,lightningHits} from './elements.mjs?v=integer-damage-1';
const describeSpell=seq=>describeDesign(seq).steps.join(' ')+' '+damageSummary(seq)+' (완충·숙련 1·정지 표적 비교값)';
import * as T from './three.module.js';
import {Charge,ELEMENTS,NAMES,resolveSpell} from './live-charge-spells.mjs?v=integer-damage-1';
import {Roll,ROLL_DURATION,incomingThreat,enemyChargeProgress} from './combat.mjs?v=zones1';
import {RUNES,KEYS,DEFAULT_LOADOUT,validLoadout,assignRune,mapSequence,spellName,composition} from './live-loadout.mjs?v=integer-damage-1';
let loadout={...DEFAULT_LOADOUT};try{const saved=JSON.parse(localStorage.getItem('mage-loadout-v1'));if(validLoadout(saved))loadout=saved}catch{}
loadout=chooseCharacter(loadout,characterFor(loadout).id);
let progress=createProgress(loadout),monsters=[],spawnTimer=0,monsterId=0;
let draft={...loadout},selectionReturn=false;
const $=id=>document.getElementById(id),canvas=$('arena');
const gameAudio=new GameAudio();
const soundButton=document.createElement('button');soundButton.id='soundToggle';document.querySelector('.utility-actions').prepend(soundButton);
function soundLabel(){toolbarIcon(soundButton,gameAudio.enabled?'sound':'muted',gameAudio.enabled?'소리 끄기':'소리 켜기');soundButton.setAttribute('aria-pressed',String(gameAudio.enabled));}
soundLabel();toolbarIcon($('hitboxToggle'),'hitbox','히트박스 켜기');toolbarIcon($('pause'),'pause','일시정지');toolbarIcon($('reset'),'restart','경기 다시 시작');soundButton.onclick=()=>{gameAudio.setEnabled(!gameAudio.enabled);soundLabel();};
for(const event of ['pointerdown','keydown'])window.addEventListener(event,()=>void gameAudio.unlock(),{capture:true});
window.addEventListener('blur',()=>{gameAudio.focused=false;gameAudio.stopAll();});
window.addEventListener('focus',()=>{gameAudio.focused=true;});
document.addEventListener('visibilitychange',()=>{if(document.hidden)gameAudio.stopAll();});
const renderer=new T.WebGLRenderer({canvas,antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.outputColorSpace=T.SRGBColorSpace;renderer.setClearColor(0x2c3940);
const scene=new T.Scene();const camera=createTownCamera();positionTownCamera(camera);setCombatCamera(camera);let mapOverview=false,combatSpan=24,overviewSpan=128;
const impact=new ImpactFeedback(scene);
const castingFeedback=new CastingFeedback(scene),chargeCamera=new ChargeCamera();let chargeView={distance:1,fov:38,x:0,y:0};
const spellVfx=new LowPolyVFX(scene);const pixelVfx=new MeshFeedback(scene,spellVfx);

lightTown(scene);
const mat=(color,extra={})=>new T.MeshStandardMaterial({color,roughness:.87,flatShading:true,...extra});
function mesh(geo,material,x=0,y=0,z=0,parent=scene){const m=new T.Mesh(geo,material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m}
function box(x,y,z,w,h,d,material,parent=scene){return mesh(new T.BoxGeometry(w,h,d),material,x,y,z,parent)}
let seed=139;function rand(){seed=(seed*16807)%2147483647;return(seed-1)/2147483646}
const town=await buildTownMap(scene);const obstacles=OBSTACLES;
function wizard(color,trim){return createWizard(scene,color,trim);}
const visionShade=new VisionShade(scene);
const player={g:wizard(0x394351,0xe7b367),x:-5,z:4,hp:100,mana:100,shield:0,shieldTime:0,shieldHeat:false,dir:new T.Vector3(1,0,-1).normalize(),cool:0};
const enemy={g:wizard(0x73899c,0xc2d6df),x:5,z:-4,hp:100,mana:100,shield:0,shieldTime:0,dir:new T.Vector3(-1,0,1).normalize(),cool:2,wind:0};
const healthHUD=new HealthHUD($('healthEffects'),{visible:a=>a===player||visibleTo(player,a),impactSettings:()=>onlineCore?null:impact.settings});
function resetHealthHUD(){healthHUD.reset();healthHUD.track(player,$('playerHp'),'내 체력');healthHUD.track(enemy,$('enemyHp'),'상대 체력');}
resetHealthHUD();
player.motion=new ForcedMotion();enemy.motion=new ForcedMotion();
const roll=new SpaceSkill(loadout.q),enemyCharge=new OpponentCharge();let enemyLoadout=chooseLoadout(),enemyProgress=createProgress(enemyLoadout),enemyTarget=null;let fallingStrikes=[];
const charge=new QueuedCharge(),pointer=new T.Vector2(),aim=new T.Vector3(4,0,-3);let moveTarget=null,running=false,paused=false,bot=true,finished=false,clock=0,wins=0,losses=0,shots=[],fields=[],fx=[],waves=[],wards=[],history=[],toastTimer=0;
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
const collides=arenaCollision;
function wallBlocks(from,to){return wards.some(w=>w.hp>0&&w.life>0&&crossesWard(from,to,w,.5)&&distanceToWard(to,w)<=distanceToWard(from,w)+.001);}
function move(a,dx,dz){if(!collides(a.x+dx,a.z)&&!wallBlocks(a,{x:a.x+dx,z:a.z}))a.x+=dx;if(!collides(a.x,a.z+dz)&&!wallBlocks(a,{x:a.x,z:a.z+dz}))a.z+=dz}
const hitScreen=new HitScreen(),hitOverlay=document.createElement('div');hitOverlay.id='hitScreen';hitOverlay.setAttribute('aria-hidden','true');hitOverlay.style.cssText='position:fixed;inset:0;pointer-events:none;z-index:80;opacity:0;background:radial-gradient(ellipse at center,transparent 42%,rgba(164,0,8,.35) 70%,rgba(255,24,36,.88) 100%);box-shadow:inset 0 0 65px 12px rgba(255,25,40,.6)';document.body.append(hitOverlay);const reducedShake=matchMedia('(prefers-reduced-motion: reduce)').matches;
const castOverlay=document.createElement('div');castOverlay.id='castFlash';castOverlay.setAttribute('aria-hidden','true');castOverlay.style.cssText='position:fixed;inset:0;pointer-events:none;z-index:79;opacity:0;background:radial-gradient(ellipse at center,#fff 0%,#fff 25%,var(--cast-color,#fff) 100%)';document.body.append(castOverlay);
function hit(a,damage,dir,force=0,source=null){if(finished||a.dead||(a===player&&roll.invulnerable))return false;if(a===player){const guarded=roll.guard(damage,force,dir,source,a);if(guarded.blocked)return false;damage=guarded.damage;force=guarded.force;}if(a.monster&&(source===player||source===enemy)){a.aggro=true;a.aggroTarget=source;}if(source?.castContacts)source.castContacts.push(new T.Vector3(a.x,a.monster ? .65 : 1,a.z));if(a===enemy&&source===player)enemy.retaliate=6;let block=Math.min(a.shield,damage);a.shield-=block;damage=roundDamage(damage-block);if(block){pixelVfx.play('parry',a.x,a.z,{width:1.8,y:1});ring(a.x,a.z,0xafdfff,.8,.2);if(a.shieldHeat){const other=a===player?enemy:player;if(Math.hypot(other.x-a.x,other.z-a.z)<3)other.hp=Math.max(0,other.hp-roundDamage(block*.32))}}a.hp=Math.max(0,a.hp-damage);healthHUD.observe(a);if(damage||block)gameAudio.hit(a,player,block>0&&!damage,impact.settings.volume/35);if(force&&!(a.frozen>0))a.motion.start(dir.x,dir.z,force);impact.hit(a,dir,damage);if(a===player){hitScreen.hit(damage);charge.disrupt(chargeSetback(damage));}else if(a===enemy)enemyCharge.disrupt(chargeSetback(damage));if(a===player&&damage)flash('피격 −'+Math.round(damage)+(charge.active?' · 충전 방해':''));if(a.hp<=0){if(a.monster)killMonster(a,source);else endRound(a===enemy)};return true}
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
 if(wall){wall.hp=Math.max(0,wall.hp-roundDamage(s.spec.damage));spark(from.x,from.z,0xb9eaff,8);done=true;blocked=true;break;}
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
function applyPayload(a,payload,source=null){if(!payload||finished||a.dead)return;applyBurnVisual(a,payload);if(payload.slow)a.slow=Math.max(a.slow||0,payload.slow);if(payload.burn){if(!(a.burn>0))a.burnTick=.5;a.burn=Math.max(a.burn||0,payload.burn);a.burnOwner=source;a.burnDamage=payload.burnDamage||2;}if(payload.echo&&!a.echo)a.echo={time:.25,damage:payload.echo,owner:source};}
function updateStatuses(dt){for(const a of[player,enemy,...monsters.filter(m=>!m.dead)]){a.frostSlow=Math.max(0,(a.frostSlow||0)-dt);a.slow=Math.max(0,(a.slow||0)-dt);if(a.burn>0){a.burn-=dt;a.burnTick=(a.burnTick||0)-dt;if(a.burnTick<=0){a.burnTick=.5;hit(a,a.burnDamage||2,new T.Vector3(),0,a.burnOwner);spark(a.x,a.z,0xff9c45,3)}}if(a.echo){a.echo.time-=dt;if(a.echo.time<=0){const {damage,owner}=a.echo;a.echo=null;hit(a,damage,new T.Vector3(),0,owner);ring(a.x,a.z,0xf3d56b,.75,.25)}}}}
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
function clearPath(a,b){if(wards.some(w=>w.hp>0&&w.life>0&&crossesWard(a,b,w,.05)))return false;const d=new T.Vector3(b.x-a.x,0,b.z-a.z),length=d.length();d.normalize();for(let t=.2;t<length;t+=.2)if(collides(a.x+d.x*t,a.z+d.z*t,.02))return false;return true;}
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
 for(let i=wards.length-1;i>=0;i--){const w=wards[i];advanceMovingWard(w,dt,{actors:[player,enemy,...monsters.filter(m=>!m.dead)],collides,wards});w.m.position.set(w.x,w.baseY??1.2,w.z);w.life-=dt;w.effectCooldown-=dt;
 if(w.hp>0&&w.life>0&&w.effectCooldown<=0){w.effectCooldown=.8;for(const victim of targets(w.owner).filter(v=>wardTouches(v,w))){const payload=w.spec;
 const side=(victim.x-w.x)*w.nx+(victim.z-w.z)*w.nz>=0?1:-1,away=new T.Vector3(w.nx*side,0,w.nz*side);
 if(payload.burn||payload.slow||payload.shock||payload.push||payload.pull){if(hit(victim,payload.shock,away,0,w.owner)){applyPayload(victim,payload,w.owner);if(payload.push)victim.motion.start(away.x,away.z,payload.push);else if(payload.pull)victim.motion.start(away.x,away.z,-payload.pull);}if(payload.shock)boltEffect(victim.x,victim.z,elementalSpec('l'));else ring(victim.x,victim.z,payload.burn?0xff9c45:payload.slow?0x72dce8:0xb4e676,.7,.3);}}
 }if(w.life<=0||w.hp<=0){spellVfx.shatter(w.x,w.z,w.width);remove(w.m);wards.splice(i,1);}}
}
const liveMagic=new LiveMagic({scene,vfx:spellVfx,remove,targets,hit,applyPayload,clearPath,collides,wallBlocks,interrupt(a){if(a===player){charge.clear();roll.remaining=0;roll.pendingRelease=false;moveTarget=null;}else if(a===enemy){enemyCharge.clear();enemy.wind=0;}else a.wind=0;},get wards(){return wards;}});
const burnVisuals=new BurnVisuals(scene);
function spaceSmoke(){return onlineCore?[...onlineCore.magic.fire.smokeVolumes,...onlineCore.actors.flatMap(a=>a.roll.smoke)]:[...liveMagic.fire.smokeVolumes,...roll.smoke];}
function visibleTo(a,b){return canSee(a,b,{obstacles,walls:wards,smoke:spaceSmoke()});}
function updateVisibility(){enemy.g.visible=visibleTo(player,enemy);shields.get(enemy).visible=enemy.g.visible;for(const m of monsters)m.g.visible=!m.dead&&visibleTo(player,m);}
function dispatchSpell(s,caster,dir,aimPoint){
 const direction=dir.clone(),target=aimPoint.clone(),spell={...s};
 caster.castControlLock=Math.max(caster.castControlLock||0,impact.settings.anticipation/1000);
 impact.cast(caster,direction,()=>{if(finished)return;if(spell.emission)spell.emission=new T.Vector3(caster.x,spell.emission.y,caster.z).addScaledVector(direction,.72);emitSpell(spell,caster,direction,target);});
}
function emitSpell(s,caster,dir,aimPoint){if(!s.timed&&(s.iceHand||s.tap))caster.g.userData.puppet.playBasicAttack(s.iceHand||(caster===player?icePressHand:'left'));if(s.iceHand){liveMagic.cast(s,caster,dir,aimPoint,s.emission);gameAudio.cast('i',caster,player);caster.castFlash=.25;return;}gameAudio.cast(s.sequence,caster,player);caster.recoil??=new CastRecoil();caster.recoil.clear();if(caster===player)moveTarget=null;
 if(s.sequence==='qh'&&caster===player)moveTarget=null;
 castWithPresentation({magic:liveMagic,wards,clearPath,collides,wallBlocks},s,caster,dir,aimPoint);
 if(caster===player){chargeCamera.fire(s.sequence.length);castOverlay.style.setProperty('--cast-color',RUNES[s.sequence[0]].color);}if(!s.timed){caster.g.userData.puppet.magic.release(s.sequence?.length||1);caster.g.userData.puppet.magic.elapsed=2/12;}
}

function cast(result,iceHand=null){if(loadout.q==='i'&&result.parts.length===1&&!iceHand)iceHand=icePressHand;if(!running||paused||finished||(player.knockdown>0||player.frozen>0))return;let s={...resolveSpell(result,loadout),timed:result.timed};if(s.sequence==='ii'){s.upgradedIce=true;s.iceVariant=icePressHand==='right'?'beam':'icicle';if(s.iceVariant==='beam')s.name='집중 얼음안개';iceHand=null;if(player[s.iceVariant==='beam'?'iceRightCool':'iceLeftCool']>0)return;}if(iceHand){s.iceHand=iceHand;s.cost=ICE_BASIC[iceHand].cost;s.name=ICE_BASIC[iceHand].name;}if(s.parts.some(k=>!progress.ranks[k]))return;if(spellAimHeight(s.sequence)>0){const path=castTrajectory(player,s.sequence,iceHand||icePressHand);s.emission=path.origin;s.fireDir=path.dir;}s.mastery=mastery(progress,s.parts[0]);s.power*=s.mastery;if(iceHand&&(player[iceHand==='left'?'iceLeftCool':'iceRightCool']||0)>0){flash(ICE_BASIC[iceHand].name+' 재사용 '+player[iceHand==='left'?'iceLeftCool':'iceRightCool'].toFixed(1)+'초');return;}if(player.cool>0){flash('잠깐 기다려 주세요');return}if(bot&&player.mana<s.cost){flash('마력이 부족합니다. 잠시 쉬면 회복됩니다.');return}if(bot)player.mana-=s.cost;if(s.upgradedIce)player[s.iceVariant==='beam'?'iceRightCool':'iceLeftCool']=s.iceVariant==='beam'?3.2:1.8;if(iceHand)player[iceHand==='left'?'iceLeftCool':'iceRightCool']=ICE_BASIC[iceHand].cooldown;else player.cool=player.coolMax=s.tap?.16:.38;const seq=s.sequence,base=seq.slice(0,2),p=s.power,dir=s.fireDir||player.dir.clone(),target=aim.clone();target.sub(new T.Vector3(player.x,0,player.z));if(!iceHand&&!hasIceRecipe(s.sequence)&&target.length()>6*(s.rangeScale||1))target.setLength(6*(s.rangeScale||1));target.add(new T.Vector3(player.x,0,player.z));const third=seq[2];
 dispatchSpell(s,player,dir,aim);
 history.unshift({name:s.name,seq:s.keys.toUpperCase(),tier:seq.length===1?'1륜':seq.length===2?'2륜':'2륜 복합'});history=history.slice(0,4);$('spellName').textContent=s.name;
}
function endRound(win){if(!bot){const a=win?enemy:player;a.hp=100;a.shield=0;a.burn=0;a.slow=0;a.echo=null;flash(win?'연습 상대의 체력을 회복했습니다':'연습 모드 · 체력을 회복했습니다');return}finished=true;charge.clear();enemyCharge.clear();moveTarget=null;if(win)wins++;else losses++;$('resultTitle').textContent=win?'승리':'패배';$('resultText').textContent=win?'주문을 조합해 상대 마법사를 제압했습니다.':'몬스터의 공격을 피하며 사냥하세요. 새 대결은 레벨 1부터 시작합니다.';$('result').classList.remove('hidden')}
function reset(){impact.clear();healthHUD.reset();walkDirection={x:0,z:0};gameAudio.stopAll();levelUpVfx.clear();frostVisuals.clear();burnVisuals.clear();for(const a of[player,enemy]){a.ashTime=0;a.greenFireTime=0;}hitScreen.clear();for(const a of[player,enemy])a.recoil?.clear();castingFeedback.clear();chargeCamera.clear();liveMagic.clear();resetHunt();spellVfx.clear();pixelVfx.clear();enemy.strikePoint=null;enemy.strikeLocked=false;enemyCharge.clear();enemyLoadout=chooseLoadout();enemyProgress=createProgress(enemyLoadout);enemyTarget=null;enemy.retaliate=0;fallingStrikes=[];enemy.lastSpell="";enemy.lastSpellTime=0;for(const a of[player,enemy]){a.castControlLock=0;a.iceVX=0;a.iceVZ=0;a.motion.clear();a.hitFlash=0;a.pendingCastLight=null;a.poison=0;a.wet=0;a.frostSlow=0;a.slow=0;a.burn=0;a.echo=null;a.burnTick=0;a.shieldHeat=false;}roll.reset();roll.kind=loadout.q;player.roll=roll;player.velocity=new T.Vector3();enemy.dodge=0;enemy.dodgeCool=0;enemy.defendCool=0;enemy.attackCount=0;enemy.sidestep=1;for(const s of shots)remove(s.m);for(const f of fields)remove(f.m);for(const f of fx)remove(f.m);for(const w of [...waves,...wards])remove(w.m);waves=[];wards=[];shots=[];fields=[];fx=[];Object.assign(player,{iceLeftCool:0,iceRightCool:0,iceCastLock:0,x:-5,z:4,hp:100,mana:100,shield:0,shieldTime:0,cool:0});Object.assign(enemy,{x:16,z:-14,hp:100,mana:100,shield:0,shieldTime:0,cool:2,wind:0});charge.clear();moveTarget=null;finished=false;paused=false;clock=0;history=[];$('result').classList.add('hidden');$('paused').classList.add('hidden');toolbarIcon($('pause'),'pause','일시정지');$('spellName').textContent=RUNES[loadout.q].name;resetHealthHUD();}
function pause(value=!paused){controls.reset();if(onlineCore){pvp?.input({action:"stop"});return;}if(!running||finished)return;paused=value;charge.clear();moveTarget=null;$('paused').classList.toggle('hidden',!paused);toolbarIcon($('pause'),paused?'play':'pause',paused?'계속하기':'일시정지')}
let hasCursor=false;
function aimingSequence(){const parts=charge.parts.length?charge.parts:['q'],count=charge.active?Math.max(1,Math.min(parts.length,Math.floor((charge.elapsed+1e-8)/1.2))):1;return mapSequence(parts.slice(0,count),loadout);}
function playerCastLocked(){return onlineCore?castControlsLocked(onlineCore.actors[pvp.index]):player.impactPending||castControlsLocked(player,charge)||player.g.userData.puppet?.magic.mode==='release';}
const castPointer=new T.Vector2();
function refreshAim(sequence=aimingSequence(),height=spellAimHeight(sequence),dt=0){if(player.frozen>0)return;
 if(!hasCursor||playerCastLocked())return aim;const pos=cursorAim(pointer,camera,height);if(!pos)return aim;aim.copy(pos);if(!onlineCore)followCastAim(player,pos,dt,charge);return aim;
}
function point(e){const rect=canvas.getBoundingClientRect();pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);hasCursor=true;return refreshAim();}
canvas.addEventListener('pointermove',e=>point(e));
canvas.addEventListener('wheel',e=>{
 if(e.ctrlKey||!$('selection').classList.contains('hidden')||!$('intro').classList.contains('hidden'))return;
 e.preventDefault();
 if(mapOverview)overviewSpan=wheelZoomSpan(overviewSpan,e,innerHeight,{min:64,max:180});
 else combatSpan=wheelZoomSpan(combatSpan,e,innerHeight);
 updateCamera();point(e);
},{passive:false});
window.addEventListener('keydown',e=>{
 if(e.target.closest?.('input,textarea,select,[contenteditable=true]'))return;
 if(!$('selection').classList.contains('hidden')||!$('intro').classList.contains('hidden'))return;
 if(e.code==='KeyP'&&!e.repeat){pause();return;}
 if(e.code==='Escape'){controls.reset();return;}
 if(e.code!=='Space'||e.repeat)return;e.preventDefault();
 const spaceAim=hasCursor?cursorAim(pointer,camera,0)||aim:aim;if(onlineCore){pvp.input({action:'roll',point:{x:spaceAim.x,z:spaceAim.z}});return;}
 if(!running||paused||finished||charge.active||playerCastLocked()||(player.knockdown>0||player.frozen>0)||player.rooted>0||player.recoil?.active||player.motion.active)return;
  const d=spaceAim.clone().sub(new T.Vector3(player.x,0,player.z));if(d.length()<.1)d.copy(player.dir);
 if(!(player.iceCastLock>0)&&roll.start(d.x,d.z,player,loadout.q,spaceAim)){player.motion.clear();moveTarget=null;marker.visible=false;ring(player.x,player.z,0xe6d5a2,.9,.3);}else flash(roll.spec.name+' 재사용 '+roll.cooldown.toFixed(1)+'초');
});
function sendWalk(){if(!onlineCore||!pvp?.playing)return;const a=onlineCore.actors[pvp.index];pvp.input({action:'move',point:{x:a.x+walkDirection.x*.3,z:a.z+walkDirection.z*.3}});pvp.input({action:'aim',point:{x:aim.x,z:aim.z}});}
const deniedAttacks={left:0,right:0};let repeatingIce=false;
function repeatIceCharge(){if(charge.pending||loadout.q!=='i'||(!onlineCore&&!charge.active))return;if(!onlineCore&&progress.ranks.q<2){flash('빙결 숙련 2부터 같은 속성을 두 번 충전할 수 있습니다.');return;}repeatingIce=true;if(onlineCore)pvp.input({action:'repeat'});else charge.retarget(['q','q']);}
const controls=bindDuelControls(canvas,window,{
 enabled:()=>running&&!paused&&!finished&&!((player.knockdown>0||player.frozen>0))&&$('selection').classList.contains('hidden')&&$('intro').classList.contains('hidden'),
 walk:d=>{walkDirection=d;sendWalk();},
 begin:(buttons,e,extending)=>{const pressedHand=e.button===2?'right':'left',actor=onlineCore?onlineCore.actors[pvp.index]:player;if((onlineCore?actor.roll.blocking:roll.blocking)||charge.pending||(!extending&&(charge.active||playerCastLocked()))||!attackCooldown(actor,pressedHand,loadout.q==='i').ready){deniedAttacks[pressedHand]=performance.now()+450;return false;}point(e);const recipe=mouseRecipe(buttons,progress.ranks,onlineCore?null:loadout);
  if(extending){if(repeatingIce)return;if(onlineCore)pvp.input({action:'extend',keys:recipe});else if(charge.queue.join('')==='qq'&&loadout.q==='i')charge.retarget(recipe);else charge.extend(recipe);return;}
  repeatingIce=false;icePressHand=buttons===2?'right':'left';
  if(onlineCore){pvp.input({action:'cancel'});for(const key of recipe)pvp.input({action:'queue',key});pvp.input({action:'begin',hand:icePressHand,point:{x:aim.x,z:aim.z}});if(e.shiftKey&&loadout.q==='i'){repeatingIce=true;pvp.input({action:'repeat'});}return;}
  charge.clear();for(const key of recipe)charge.enqueue(key);charge.begin();if(e.shiftKey)repeatIceCharge();castPointer.copy(pointer);
 },
 repeat:repeatIceCharge,
 release:e=>{point(e);castPointer.copy(pointer);if(onlineCore){pvp.input({action:'release',point:{x:aim.x,z:aim.z}});return;}if(roll.blocking){roll.pendingRelease=true;return;}const result=charge.requestRelease();if(result)cast(result);},
 cancel:()=>{if(onlineCore)pvp.input({action:'cancel'});else charge.clear();}
});
$('start').onclick=()=>{$('intro').classList.add('hidden');pause(false)};$('pause').onclick=()=>pause();$('reset').onclick=()=>{if(!running)return;reset();running=true;$('intro').classList.add('hidden')};$('again').onclick=()=>{reset();running=true};
function ai(dt){
 if(!bot||(enemy.knockdown>0||enemy.frozen>0))return;enemy.retaliate=Math.max(0,(enemy.retaliate||0)-dt);enemy.cool=Math.max(0,enemy.cool-dt);enemy.mana=Math.min(100,enemy.mana+dt*(enemyCharge.active?3:10));enemy.lastSpellTime=Math.max(0,(enemy.lastSpellTime||0)-dt);
 if(!enemyCharge.active){const pd=Math.hypot(player.x-enemy.x,player.z-enemy.z);const prey=monsters.filter(m=>!m.dead&&visibleTo(enemy,m)).sort((a,b)=>Math.hypot(a.x-enemy.x,a.z-enemy.z)-Math.hypot(b.x-enemy.x,b.z-enemy.z));enemyTarget=(pd<3.5||enemy.retaliate>0&&pd<12)&&visibleTo(enemy,player)?player:prey[0]||(visibleTo(enemy,player)?player:null);}
 if(!enemyTarget||enemyTarget.dead||!visibleTo(enemy,enemyTarget)){enemyCharge.clear();enemyTarget=null;if(!enemy.patrol||Math.hypot(enemy.patrol.x-enemy.x,enemy.patrol.z-enemy.z)<1||collides(enemy.patrol.x,enemy.patrol.z))enemy.patrol={...ENCOUNTERS[Math.floor(rand()*ENCOUNTERS.length)]};const d=new T.Vector3(enemy.patrol.x-enemy.x,0,enemy.patrol.z-enemy.z).normalize();if(!castControlsLocked(enemy,enemyCharge)&&!(enemy.rooted>0)&&!enemy.motion.active&&!enemy.recoil?.active)move(enemy,d.x*dt*2.5,d.z*dt*2.5);return;}
 const target=enemyTarget,delta=new T.Vector3(target.x-enemy.x,0,target.z-enemy.z),dist=delta.length();delta.normalize();
 followCastAim(enemy,target,dt,enemyCharge.charge);
 if(!enemyCharge.active&&enemy.cool<=0&&dist<7&&enemy.mana>=25){enemyCharge.start(chooseLearnedPlan(enemyLoadout,enemyProgress,enemy.attackCount||0,enemy.hp,dist));enemy.attackCount=(enemy.attackCount||0)+1;}
 const seq=enemyCharge.active?mapSequence(enemyCharge.plan,enemyLoadout):enemyLoadout[KEYS.find(k=>enemyProgress.ranks[k]>0&&enemyLoadout[k]!=='e')];
 const reach=spellReach(seq);
 let v=delta.clone();if(dist<1.3)v.set(0,0,0);if(dist<.8)v.copy(delta).multiplyScalar(-1);
 const speed=((castControlsLocked(enemy,enemyCharge)||enemy.rooted>0||enemy.motion.active||enemy.recoil?.active)?0:enemyCharge.active&&enemyCharge.remaining<=.35?0:4.4*chargeMoveScale(enemyCharge.active,enemyCharge.charge.parts.length))*(enemy.frostSlow>0?.35:enemy.slow>0?.55:1),ox=enemy.x,oz=enemy.z;
 move(enemy,v.x*speed*dt,v.z*speed*dt);
 if(v.lengthSq()>0&&Math.hypot(enemy.x-ox,enemy.z-oz)<dt*.2){const side=new T.Vector3(-delta.z,0,delta.x).multiplyScalar(enemy.sidestep||1);if(collides(enemy.x+side.x*.5,enemy.z+side.z*.5)||wallBlocks(enemy,{x:enemy.x+side.x*.5,z:enemy.z+side.z*.5}))enemy.sidestep=-(enemy.sidestep||1);move(enemy,side.x*speed*dt,side.z*speed*dt);}
 if(enemyCharge.active){const spell=enemyCharge.tick(dt,enemyLoadout);if(spell){if(enemy.mana>=spell.cost){enemy.mana-=spell.cost;spell.mastery=mastery(enemyProgress,spell.parts[0]);spell.power*=spell.mastery;dispatchSpell(spell,enemy,enemy.dir.clone(),new T.Vector3(target.x,0,target.z));enemy.lastSpell=spell.name;enemy.lastSpellTime=.8;}enemy.cool=.65+rand()*.4;}}
}
function update(dt){impact.flush();clock+=dt;updateHunt(dt);
 for(const a of[player,enemy,...monsters.filter(m=>!m.dead)]){if(a.frozen>0)a.motion.clear();if(a.motion.active){const step=a.motion.tick(dt),count=Math.max(1,Math.ceil(Math.hypot(step.x,step.z)/.08));for(let i=0;i<count;i++){const dx=step.x/count,dz=step.z/count;if(collides(a.x+dx,a.z+dz)||wallBlocks(a,{x:a.x+dx,z:a.z+dz})){a.motion.clear();break;}a.x+=dx;a.z+=dz;}}}
const spaceStep=roll.tick(dt,player,{targets:()=>[enemy,...monsters.filter(m=>!m.dead)],clearPath:(a,b)=>clearPath(a,b),hit:(a,d,v,f,o)=>hit(a,d,new T.Vector3(v.x,0,v.z),f,o)});charge.tick(spaceStep.chargeDt);const queuedBasic=charge.takeRelease();if(queuedBasic)cast(queuedBasic);const chargeSpeed=chargeMoveScale(charge.active,charge.parts.length);const rolling=spaceStep.chargeDt<dt;const beforeX=player.x,beforeZ=player.z;if(rolling){for(let i=0;i<8;i++)move(player,spaceStep.x/8,spaceStep.z/8);}if(!roll.blocking&&roll.pendingRelease){roll.pendingRelease=false;const result=charge.requestRelease();if(result)cast(result);}
player.castControlLock=Math.max(0,(player.castControlLock||0)-dt);enemy.castControlLock=Math.max(0,(enemy.castControlLock||0)-dt);player.cool=Math.max(0,player.cool-dt);player.iceCastLock=Math.max(0,(player.iceCastLock||0)-dt);player.iceLeftCool=Math.max(0,(player.iceLeftCool||0)-dt);player.iceRightCool=Math.max(0,(player.iceRightCool||0)-dt);player.mana=bot?Math.min(100,player.mana+dt*(charge.active?3:10)):100;
 if(!playerCastLocked()&&!((player.knockdown>0||player.frozen>0))&&!(player.rooted>0)&&!(player.iceCastLock>0)&&!rolling&&!player.motion.active&&!player.recoil?.active&&chargeSpeed>0){const speed=4.4*moveSpeedScale*roll.moveScale*chargeSpeed*(player.frostSlow>0?.35:player.slow>0?.55:1);move(player,walkDirection.x*dt*speed,walkDirection.z*dt*speed);}

 player.velocity=new T.Vector3((player.x-beforeX)/dt,0,(player.z-beforeZ)/dt);
 const facing=aim.clone().sub(new T.Vector3(player.x,0,player.z));if(facing.length()>.1)player.dir.copy(facing.normalize());
 interceptSpaceShots([player],liveMagic,dt,remove);liveMagic.update(dt);for(const a of[player,enemy])if(a.recoil?.active){const step=a.recoil.tick(dt);if(castControlsLocked(a,a===player?charge:enemyCharge))continue;const count=Math.max(1,Math.ceil(Math.hypot(step.x,step.z)/.06));for(let j=0;j<count;j++){const next={x:a.x+step.x/count,z:a.z+step.z/count};if(collides(next.x,next.z)||wallBlocks(a,next)){break;}a.x=next.x;a.z=next.z;}}for(const a of[player,enemy,...monsters.filter(m=>!m.dead)]){a.wet=Math.max(0,(a.wet||0)-dt);if(a.poison>0){a.poison-=dt;a.poisonTick-=dt;if(a.poisonTick<=0){a.poisonTick=.5;hit(a,a.poisonDamage||2,new T.Vector3(),0,a.poisonOwner);}}}updateStatuses(dt);if(finished)return;
 updateForces(dt);updateFalling(dt);if(finished)return;iceMovement(enemy,dt,roll.zones,move,()=>ai(dt),!bot||enemy.frozen>0||enemy.knockdown>0||enemy.rooted>0||enemy.motion.active||enemy.recoil?.active||castControlsLocked(enemy,enemyCharge));
 for(const a of[player,enemy]){a.shieldTime=Math.max(0,a.shieldTime-dt);if(a.shieldTime<=0)a.shield=0}
 updateOrbs(dt);
 for(let i=fields.length-1;i>=0;i--){const f=fields[i];if(f.ground){const alive=advanceGround(f,dt,()=>tickGround(f));f.m.material.opacity=.14+.05*(1+Math.sin(clock*4));if(!alive){remove(f.m);fields.splice(i,1);}continue;}f.life-=dt;f.tick-=dt;f.m.material.opacity=.12+Math.sin(clock*5)*.04;if(f.tick<=0){f.tick=.5;area(f.owner,f.x,f.z,f.r,f.damage*.5,f.color,f.force,null,f.payload)}if(f.life<=0){remove(f.m);fields.splice(i,1)}}
 if(toastTimer>0){toastTimer-=dt;if(toastTimer<=0)$('toast').classList.remove('show')}
}
function updateNameplate(prefix,state,runes){
 const level=onlineCore?1:state.level,ratio=onlineCore?0:level>=MAX_LEVEL?1:Math.min(1,Math.max(0,state.xp/requiredXP(level)));
 $(prefix+'Level').textContent='Lv. '+level;
 $(prefix+'Name').textContent=characterFor(runes).name;
 $(prefix+'Xp').style.width=(ratio*100)+'%';
 const track=$(prefix+'XpTrack');track.setAttribute('aria-valuenow',String(Math.round(ratio*100)));track.setAttribute('aria-valuetext',onlineCore?'대전에서는 경험치를 얻지 않습니다':level>=MAX_LEVEL?'최대 레벨':state.xp+' / '+requiredXP(level)+' XP');
}
function label(el,a){const pos=new T.Vector3(a.x,2.65,a.z).project(camera);el.style.display=Math.abs(pos.x)>1||Math.abs(pos.y)>1?'none':'';el.style.left=((pos.x+1)*innerWidth/2)+'px';el.style.top=((-pos.y+1)*innerHeight/2)+'px'}
function castTrajectory(caster,seq,hand='left'){
 let origin;
 if(onlineCore||caster!==player)origin=new T.Vector3(caster.x,spellAimHeight(seq)||1,caster.z).addScaledVector(caster.dir,.5);
 else {const shown=castingFeedback.actors.get(caster),joint=caster.g.userData.puppet?.lastPositions?.[seq==='i'&&hand==='left'?'LeftHand':'RightHand'];origin=shown?.group.visible?shown.group.position.clone():(seq==='i'&&hand==='right'&&caster.g.userData.puppet?.lastPositions?.LeftHand?joint?.clone().add(caster.g.userData.puppet.lastPositions.LeftHand).multiplyScalar(.5):joint?.clone())?.addScaledVector(caster.dir,RUNE_FORWARD);origin??=new T.Vector3(caster.x,spellAimHeight(seq)||1,caster.z).addScaledVector(caster.dir,.5);}
 if(!clearPath(caster,origin))origin.set(caster.x,spellAimHeight(seq)||1,caster.z);
 let dir=caster.dir.clone();
 if(caster===player&&!onlineCore&&hasCursor){const target=cursorAim(charge.active&&!charge.pending?pointer:castPointer,camera,origin.y);if(target){dir=target.sub(origin);dir.y=0;if(dir.lengthSq()>.0001)dir.normalize();else dir.copy(caster.dir);}}
 return {origin,dir};
}
function drawProjectileTell(caster,seq,border){
 const hand=caster===player?icePressHand:onlineCore?.actors[1-pvp.index]?.iceHand||'left',spec=projectileGuideSpec(seq,hand);if(!spec)return false;
 if(seq.length===1){const c=caster===player?charge:enemyCharge.charge;if(c.elapsed>=1.2)spec.range*=1.25;}const path=castTrajectory(caster,seq,hand),points=projectileGuidePoints(path.origin,path.dir,spec,(p,width)=>collides(p.x,p.z,width)||wallBlocks(path.origin,p));
 border.position.y=0;border.geometry.dispose();border.geometry=new T.BufferGeometry().setFromPoints(points);border.material.color.set(RUNES[seq[0]].color);border.visible=true;return true;
}
function drawFireTell(caster,seq,border){const s=fireSpec(seq),target=caster===player?aim:(enemyTarget||player),dir=caster.dir,points=[];let p={x:caster.x,z:caster.z},r=s.lightning&&s.op==='q'?s.fieldRadius:s.lightning&&s.op==='g'?3:s.radius;
if(s.steam)p=steamPlacement(s,caster,dir,target);if(s.lightning)p=redLightningPlacement(s,caster,dir,target);
if(!s.steam&&!s.lightning&&s.op==='i')p={x:caster.x+dir.x*3,z:caster.z+dir.z*3};if(!s.steam&&!s.lightning&&['l','t','g'].includes(s.op)){const d=new T.Vector3(target.x-p.x,0,target.z-p.z);if(d.length()>s.range)d.setLength(s.range);p={x:p.x+d.x,z:p.z+d.z};}
if(['w','h'].includes(s.op)){const side=new T.Vector3(-dir.z,0,dir.x).multiplyScalar(s.op==='s'?1.4:s.op==='h'?.6*s.scale:s.orbRadius),a=new T.Vector3(p.x,0,p.z),b=a.clone().addScaledVector(dir,s.op==='h'?s.dashDistance:s.range);points.push(a.clone().add(side),b.clone().add(side),b.clone().sub(side),a.clone().sub(side),a.clone().add(side));}
else if(s.steam||s.lightning?s.op==='s':['q','d','p','s'].includes(s.op)){points.push(new T.Vector3(p.x,0,p.z));for(let i=0;i<=40;i++){const a=Math.atan2(dir.z,dir.x)-Math.PI/3+i/40*Math.PI*2/3;points.push(new T.Vector3(p.x+Math.cos(a)*r,0,p.z+Math.sin(a)*r));}points.push(new T.Vector3(p.x,0,p.z));}
else if(s.lightning&&s.op==='l'){for(let j=-1;j<=1;j++)for(let i=0;i<=48;i++){const a=i/48*Math.PI*2;points.push(new T.Vector3(p.x+j*1.65*dir.z+Math.cos(a)*r,0,p.z-j*1.65*dir.x+Math.sin(a)*r));}}
else for(let i=0;i<=48;i++){const a=i/48*Math.PI*2;points.push(new T.Vector3(p.x+Math.cos(a)*r,0,p.z+Math.sin(a)*r));}
border.geometry.dispose();border.geometry=new T.BufferGeometry().setFromPoints(points);border.material.color.set(s.steam?0xb8cbd0:s.op==='i'?0xaaaaaa:s.op==='p'?0x9cba39:0xff5436);border.visible=true;}
function drawIceTell(caster,seq,border){
 const s=iceSpec(seq),beam=seq==='ii'&&caster===player&&icePressHand==='right';if(beam){s.range=5.5;s.radius=.45;}const dir=caster.dir,reference=caster===player?aim:(enemyTarget||player),origin=new T.Vector3(caster.x,0,caster.z),delta=new T.Vector3(reference.x-caster.x,0,reference.z-caster.z),points=[];
 if(delta.length()>s.range)delta.setLength(s.range);
 let p=origin.clone();if(['l','e','t','g'].includes(s.op))p.add(delta);if(s.op==='d')p.addScaledVector(dir,2);
 if(['i','w','h','e','d'].includes(s.op)){
  const wall=['e','d'].includes(s.op),width=wall?(s.op==='e'?1.8:1.2):s.op==='i'?(beam?.45:.16):s.op==='w'?.43:.5;
  const side=new T.Vector3(-dir.z,0,dir.x).multiplyScalar(width),end=wall?p.clone().addScaledVector(dir,.225):p.clone().addScaledVector(dir,s.range);
  if(wall)p.addScaledVector(dir,-.225);
  points.push(p.clone().add(side),end.clone().add(side),end.clone().sub(side),p.clone().sub(side),p.clone().add(side));
 }else {const cone=['q','p','s'].includes(s.op),a=Math.atan2(dir.z,dir.x),arc=cone?1.05:Math.PI;if(cone)points.push(p.clone());for(let i=0;i<=48;i++){const t=a-arc+i/48*arc*2;points.push(new T.Vector3(p.x+Math.cos(t)*s.radius,.01,p.z+Math.sin(t)*s.radius));}if(cone)points.push(p.clone());}
 border.geometry.dispose();border.geometry=new T.BufferGeometry().setFromPoints(points);border.material.color.set(s.op==='p'?0x8fe8ae:0x86dfff);border.visible=true;
}
function drawTell(caster,seq,fill,border){border.position.y=.15;if(drawProjectileTell(caster,seq,border))return;if(hasIceRecipe(seq)){drawIceTell(caster,seq,border);return;}if(hasFireRecipe(seq)){drawFireTell(caster,seq,border);return;}const spec=describeDesign(seq),reference=caster===player?aim:(enemyTarget||player),range=spellReach(seq);let center={x:caster.x,z:caster.z},radius=1.2+seq.length*.25;
if(['field','wall','strike','coat'].includes(spec.shape)||spec.motion==='fall'||spec.motion==='pull'){const d=new T.Vector3(reference.x-caster.x,0,reference.z-caster.z);if(d.length()>range)d.setLength(range);center={x:caster.x+d.x,z:caster.z+d.z};}
if(spec.shape==='spread')radius*=1.6;if(spec.shape==='condensed')radius*=.6;
const points=[];if(spec.motion==='forward'){const side=new T.Vector3(-caster.dir.z,0,caster.dir.x).multiplyScalar(.55),start=new T.Vector3(caster.x,0,caster.z),end=start.clone().addScaledVector(caster.dir,range);points.push(start.clone().add(side),end.clone().add(side),end.clone().sub(side),start.clone().sub(side),start.clone().add(side));}else if(spec.shape==='wall'){const side=new T.Vector3(-caster.dir.z,0,caster.dir.x).multiplyScalar(1.6),normal=caster.dir.clone().multiplyScalar(.15),p=new T.Vector3(center.x,0,center.z);points.push(p.clone().add(side).add(normal),p.clone().sub(side).add(normal),p.clone().sub(side).sub(normal),p.clone().add(side).sub(normal),p.clone().add(side).add(normal));}else if(['q','i','w','g'].includes(seq[0])&&spec.motion==='still'&&['spread','condensed'].includes(spec.shape)){points.push(new T.Vector3(center.x,0,center.z));for(let i=0;i<=32;i++){const angle=Math.atan2(caster.dir.z,caster.dir.x)-1.1+i/32*2.2;points.push(new T.Vector3(center.x+Math.cos(angle)*radius,0,center.z+Math.sin(angle)*radius));}points.push(new T.Vector3(center.x,0,center.z));}else for(let i=0;i<=48;i++){const angle=i/48*Math.PI*2;points.push(new T.Vector3(center.x+Math.cos(angle)*radius,0,center.z+Math.sin(angle)*radius));}
border.geometry.dispose();border.geometry=new T.BufferGeometry().setFromPoints(points);border.material.color.set(RUNES[seq[0]].color);border.visible=true;}
function renderAttackTell(){attackTell.visible=tellBorder.visible=playerTell.visible=playerBorder.visible=wardGhost.visible=false;if(bot&&running&&!finished&&enemy.g.visible&&enemyCharge.active)drawTell(enemy,mapSequence(enemyCharge.plan,enemyLoadout),attackTell,tellBorder);if(running&&!finished&&charge.active)drawTell(player,mapSequence(charge.parts,loadout),playerTell,playerBorder);}

const iceAttackIcons={left:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="m10 4 10 8-10 8-4-8Z M6 12h14 M10 4v16 M2 8h3 M1 16h3"/></svg>',right:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M3 7h11c5 0 5-5 1-5 M5 12h13c5 0 5 5 1 5 M2 17h9 M6 21h9"/></svg>'};
function ui(dt=0){const movement=readMovement(characterFor(loadout).id);moveSpeedScale=movement.moveSpeed;if(onlineCore)syncOnlineActors();for(const hand of ['left','right']){const state=attackCooldown(player,hand,loadout.q==='i'),node=$(hand+'AttackCool');const rune=RUNES[loadout.q],skillName=loadout.q==='i'?ICE_BASIC[hand].name:rune.name,icon=loadout.q==='i'?iceAttackIcons[hand]:rune.icon;if(node.dataset.icon!==icon){node.querySelector('b').innerHTML=icon;node.dataset.icon=icon;}node.style.setProperty('--cool-color',rune.color);node.title=(hand==='left'?'좌클릭':'우클릭')+' · '+skillName;node.style.setProperty('--fill',state.progress*360+'deg');node.classList.toggle('ready',state.ready);node.classList.toggle('denied',performance.now()<deniedAttacks[hand]);node.setAttribute('aria-valuenow',String(Math.round(state.progress*100)));node.setAttribute('aria-label',node.title+(state.ready?' 준비':' · '+state.remaining.toFixed(1)+'초 남음'));}setWizardCharacter(player.g,characterFor(loadout).id);setWizardCharacter(enemy.g,characterFor(enemyLoadout).id);updateCamera();refreshAim(aimingSequence(),undefined,dt);if(onlineCore&&hasCursor&&performance.now()-lastOnlineAim>50){lastOnlineAim=performance.now();pvp.input({action:'aim',point:{x:aim.x,z:aim.z}});}updateVisibility();renderHunt();for(const a of[player,enemy]){const burning=a.burn>0,chilled=a.slow>0,tinted=chilled||a.poison>0;const c=new T.Color(a.poison>0&&!burning?0x88c957:burning&&(!chilled||Math.floor(clock*4)%2===0)?0xff543e:0x479eff);for(const entry of a.g.userData.palette){entry.material.color.copy(entry.color);if(tinted)entry.material.color.lerp(new T.Color(a.poison>0?0x88c957:0x479eff),.35);if(a.hitFlash>0)entry.material.color.set(0xffffff);}a.g.position.set(a.x,0,a.z);a.g.rotation.y=Math.atan2(a.dir.x,a.dir.z);const shield=shields.get(a);shield.position.set(a.x,1,a.z);if(a.shield>0&&!shield.userData.active)pixelVfx.play('shield-bubble',a.x,a.z,{width:1.8,duration:a.shieldTime,loop:true,follow:()=>a.shield>0?{x:a.x,z:a.z,y:.12}:null});shield.userData.active=a.shield>0;shield.rotation.y=clock*.6}label($('playerLabel'),player);label($('enemyLabel'),enemy);if(!enemy.g.visible)$('enemyLabel').style.display='none';$('manaBar').style.width=player.mana+'%';$('manaText').textContent=Math.floor(player.mana);$('enemyCast').textContent=onlineCore?(enemyCharge.active?'친구 · 충전 중':'친구'):!bot?'연습 상대':enemyCharge.active?spellName(mapSequence(enemyCharge.charge.parts,enemyLoadout),NAMES)+' · 충전':enemy.lastSpellTime>0?enemy.lastSpell+' · 발사':enemy.slow>0?'감속 중':enemy.burn>0?'화상 중':(enemyTarget?.monster?'몬스터 사냥 중':'상대 마법사');updateNameplate('player',progress,loadout);updateNameplate('enemy',enemyProgress,enemyLoadout);
 const ec=enemyCharge.charge,enemyCharging=bot&&running&&!finished&&enemy.g.visible&&ec.active&&ec.elapsed>=.22;
 $('enemyOrbs').innerHTML=enemyCharging?ec.parts.map((key,i)=>{const rune=RUNES[enemyLoadout[key]];return `<div class="orb" title="${rune.name}" style="--c:${rune.color};--p:${i<ec.parts.length-1?100:ec.progress*100}%"><span>${rune.icon}</span></div>`}).join(''):'';
 $('enemyOrbs').classList.toggle('charging',enemyCharging);
 enemyAimLine.visible=enemyCharging&&enemyLoadout[ec.parts[0]]==='e';if(enemyCharging){const seq=mapSequence(ec.parts,enemyLoadout),spec={range:spellReach(seq)},end=new T.Vector3(enemy.x,.13,enemy.z).addScaledVector(enemy.dir,spec.range);enemyAimLine.geometry.dispose();enemyAimLine.geometry=new T.BufferGeometry().setFromPoints([new T.Vector3(enemy.x,.13,enemy.z),end]);enemyAimLine.material.color.set(RUNES[seq[0]].color);}
 $('enemyLoadout').innerHTML=KEYS.map(k=>{const r=RUNES[enemyLoadout[k]];const rank=enemyProgress.ranks[k];return `<span style="color:${rank?r.color:'#75838c'}" title="${rank?'숙련 '+rank:'미습득'}">${rank?r.icon:'🔒'} ${r.name}${rank?' '+rank:''}</span>`}).join(' · ');
 for(const a of[player,enemy]){const body=a.g.userData.body;if(!body)continue;const angle=a.g.rotation.y,m=a.motion,localX=m.x*Math.cos(angle)-m.z*Math.sin(angle),localZ=m.x*Math.sin(angle)+m.z*Math.cos(angle);body.rotation.x=m.lean*localZ;body.rotation.z=-m.lean*localX;a.castFlash=Math.max(0,(a.castFlash||0)-dt);body.rotation.x-=Math.sin(a.castFlash/.3*Math.PI)*.18;const preparing=a===player?charge.active:enemyCharge.active;if(a.g.userData.arm)a.g.userData.arm.rotation.x=preparing?-.45:-Math.sin(a.castFlash/.3*Math.PI)*.6;const shownRoll=a===player?roll:onlineCore?.actors[1-pvp.index].roll;if(shownRoll?.active){const bends={q:.32,i:0,l:.22,d:.12,p:-.18,e:.06,t:.15,g:-.24,s:.12,h:.48};body.rotation.x=bends[shownRoll.kind]||0;body.rotation.z=['e','s'].includes(shownRoll.kind)?-.18:0;}}
 for(const k of['q','w','e'])$('key-'+k).classList.toggle('active',charge.queue.includes(k));
 $('orbs').parentElement.classList.toggle('charging',charge.active&&charge.elapsed>=.22);
 $('orbs').innerHTML=(charge.active&&charge.elapsed>=.22?charge.queue:[]).map((k,i)=>{const amount=charge.active?Math.max(0,Math.min(1,charge.elapsed/1.2-i)):0;return `<div class="orb" style="--c:${RUNES[loadout[k]].color};--p:${amount*100}%"><span>${RUNES[loadout[k]].icon}</span></div>`}).join('');
 if(charge.queue.length){$('spellName').textContent=(mapSequence(charge.queue,loadout)==='ii'&&icePressHand==='right'?'집중 얼음안개':spellName(mapSequence(charge.queue,loadout)));}


}
function syncLoadout(){$('playerName').textContent=characterFor(loadout).name;for(const k of KEYS){const r=RUNES[loadout[k]],node=$('key-'+k);node.style.setProperty('--key',r.color);node.querySelector('.glyph').textContent=r.icon;node.querySelector('b').textContent=r.name;node.querySelector('small').textContent=r.hint;}}
const portraitCrops={fire:[325,35,140],ice:[305,25,145],lightning:[300,20,160],earth:[285,10,160],poison:[290,5,160],barrier:[330,35,140],field:[290,5,150],pull:[300,0,150],slash:[310,15,150],impact:[320,5,140]};
function renderSelection(){
 const character=characterFor(draft);
 $('characterPicker').innerHTML=CHARACTERS.map(c=>{const [x,y,size]=portraitCrops[c.id];return `<button type="button" class="character-card" data-character="${c.id}" aria-label="${c.name} ${RUNES[c.rune].name} 캐릭터" aria-pressed="${c.id===character.id}" style="--rune:${c.color}"><span class="character-face"><img src="${c.image}" alt="" style="width:${480/size*100}%;left:${-x/size*100}%;top:${-y/size*100}%"></span><span class="character-name"><b>${c.name}</b></span></button>`;}).join('');
 $('runePicker').innerHTML=Object.entries(RUNES).map(([id,r])=>{const assigned=KEYS.find(k=>draft[k]===id);return `<button type="button" class="rune-btn" data-rune="${id}" ${id===draft.q?'data-fixed="true" disabled':''} aria-label="${r.name}${assigned?' · '+slotLabel(assigned):''}" aria-pressed="${!!assigned}" title="${id===draft.q?'전문 마법':'좌클릭: 왼쪽에 배정 · 우클릭: 오른쪽에 배정'}" style="--rune:${r.color}"><span class="rune-symbol">${r.icon}</span><strong>${r.name}</strong>${assigned?`<span class="assigned">${slotLabel(assigned)}</span>`:''}</button>`;}).join('');
}
$('characterPicker').onclick=e=>{const b=e.target.closest('[data-character]');if(!b||pvp?.locked)return;draft=chooseCharacter(draft,b.dataset.character);renderSelection();pvp?.refresh();};
function openSelection(){if(onlineCore){pvp.showRoom();return;}selectionReturn=running&&!finished;pause(true);charge.clear();draft={...loadout};$('intro').classList.add('hidden');$('result').classList.add('hidden');$('confirmSelection').textContent='시작';$('selection').classList.remove('hidden');renderSelection();}
function cancelSelection(){$('selection').classList.add('hidden');if(selectionReturn&&!onlineCore)pause(false);$('choose').focus();}
function assignSupportFromEvent(e,slot){const b=e.target.closest('[data-rune]');if(!b||b.disabled||pvp?.locked)return;draft=chooseSupport(draft,slot,b.dataset.rune);renderSelection();pvp?.refresh();$('runePicker').querySelector(`[data-rune="${b.dataset.rune}"]`)?.focus();}
 $('runePicker').onclick=e=>assignSupportFromEvent(e,'w');
 $('runePicker').oncontextmenu=e=>{e.preventDefault();assignSupportFromEvent(e,'e');};
 $('runePicker').onkeydown=e=>{if(e.shiftKey&&e.key==='Enter'){e.preventDefault();assignSupportFromEvent(e,'e');}};
 $('confirmSelection').onclick=()=>{if(!validLoadout(draft))return;bot=pvp?.mode!=='solo';loadout={...draft};try{localStorage.setItem('mage-loadout-v1',JSON.stringify(loadout))}catch{}syncLoadout();reset();if(!bot){for(const k of KEYS)progress.ranks[k]=Math.max(1,progress.ranks[k]);renderProgress();}running=true;$('selection').classList.add('hidden');const first=KEYS.find(k=>progress.ranks[k]);flash('기본 공격 · '+RUNES[loadout[first]].name+' 습득 · 몬스터를 처치해 나머지 마법을 배우세요.');};
 $('cancelSelection').onclick=cancelSelection;document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!$('selection').classList.contains('hidden')){event.preventDefault();cancelSelection();}});$('choose').onclick=openSelection;$('resultChoose').onclick=openSelection;

function spawnMonster(near=null){if(onlineCore)return;if(monsters.filter(m=>!m.dead).length>=12)return;
 let x,z,valid=false;for(let n=0;n<80;n++){x=near?near.x+(Math.random()-.5)*4:(Math.random()-.5)*112;z=near?near.z+(Math.random()-.5)*4:(Math.random()-.5)*112;
 if(!collides(x,z,.8)&&!wards.some(w=>distanceToWard({x,z},w)<1)&&Math.hypot(x-player.x,z-player.z)>2.5&&Math.hypot(x-enemy.x,z-enemy.z)>2.5&&!monsters.some(m=>!m.dead&&Math.hypot(m.x-x,m.z-z)<1.6)){valid=true;break;}}
 if(!valid)return;const type=monsterId%3,spec=MONSTERS[type],hp=spec.hp,{g,body}=createMonster(type);scene.add(g);
 monsters.push({id:++monsterId,monster:true,g,body,color:new T.Color(spec.color),x,z,homeX:x,homeZ:z,hp,maxHp:hp,xp:spec.xp,shield:0,motion:new ForcedMotion(),dir:new T.Vector3(0,0,1),cool:1,wind:0,type,dead:false});healthHUD.track(monsters.at(-1),null,spec.name+' 체력');ring(x,z,0xb7d38b,.8,.5);
}
function resetHunt(){for(const m of monsters)remove(m.g);monsters=[];progress=createProgress(loadout);if(!bot)for(const k of KEYS)progress.ranks[k]=Math.max(1,progress.ranks[k]);spawnTimer=0;renderProgress();}
function killMonster(m,source){if(m.dead)return;m.dead=true;ring(m.x,m.z,0xe9cb73,1,.5);remove(m.g);
 if(source===player||source===enemy){const state=source===player?progress:enemyProgress,levels=awardKill(state,m.xp);if(levels)levelUpVfx.play(source,state.level,levels);source.mana=Math.min(100,source.mana+10);
 if(levels){source.hp=Math.min(100,source.hp+20);ring(source.x,source.z,0xffdf83,2,.8);if(source===enemy)spendEnemyPoints(enemyProgress,enemyLoadout);else flash('레벨 '+progress.level+' · 스킬 포인트 +'+levels);}else if(source===player)flash('몬스터 처치 · 경험치 +'+m.xp);if(source===player)renderProgress();}}
function updateHunt(dt){spawnTimer-=dt;if(spawnTimer<=0){spawnTimer=5;if(!monsters.length){for(const p of[{x:-10,z:3},{x:8,z:6},...ENCOUNTERS,...ENCOUNTERS])spawnMonster(p);}spawnMonster();}
 for(const m of monsters){if(m.dead)continue;
 if(m.knockdown>0||m.frozen>0){cancelMonsterAttack(m);m.iceVX=0;m.iceVZ=0;animateMonster(m,clock);continue;}
 if(m.motion.active&&['windup','attack'].includes(m.attackPhase))cancelMonsterAttack(m);
 const nearest=bot&&Math.hypot(enemy.x-m.x,enemy.z-m.z)<Math.hypot(player.x-m.x,player.z-m.z)?enemy:player,target=m.aggroTarget&&(m.aggroTarget!==enemy||bot)?m.aggroTarget:nearest;
 iceMovement(m,dt,roll.zones,move,()=>tickMonster(m,target,dt,{move,hit,visible:visibleTo,clearPath}),m.rooted>0||m.motion.active);
 animateMonster(m,clock);
 }monsters=monsters.filter(m=>!m.dead);
}
function renderProgress(){renderSkillUpgrades(document,progress,loadout,RUNES,MAX_RANK);}
const zoomReadout=document.createElement('output');zoomReadout.id='zoomReadout';zoomReadout.setAttribute('aria-label','현재 확대율');zoomReadout.setAttribute('aria-live','off');zoomReadout.title='기본 전투 시점 100% · 마우스 휠로 조절';zoomReadout.style.cssText='position:fixed;top:76px;right:20px;z-index:20;pointer-events:none;padding:7px 11px;border:1px solid #ffffff25;border-radius:7px;background:#20302bd9;color:#f1edda;font:600 12px system-ui;font-variant-numeric:tabular-nums;white-space:nowrap';document.body.append(zoomReadout);
function updateCamera(){const zoomText='확대 '+Math.round(24/(mapOverview?overviewSpan:combatSpan*chargeView.distance)*100)+'%';if(zoomReadout.textContent!==zoomText)zoomReadout.textContent=zoomText;positionTownCamera(camera,{x:mapOverview?0:player.x,z:mapOverview?0:player.z,aspect:innerWidth/innerHeight,span:mapOverview?overviewSpan:combatSpan*chargeView.distance});const kick=onlineCore?hitScreen.shake(reducedShake):{x:0,y:0};if(!mapOverview){camera.position.x+=kick.x+chargeView.x*(reducedShake?.15:1);camera.position.y+=kick.y+chargeView.y*(reducedShake?.15:1);if(!onlineCore)impact.camera(camera,reducedShake);}castOverlay.style.opacity=String((chargeView.flash||0)*(reducedShake?.35:1));camera.updateMatrixWorld();hitOverlay.style.opacity=String(hitScreen.opacity);}
const mapButton=document.createElement('button');mapButton.textContent='전체 지도';mapButton.setAttribute('aria-pressed','false');document.querySelector('header .actions').prepend(mapButton);mapButton.onclick=()=>{mapOverview=!mapOverview;mapButton.textContent=mapOverview?'전투 시점':'전체 지도';mapButton.setAttribute('aria-pressed',String(mapOverview));updateCamera();};

function renderHunt(){
 const canvas=$('minimap'),c=canvas.getContext('2d'),scale=(canvas.width-12)/(TOWN_HALF*4),sy=scale/Math.sqrt(3),cx=canvas.width/2,cy=canvas.height/2;
 // Same ground-plane projection as the +X,+Y,+Z orthographic camera.
 const p=a=>({x:cx+(a.x-a.z)*scale,y:cy+(a.x+a.z)*sy});
 c.clearRect(0,0,canvas.width,canvas.height);
 c.save();c.setTransform(scale,sy,-scale,sy,cx,cy);
 c.fillStyle='#596167';c.fillRect(-TOWN_HALF,-TOWN_HALF,TOWN_HALF*2,TOWN_HALF*2);
 for(const d of DISTRICTS){c.fillStyle='#'+d.color.toString(16).padStart(6,'0');c.fillRect(d.x-24,d.z-24,48,48);}
 for(const o of obstacles){c.fillStyle='#39474c';c.fillRect(o.x-o.w/2,o.z-o.h/2,o.w,o.h);}
 c.restore();
 const corners=[{x:-TOWN_HALF,z:-TOWN_HALF},{x:TOWN_HALF,z:-TOWN_HALF},{x:TOWN_HALF,z:TOWN_HALF},{x:-TOWN_HALF,z:TOWN_HALF}].map(p);
 c.beginPath();corners.forEach((q,i)=>i?c.lineTo(q.x,q.y):c.moveTo(q.x,q.y));c.closePath();c.strokeStyle='#b4c3b9';c.lineWidth=1.5;c.stroke();
 for(const a of [...monsters,enemy,player]){if(a.dead||a!==player&&!visibleTo(player,a))continue;const q=p(a);c.fillStyle=a===player?'#ffe3a0':a===enemy?'#ff837b':'#a7d878';c.beginPath();c.arc(q.x,q.y,a.monster?2.5:3.5,0,Math.PI*2);c.fill();c.strokeStyle='#23332c';c.lineWidth=1;c.stroke();}
}

for(const k of KEYS){$('key-'+k).onclick=()=>{if(!running||paused||finished||onlineCore)return;if(learn(progress,k)){charge.clear();renderProgress();flash(RUNES[loadout[k]].name+(progress.ranks[k]===1?' 습득 · 마우스 조합에 추가':' 숙련도 상승')+(k==='q'&&loadout.q==='i'&&progress.ranks.q===2?' · 충전 중 Shift: 같은 속성 2륜':''));}};}
 syncLoadout();renderProgress();renderSelection();
function resize(){renderer.setSize(innerWidth,innerHeight);updateCamera()}window.addEventListener('resize',resize);resize();
const hitboxView=new HitboxView(scene);$('hitboxToggle').onclick=()=>{hitboxView.enabled=!hitboxView.enabled;toolbarIcon($('hitboxToggle'),'hitbox',hitboxView.enabled?'히트박스 끄기':'히트박스 켜기');$('hitboxToggle').setAttribute('aria-pressed',String(hitboxView.enabled));$('hitboxNote').hidden=!hitboxView.enabled;};
const levelUpVfx=new LevelUpVfx(scene,remove);const spaceVisuals=new SpaceVisuals(scene);const frostVisuals=new FrostVisuals(scene,remove);
let prev=performance.now();function frame(now){requestAnimationFrame(frame);if(onlineCore&&running&&now-lastOnlineMove>50&&(walkDirection.x||walkDirection.z)){lastOnlineMove=now;sendWalk();}const realDt=Math.min(.04,(now-prev)/1000);prev=now;const dt=onlineCore?(impact.restore(),realDt):impact.step(realDt,running&&!paused&&!finished);gameAudio.update({active:running&&!paused&&!finished,charging:charge.active&&!roll.blocking,stage:charge.parts.length||1,rolling:roll.blocking});if(!paused)hitScreen.tick(dt);if(running&&!paused&&!finished&&!onlineCore&&dt>0)update(dt);if(!paused)for(let i=fx.length-1;i>=0;i--){const f=fx[i];f.life-=dt;if(f.ring){f.m.scale.setScalar(f.r*(.55+.45*(1-f.life/f.max)));f.m.material.opacity=Math.max(0,f.life/f.max*.65)}else if(f.v){f.m.position.addScaledVector(f.v,dt);f.v.y-=dt*8}else if(f.m.material.transparent)f.m.material.opacity=Math.max(0,f.life/f.max*.5);if(f.life<=0){remove(f.m);fx.splice(i,1)}}if(!paused){spellVfx.update(dt);pixelVfx.update(dt);}const feedbackDt=paused?0:dt;castingFeedback.update(feedbackDt);chargeView=chargeCamera.update(feedbackDt,running&&!finished&&charge.active,charge.parts.length||1,charge.progress);for(const a of [player,enemy,...monsters])a.hitFlash=Math.max(0,(a.hitFlash||0)-feedbackDt);ui(feedbackDt);for(const a of [player,enemy]){
 const u=a.g.userData,active=running&&!paused&&!finished,step=active&&!(a.frozen>0)?dt:0;
 const actorCharge=onlineCore?onlineCore.actors[a===player?pvp.index:1-pvp.index].charge:a===player?charge:enemyCharge.charge;
 const charging=active&&(actorCharge.active&&!actorCharge.releasePose||!onlineCore&&a.impactPending),stage=a===player?charge.parts.length:enemyCharge.charge.parts.length;
 if(actorCharge.releasePose&&!u.releasePoseStarted){u.puppet.playBasicAttack(a===player?icePressHand:onlineCore?.actors[1-pvp.index].iceHand||'left');u.puppet.magic.release(1);u.puppet.magic.elapsed=0;}u.releasePoseStarted=actorCharge.releasePose;
 if(!charging&&u.puppet.magic.mode==='hold')u.puppet.magic.reset();
 const previous=u.animationPosition||{x:a.x,z:a.z},speed=step?Math.hypot(a.x-previous.x,a.z-previous.z)/step:0;
 const activeSpace=a===player?roll:onlineCore?.actors[1-pvp.index].roll;
 animateWizard(a.g,step,{speed:activeSpace?.blocking?0:speed,mobility:!!activeSpace?.active&&activeSpace.kind==='i',charging,chargeStage:stage||1,cast:a.castFlash||0});
 u.puppet.chargeHand=onlineCore?onlineCore.actors[a===player?pvp.index:1-pvp.index].iceHand||'left':a===player?icePressHand:'left';u.puppet.chargeUsesIce=(a===player?loadout:enemyLoadout).q==='i';
 const iceEngine=onlineCore?onlineCore.magic.ice:liveMagic.ice,iceOwner=onlineCore?onlineCore.actors[a===player?pvp.index:1-pvp.index]:a;
 u.puppet.icePose=(onlineCore?onlineCore.magic:liveMagic).pose(iceOwner);
 if(!u.puppet.icePose.length&&charging)u.puppet.icePose=[{hand:stage===1?u.puppet.chargeHand:'right',dir:a.dir.clone(),weight:1,reach:stage===1&&u.puppet.chargeUsesIce?.6:.38,height:stage===1&&u.puppet.chargeUsesIce?1.42:1}];
 const iceFacing=u.puppet.icePose[0]?.dir,displayDir=castControlsLocked(a,actorCharge)?a.dir:iceFacing||a.dir;
 if(iceFacing){a.g.rotation.y=Math.atan2(displayDir.x,displayDir.z);u.body.rotation.set(0,0,0);}
 const movementSettings=readMovement(characterFor(a===player?loadout:enemyLoadout).id);
 if(a===player||onlineCore){
  const aimYaw=Math.atan2(displayDir.x,displayDir.z),casting=charging||castControlsLocked(a,actorCharge)||u.puppet.magic.mode==='release'||!!u.puppet.basicAttack||a.castFlash>0||!!activeSpace?.active;
  u.moveFacing??=aimYaw;
  if(casting)u.moveFacing=aimYaw;
  else if(active){const direction=a===player?walkDirection:{x:a.x-previous.x,z:a.z-previous.z};if(Math.hypot(direction.x,direction.z)>1e-5)u.moveFacing=Math.atan2(direction.x,direction.z);}
  a.g.rotation.y=u.moveFacing;
  u.puppet.bodyFollow??=new BodyFollow(movementSettings);u.puppet.bodyFollow.settings=movementSettings;
  u.puppet.bodyFollow.updateLocomotion(step,{aim:aimYaw,facing:u.moveFacing,casting});
  if(casting&&!u.wasCasting)u.puppet.poseTransition=null;u.wasCasting=casting;
 }else if(movementSettings.headSpeed||movementSettings.chestSpeed||movementSettings.pelvisSpeed){u.puppet.bodyFollow??=new BodyFollow(movementSettings);const turnScale=chargeTurnScale(actorCharge);u.puppet.bodyFollow.settings={...movementSettings,headSpeed:movementSettings.headSpeed*turnScale,chestSpeed:movementSettings.chestSpeed*turnScale,pelvisSpeed:movementSettings.pelvisSpeed*turnScale};u.puppet.bodyFollow.update(step,{aim:Math.atan2(displayDir.x,displayDir.z)});}else u.puppet.bodyFollow=null;
 u.animationPosition={x:a.x,z:a.z};projectWizard(a.g,camera);iceEngine.syncHands(iceOwner,u.puppet);
 const runes=a===player?loadout:enemyLoadout,parts=a===player?charge.parts:enemyCharge.charge.parts,colors=parts.map(k=>RUNES[runes[k]]?.color||'#ffffff');
 castingFeedback.charge(a,charging,stage||1,colors,u.puppet.lastPositions,camera);
 renderCastPresentation(a,castingFeedback);

 }renderAttackTell();for(const a of [player,enemy,...monsters])a.g.rotation.z=a.knockdown>0?-1.25*Math.min(1,(.75-a.knockdown)/.12,a.knockdown/.2):0;frostVisuals.update(paused?0:dt,[player,enemy,...monsters]);burnVisuals.update(paused?0:dt,[player,enemy,...monsters]);visionShade.update(paused?0:dt,player,{obstacles,walls:wards,smoke:spaceSmoke()});spaceVisuals.update(onlineCore?onlineCore.actors:[{...player,roll}]);levelUpVfx.update(paused?0:dt,camera);hitboxView.update([player,enemy,...monsters],[...(onlineCore?onlineCore.magic:liveMagic).iceCombos.effects,...(onlineCore?onlineCore.magic:liveMagic).ice.effects,...(onlineCore?onlineCore.magic:liveMagic).effects,...(onlineCore?onlineCore.magic:liveMagic).fire.effects],camera);healthHUD.update(paused?0:dt,camera,innerWidth,innerHeight);if(!onlineCore){for(const a of [player,enemy,...monsters])impact.actor(a);impact.draw([...liveMagic.ice.effects,...liveMagic.iceCombos.effects,...liveMagic.effects,...liveMagic.fire.effects]);}renderer.render(scene,camera)}requestAnimationFrame(frame);
// Read-only diagnostics for input and rendering verification.
window.mageDebug=()=>({impact:impact.stats(),models:{player:player.g.userData.characterId,ready:!!player.g.userData.characterRig,position:player.g.position.toArray(),scale:player.g.scale.toArray(),head:player.g.userData.puppet.lastPositions?.Head?.toArray(),bones:player.g.userData.characterRig?.positions(),visible:player.g.visible},audio:gameAudio.stats(),map:{size:120,overview:mapOverview,combatSpan,overviewSpan,batches:town.userData.staticBatches},camera:{type:camera.type,left:camera.left,right:camera.right,top:camera.top,bottom:camera.bottom,position:camera.position.toArray(),quaternion:camera.quaternion.toArray(),fov:camera.fov,aspect:camera.aspect},online:onlineCore?{tick:onlineCore.tick,index:pvp.index,time:onlineCore.time,finished:onlineCore.finished,winner:onlineCore.winner}:null,loadout:{...loadout},running,paused,bot,finished,charge:{queue:[...charge.queue],active:charge.active,parts:[...charge.parts],held:[...charge.held],progress:charge.progress,elapsed:charge.elapsed},history:[...history],roll:{...roll.snapshot(),active:roll.active,invulnerable:roll.invulnerable},progress:structuredClone(progress),monsters:monsters.filter(m=>!m.dead).map(m=>({id:m.id,type:m.type,name:MONSTERS[m.type].name,scale:m.g.scale.x,phase:m.attackPhase,x:m.x,z:m.z,hp:m.hp})),player:{x:player.x,z:player.z,hp:player.hp,mana:player.mana},vision:{enemyVisible:enemy.g.visible,smoke:spaceSmoke()},enemy:{progress:structuredClone(enemyProgress),target:enemyTarget?.monster?'monster':enemyTarget?'player':null,x:enemy.x,z:enemy.z,hp:enemy.hp,mana:enemy.mana,loadout:{...enemyLoadout},charge:{parts:[...enemyCharge.charge.parts],progress:enemyCharge.charge.progress,remaining:enemyCharge.remaining},lastSpell:enemy.lastSpell},groundZones:fields.filter(f=>f.ground).map(f=>({x:f.x,z:f.z,radius:f.r,life:f.life})),projectiles:shots.map(s=>({kind:s.spec.kind,radius:s.spec.radius,speed:s.spec.speed,distance:s.distance})),walls:wards.map(w=>({x:w.x,z:w.z,moving:w.speed>0,travelled:w.travelled})),vfx:spellVfx.stats(),pixelVfx:pixelVfx.stats(),objects:scene.children.length});

// Online mode replays only server-accepted inputs; the server snapshot owns results.
let lastOnlineMove=0;
function syncOnlineActors(){
 if(!onlineCore)return;
 const own=onlineCore.actors[pvp.index],other=onlineCore.actors[1-pvp.index];
 const blend=Math.min(1,(performance.now()-onlineRenderAt)/(STEP*1000));for(const [from,to] of [[own,player],[other,enemy]]){for(const key of ['x','z','hp','mana','iceLeftCool','iceRightCool','iceCastLock','castControlLock','shield','shieldTime','slow','frostSlow','burn','poison','wet','ashTime','greenFireTime','dustTime','knockdown','rooted','slipImmune','greenFrost','frozen'])to[key]=from[key]||0;const previous=onlinePrevious?.[from.id];if(previous){to.x=previous.x+(from.x-previous.x)*blend;to.z=previous.z+(from.z-previous.z)*blend;}to.dir.copy(from.dir);Object.assign(to.motion,from.motion);}
 Object.assign(charge,own.charge);Object.assign(roll,own.roll);Object.assign(enemyCharge.charge,other.charge);enemyCharge.plan=[...other.charge.queue];enemyCharge.elapsed=other.charge.elapsed;enemyTarget=other.aim;clock=onlineCore.time;
}
function stopOnline(){
 if(onlineCore){onlineCore.dispose();onlineCore=null;wards=[];}
 running=false;bot=true;reset();running=false;paused=false;onlineResultShown=false;
 for(const id of ['pause','reset'])$(id).disabled=false;
 $('again').textContent='같은 마법으로 재대결';$('resultChoose').textContent='마법 바꾸기';$('result').classList.add('hidden');
 draft={...loadout};renderSelection();$('confirmSelection').textContent='시작';
}
pvp=mountPvpUI({
 loadout:()=>({...draft}),open:openSelection,mode:()=>{},stop:stopOnline,
 start(message,index){
  if(onlineCore){onlineCore.dispose();onlineCore=null;wards=[];}
  bot=true;loadout={...message.loadouts[index]};draft={...loadout};reset();syncLoadout();
  enemyLoadout={...message.loadouts[1-index]};progress=createProgress(loadout);enemyProgress=createProgress(enemyLoadout);for(const k of KEYS){progress.ranks[k]=1;enemyProgress.ranks[k]=1;}renderProgress();
  onlineCore=new Duel(message.loadouts,{scene,vfx:spellVfx,onCast:(spell,actor)=>{const a=actor.id===index?player:enemy;a.coolMax=spell.tap?.16:.38;if(!spell.timed&&(spell.iceHand||spell.tap))a.g.userData.puppet.playBasicAttack(spell.iceHand||actor.iceHand||'left');if(!spell.iceHand){const point=actor.aim.clone();point.y=1;a.pendingCastLight={colors:[...spell.sequence].map(k=>RUNES[k].color),tier:spell.sequence.length,origin:spell.emission?.clone(),dir:actor.dir.clone(),beamTarget:projectileGuideSpec(spell.sequence,spell.iceHand||actor.iceHand||'left')?null:()=>({point,active:false})};}gameAudio.cast(spell.sequence,a,player);a.castFlash=.3;if(!spell.timed){a.g.userData.puppet.magic.release(spell.sequence.length);a.g.userData.puppet.magic.elapsed=2/12;}if(actor.id===index){chargeCamera.fire(spell.sequence.length);castOverlay.style.setProperty('--cast-color',RUNES[spell.sequence[0]].color);$('spellName').textContent=spell.name;history.unshift({name:spell.name,seq:spell.keys.toUpperCase()});history=history.slice(0,4);}},onHit:(actor,damage)=>{const a=actor.id===index?player:enemy;if(damage>0)gameAudio.hit(a,player);a.hitFlash=.1;if(actor.id===index)hitScreen.hit(damage);}});
  onlinePrevious=null;onlineRenderAt=performance.now();onlineCore.correct(message.state);wards=onlineCore.wards;syncOnlineActors();running=false;paused=false;finished=false;onlineResultShown=false;
  for(const id of ['pause','reset'])$(id).disabled=true;
  $('again').textContent='재대결 준비';$('resultChoose').textContent='마법 바꾸기';$('intro').classList.add('hidden');$('result').classList.add('hidden');
 },
 go(){running=true;},
 tick(message){if(!onlineCore)return;onlinePrevious=onlineCore.actors.map(a=>({x:a.x,z:a.z}));onlineRenderAt=performance.now();for(const {id,input} of message.inputs)onlineCore.input(id,input);onlineCore.step(STEP);onlineCore.correct(message.state);syncOnlineActors();if(message.state.finished&&!onlineResultShown){onlinePrevious=null;syncOnlineActors();onlineResultShown=true;finished=true;const draw=message.state.winner===null,win=message.state.winner===pvp.index;if(!draw){if(win)wins++;else losses++;}$('resultTitle').textContent=draw?'무승부':win?'승리':'패배';$('resultText').textContent=message.state.time>=600?'10분이 지나 남은 체력으로 승패를 결정했습니다.':'대전이 끝났습니다. 두 사람 모두 준비하면 다시 대전합니다.';$('result').classList.remove('hidden');}}
});
const offlineAgain=$('again').onclick,offlineResultChoose=$('resultChoose').onclick;
$('again').onclick=()=>{if(pvp.connected)pvp.showRoom();else offlineAgain();};
$('resultChoose').onclick=()=>{if(pvp.connected)pvp.showRoom();else offlineResultChoose();};

