import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from './dist/three.module.js';
import {actorShapes,areaTouches,shotTouches,shotContact,wardTouches,combatCamera} from './dist/combat-hit.mjs?v=bodyhit11';
import {createWizard,projectWizard} from './dist/wizard.mjs?v=bodyhit11';
import {LiveMagic} from './dist/live-magic.mjs';
const v=(x,y,z)=>new T.Vector3(x,y,z);
function fighter(x=0,z=0){const g=createWizard(new T.Group(),0,0);g.position.set(x,0,z);projectWizard(g,combatCamera);return {x,z,g,hp:100,dir:v(0,0,1)};}
test('both wizards use separate head and limb silhouettes, with no ground-radius shortcut',()=>{
 for(const target of [fighter(),fighter(4,2)]){
  assert.equal(actorShapes(target).length,17);
  const head=target.g.userData.puppet.head.getWorldPosition(v());
  const shot={mesh:new T.Mesh(new T.SphereGeometry(.035))};shot.mesh.position.copy(head);
  assert.ok(shotTouches(shot,head,head,target));
  const gap=head.clone().add(v(3,0,0));assert.equal(shotTouches(shot,gap,gap,target),false);
  const from=head.clone().add(v(-3,0,0)),to=head.clone().add(v(3,0,0));
  assert.ok(shotTouches(shot,from,to,target));const contact=shotContact(shot,from,to,target);assert.ok(contact>0&&contact<.5);
 }
});
test('area attacks and wall effects intersect body silhouettes, including the visible edge',()=>{
 const t=fighter(3.6,0);assert.ok(areaTouches(t,{x:0,z:0},3,v(1,0,0),true));
 t.x=7;assert.equal(areaTouches(t,{x:0,z:0},3,v(1,0,0),true),false);
 t.x=0;assert.ok(wardTouches(t,{x:0,z:0,nx:1,nz:0,width:3}));
 t.x=8;assert.equal(wardTouches(t,{x:0,z:0,nx:1,nz:0,width:3}),false);
});
test('shared spell API keeps solid-wall blocking for screen-overlapping projectiles and areas',()=>{
 const owner={x:-2,z:0},t=fighter(),head=t.g.userData.puppet.head.getWorldPosition(v());let hits=0,blocked=true;
 const api={scene:new T.Scene(),wards:[],targets:()=>[t],clearPath:()=>!blocked,hit:()=>{hits++;return true;},applyPayload(){},remove(){},vfx:{}};
 const magic=new LiveMagic(api),shot={owner,mesh:new T.Mesh(new T.SphereGeometry(.1))};shot.mesh.position.copy(head);
 assert.equal(api.screenHit(shot,head,head,t),false);magic.apply({kind:'i',power:1},owner,{x:0,z:0},3);assert.equal(hits,0);
 blocked=false;assert.ok(api.screenHit(shot,head,head,t));magic.apply({kind:'i',power:1},owner,{x:0,z:0},3);assert.equal(hits,1);magic.clear();
});
