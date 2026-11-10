import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from './dist/three.module.js';
import {Duel} from './dist/duel.mjs';
import {canSee} from './dist/vision.mjs';
import {crossesWard,distanceToWard} from './dist/forces.mjs';
const loads=[{q:'i',w:'d',e:'w'},{q:'i',w:'d',e:'w'}];
test('iceberg rises at distant aim, hurts once and allows outward knockback',()=>{
 const d=new Duel(loads),[a,b]=d.actors;Object.assign(a,{x:0,z:6});Object.assign(b,{x:6,z:6});
 d.magic.cast({sequence:'id',power:1},a,new T.Vector3(1,0,0),new T.Vector3(6,0,6));
 const e=d.magic.iceCombos.effects[0],w=d.wards[0];assert.equal(w.x,6);assert.equal(e.type,'iceberg');assert.equal(b.hp,92);assert.ok(b.motion.active);assert.ok(b.slow>0);
 assert.equal(e.rock.children[0].geometry.type,'IcosahedronGeometry');assert.equal(e.rock.children[0].material.opacity,.55);assert.equal(e.rock.position.y,-3.3);
 assert.equal(d.wallBlocks(b,{x:6.1,z:6}),false);assert.ok(distanceToWard(b,w)<0);
 for(let i=0;i<12;i++)d.step();assert.ok(e.rock.position.y>-.01);assert.ok(b.x>6.5);assert.equal(b.hp,92);
 assert.equal(canSee({x:3,z:6},{x:9,z:6},{walls:[w]}),false);
 assert.equal(canSee({x:6,z:3},{x:6,z:9},{walls:[w]}),false);
 assert.equal(crossesWard({x:3,z:9},{x:9,z:9},w,.1),false);
 d.dispose();
});
test('iceberg clamps placement to 7m and blocks enemy ice shots from side',()=>{
 const d=new Duel(loads),[a,b]=d.actors;Object.assign(a,{x:0,z:6});Object.assign(b,{x:7,z:2});
 d.magic.cast({sequence:'id',power:1},a,new T.Vector3(1,0,0),new T.Vector3(20,0,6));const w=d.wards[0];assert.equal(w.x,7);
 d.magic.a.collides=()=>false;d.magic.a.wallBlocks=()=>false;d.magic.cast({sequence:'ii',power:1},b,new T.Vector3(0,0,1),new T.Vector3(7,0,10));for(let i=0;i<8;i++)d.step();assert.equal(w.hp,12);assert.equal(d.magic.iceCombos.effects.filter(e=>e.type==='shot').length,0);d.dispose();
});

test('iceberg cracks and bursts on emergence, shatters once on expiry or destruction',()=>{for(const destroyed of [false,true]){const d=new Duel(loads),a=d.actors[0];let particles=0;d.magic.a.vfx.particle=()=>particles++;d.magic.cast({sequence:'id',power:1},a,new T.Vector3(1,0,0),new T.Vector3(a.x+2,0,a.z));const e=d.magic.iceCombos.effects[0];assert.equal(e.cracks.children.length,18);assert.equal(particles,80);const geometry=e.rock.children[0].geometry;assert.equal(geometry.type,'IcosahedronGeometry');if(destroyed)e.ward.hp=0;else e.life=.01;d.magic.update(.02);assert.equal(d.magic.iceCombos.effects.filter(e=>e.type==='iceberg').length,0);const debris=d.magic.iceCombos.effects.filter(e=>e.type==='iceDebris');assert.equal(debris.length,1);assert.equal(debris[0].mesh.children.length,geometry.attributes.position.count/3);for(let i=0;i<debris[0].mesh.children.length;i++){const shard=debris[0].mesh.children[i];for(let j=0;j<3;j++){const restored=new T.Vector3().fromBufferAttribute(shard.geometry.attributes.position,j).add(shard.position).sub(e.rock.position);const original=new T.Vector3().fromBufferAttribute(geometry.attributes.position,i*3+j);assert.ok(restored.distanceTo(original)<1e-6);}assert.equal(shard.rotation.x,0);}d.magic.update(.2);assert.ok(debris[0].mesh.children[0].rotation.x>0);d.magic.update(2);assert.equal(d.magic.iceCombos.effects.length,0);d.dispose();}});
