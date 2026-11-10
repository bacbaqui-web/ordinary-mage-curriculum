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
