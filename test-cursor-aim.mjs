import assert from 'node:assert/strict';
import * as T from './dist/three.module.js';
import {cursorAim,spellAimHeight} from './dist/cursor-aim.mjs';
import {Duel} from './dist/duel.mjs';
for(const sequence of ['i','ii','iw','qw','qww','ww']){
 const duel=new Duel([{q:'i',w:'w',e:'e'},{q:'q',w:'w',e:'e'}]),owner=duel.actors[0];owner.x=0;owner.z=0;
 for(const aspect of [1,16/9])for(const offset of [0,3])for(const cursor of [new T.Vector2(.3,.15),new T.Vector2(-.25,-.2)]){
  const camera=new T.PerspectiveCamera(38,aspect,.1,150);camera.position.set(12+offset,17,15);camera.lookAt(offset,0,0);camera.updateMatrixWorld();
  const height=spellAimHeight(sequence),point=cursorAim(cursor,camera,height),dir=point.clone().normalize();
  duel.magic.clear();duel.magic.cast({sequence,power:1,...(sequence==='i'?{iceHand:'left',timed:true}:{})},owner,dir,point);
  const shot=[...duel.magic.ice.effects,...duel.magic.iceCombos.effects,...duel.magic.fire.effects,...duel.magic.effects].find(e=>['shot','projectile'].includes(e.type));assert.ok(shot,sequence);
  assert.equal(shot.mesh.position.y,height,sequence+' flight height');
  const a=shot.mesh.position.clone().project(camera),b=shot.mesh.position.clone().add(shot.dir).project(camera);
  const error=Math.abs((cursor.x-a.x)*(b.y-a.y)-(cursor.y-a.y)*(b.x-a.x))/Math.hypot(b.x-a.x,b.y-a.y);
  assert.ok(error<1e-8,sequence+' projected trajectory must cross cursor');
 }
 duel.dispose();
}
for(const seq of ['it','ig','il','ie','qt','qg','ql','e','t'])assert.equal(spellAimHeight(seq),0,seq+' ground placement');
console.log('PASS: actual ice/fire/generic projectile trajectories cross cursor across viewports and camera movement; ground spells retain ground targeting');

for(const sequence of ['i','ii','iw','qw','ww']){
 const d=new Duel([{q:'i',w:'w',e:'e'},{q:'q',w:'w',e:'e'}]),owner=d.actors[0];owner.x=0;owner.z=0;
 const origin=new T.Vector3(.28,1.17,.43),camera=new T.PerspectiveCamera(38,16/9,.1,150);camera.position.set(12,17,15);camera.lookAt(0,0,0);camera.updateMatrixWorld();
 const cursor=new T.Vector2(.2,-.1),target=cursorAim(cursor,camera,origin.y),dir=target.clone().sub(origin);dir.y=0;dir.normalize();
 d.magic.cast({sequence,power:1,...(sequence==='i'?{iceHand:'left',timed:true}:{})},owner,dir,target,origin);
 const effect=[...d.magic.ice.effects,...d.magic.iceCombos.effects,...d.magic.fire.effects,...d.magic.effects].find(e=>['shot','projectile'].includes(e.type));
 assert.ok(effect.mesh.position.distanceTo(origin)<1e-9,sequence+' starts at actual ring center');
 if(sequence==='i'){const ring=d.magic.ice.effects.find(e=>e.type==='iceHandRing');d.magic.ice.syncHands(owner,{lastPositions:{LeftHand:new T.Vector3(7,3,9)}});assert.ok(ring.mesh.position.distanceTo(origin)<1e-9,'emission ring does not detach from its launch point');}
 d.magic.update(.01);assert.ok(Math.abs(effect.mesh.position.y-origin.y)<1e-9,sequence+' retains ring height');
 const a=origin.clone().project(camera),b=effect.mesh.position.clone().project(camera);assert.ok(Math.abs((cursor.x-a.x)*(b.y-a.y)-(cursor.y-a.y)*(b.x-a.x))<1e-8,sequence+' custom origin still aims through cursor');d.dispose();
}
console.log('PASS: projectiles start at custom ring centers, retain height and cursor trajectory; released ice ring stays anchored');
for(const loadout of [{q:'i',w:'w',e:'e'},{q:'q',w:'w',e:'e'},{q:'w',w:'i',e:'e'}]){
 let cast;const d=new Duel([loadout,{q:'q',w:'w',e:'e'}],{onCast:s=>cast=s}),a=d.actors[0];
 d.castResult(a,{parts:['q','w'],complete:true,progress:1,timed:true});
 const shot=[...d.magic.iceCombos.effects,...d.magic.fire.effects,...d.magic.effects].find(e=>['shot','projectile'].includes(e.type));
 assert.ok(shot);assert.equal(shot.mesh.position.y,spellAimHeight(cast.sequence));assert.ok(shot.mesh.position.distanceTo(cast.emission)<1e-9,'network casting ring matches authoritative projectile origin');d.dispose();
}
console.log('PASS: authoritative casts retain the cursor aim height and expose the exact ring origin');
