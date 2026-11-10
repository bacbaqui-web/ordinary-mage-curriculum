import assert from 'node:assert/strict';
import * as T from './dist/three.module.js';
import {ImpactFeedback} from './dist/impact-feedback.mjs';
import {DEFAULTS,NONE,normalize,readImpactSettings,STORAGE_KEY,attackPose,hitPose,numberOffset} from './dist/impact-settings.mjs';
const scene=new T.Scene(),g=new T.Group();scene.add(g);const actor={g,x:2,z:0,hp:100},dir=new T.Vector3(1,0,0);
const feedback=new ImpactFeedback(scene,{watch:false,settings:{...DEFAULTS,anticipation:200}});let casts=0;
feedback.cast(actor,dir,()=>casts++);feedback.flush();assert.equal(casts,0);feedback.step(.19);feedback.flush();assert.equal(casts,0);feedback.step(.01);feedback.flush();assert.equal(casts,1);assert.equal(actor.impactPending,false);
feedback.cast(actor,dir,()=>casts++);actor.frozen=1;feedback.step(.3);feedback.flush();assert.equal(casts,1);assert.equal(actor.impactPending,false);actor.frozen=0;
feedback.hit(actor,dir,7);assert.equal(feedback.stats().hits,1);assert.equal(feedback.step(.02),0);assert(Math.abs(feedback.step(.06)-.02)<1e-8);assert.equal(feedback.freeze,0);
g.position.set(2,0,0);feedback.actor(actor);assert(g.scale.y<1);assert(g.position.x>2);feedback.restore();assert.deepEqual(g.position.toArray(),[2,0,0]);assert.deepEqual(g.scale.toArray(),[1,1,1]);assert.equal(actor.x,2,'render recoil does not change actor physics');
const shot={type:'shot',dir,mesh:new T.Mesh(new T.SphereGeometry(.2),new T.MeshBasicMaterial()),speed:13,life:.5};scene.add(shot.mesh);feedback.draw([shot]);shot.mesh.position.x=2;feedback.restore();shot.mesh.position.x=2;feedback.draw([shot]);assert(shot.mesh.position.y>0);assert(shot.mesh.scale.x>1);feedback.restore();assert.deepEqual(shot.mesh.position.toArray(),[2,0,0]);assert.deepEqual(shot.mesh.scale.toArray(),[1,1,1]);feedback.draw([]);assert.equal(feedback.projectiles.size,0);
feedback.clear();assert.equal(feedback.bursts.length,0);assert.equal(feedback.pending.size,0);
assert.deepEqual(normalize(DEFAULTS),DEFAULTS);assert.equal(readImpactSettings({getItem:()=>'{bad'}).volume,35);assert.equal(readImpactSettings({getItem:key=>{assert.equal(key,STORAGE_KEY);return '{"volume":0,"freeze":5000}';}}).freeze,200);
assert.equal(attackPose(NONE,.2).offset,0);assert.equal(hitPose(NONE,.1).squash,0);assert.equal(numberOffset(NONE,.2).x,0);
console.log('PASS: delayed casts, interruption, hit stop, render-only transforms, projectile restoration, cleanup and saved settings');
feedback.hit(actor,dir,7);actor.dead=true;feedback.step(2);assert.equal(feedback.hits.size,0,'expired dead actors are released');feedback.clear();

// Game updates yaw and knockdown separately. Preserve the Euler representation,
// not only an equivalent quaternion, across temporary impact transforms.
for(const yaw of [-3,-2,-Math.PI/2,Math.PI/2,2,3]){
 g.rotation.set(0,yaw,0);feedback.hit(actor,dir,7);feedback.actor(actor);feedback.restore();
 g.rotation.y=yaw+.01;g.rotation.z=0;
 assert(new T.Vector3(0,1,0).applyQuaternion(g.quaternion).y>.999,'impact must not flip actor below ground at yaw '+yaw);
 feedback.clear();
}
