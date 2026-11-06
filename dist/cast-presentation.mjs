import * as T from './three.module.js';
import {spellReach} from './live-spells.mjs?v=slam15';
import {RUNES} from './combo-design.mjs?v=slam15';
export function castWithPresentation({magic,wards,clearPath,collides,wallBlocks},s,caster,dir,aimPoint){
 const hand=caster.g.userData.puppet.lastPositions?.RightHand?.clone().addScaledVector(dir,.25)||new T.Vector3(caster.x,1.3,caster.z).addScaledVector(dir,.5);
 const origin=clearPath(caster,{x:hand.x,z:hand.z})?hand:null;
 const before=new Set([...magic.effects,...magic.fire.effects,...wards]);caster.castContacts=[];
 magic.cast(s,caster,dir,aimPoint,origin);
 const created=[...magic.effects,...magic.fire.effects,...wards].filter(e=>!before.has(e)),contacts=caster.castContacts;caster.castContacts=null;
 const moving=created.find(e=>['projectile','shot','punch','slash'].includes(e.type)),effect=moving||created[0];
 let end;
 if(contacts.length)end=contacts.sort((a,b)=>a.distanceTo(hand)-b.distanceTo(hand))[0];
 else if(effect?.type==='cone')end=new T.Vector3(effect.point.x,.25,effect.point.z).addScaledVector(dir,(effect.radius||1)*.75);
 else if(effect?.point)end=new T.Vector3(effect.point.x,.15,effect.point.z);
 else if(effect?.mesh||effect?.m)end=(effect.mesh||effect.m).position.clone();
 else{end=aimPoint.clone();const delta=end.clone().sub(new T.Vector3(caster.x,0,caster.z));delta.y=0;if(delta.length()>spellReach(s.sequence))delta.setLength(spellReach(s.sequence));end.set(caster.x+delta.x,.15,caster.z+delta.z);}
 if(!moving){const delta=end.clone().sub(hand),distance=delta.length();for(let d=.1;d<distance;d+=.1){const point=hand.clone().addScaledVector(delta,d/distance);if(collides(point.x,point.z,.1)||wallBlocks(caster,point)){end.copy(hand).addScaledVector(delta,Math.max(0,d-.1)/distance);break;}}}
 const beamTarget=moving?()=>({point:moving.mesh.position,active:!!moving.mesh.parent&&moving.life>0}):()=>({point:end,active:false});
 caster.castFlash=.3;caster.pendingCastLight={colors:[...s.sequence].map(k=>RUNES[k].color),tier:s.sequence.length,dir:dir.clone(),origin:hand,beamTarget};
}
export function renderCastPresentation(actor,feedback){if(!actor.pendingCastLight)return;const event=actor.pendingCastLight,u=actor.g.userData,hand=()=>u.puppet.lastPositions.RightHand.clone().addScaledVector(event.dir,.25);feedback.fire(hand,event.dir,event.colors,event.tier);feedback.beam(hand,event.beamTarget,event.colors,()=>actor.g.visible,event.tier);actor.pendingCastLight=null;}
