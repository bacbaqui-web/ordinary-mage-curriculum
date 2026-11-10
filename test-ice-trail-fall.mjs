import test from 'node:test';
import assert from 'node:assert/strict';
import {Duel} from './dist/duel.mjs';
import {applyIceTrailFalls} from './dist/space-skills.mjs';
import {IceSurface,iceSurfaceGeometry} from './dist/ice-surface.mjs';
import * as T from './dist/three.module.js';
const loads=[{q:'i',w:'t',e:'w'},{q:'i',w:'q',e:'p'}];
function setup(){const d=new Duel(loads),[a,b]=d.actors;a.x=0;a.z=6;b.x=2;b.z=6;a.roll.zones=[{kind:'i',x:2,z:6,radius:1,life:3,tick:0}];return d;}
test('enemy trail contact cancels casting, slips without added damage and shares field immunity',()=>{
 const d=setup(),[a,b]=d.actors;d.input(1,{action:'queue',key:'q'});d.input(1,{action:'begin',point:{x:5,z:6}});assert.ok(b.charge.active);d.step();assert.equal(b.charge.active,false);assert.ok(b.knockdown>.7);assert.ok(b.slipImmune>2.4);assert.equal(b.hp,100);assert.equal(a.knockdown||0,0);
 d.magic.cast({sequence:'it',power:1},a,new T.Vector3(1,0,0),new T.Vector3(b.x,0,b.z));d.step();assert.equal(b.hp,100);const time=b.slipImmune;d.step();assert.ok(b.slipImmune<time);d.dispose();
});
test('expired ice, walls, own trail and dodges do not cause a fall',()=>{
 for(const kind of ['expired','wall','own','dodge']){const d=setup(),[a,b]=d.actors;if(kind==='expired')a.roll.zones[0].life=0;if(kind==='wall')d.magic.a.clearPath=()=>false;if(kind==='own'){a.roll.zones[0].x=a.x;b.x=8;}if(kind==='dodge'){b.roll.kind='l';b.roll.remaining=.15;b.roll.age=0;}applyIceTrailFalls(d.actors,d.magic);assert.equal(b.knockdown||0,0,kind);assert.equal(a.knockdown||0,0,kind);d.dispose();}
});
test('ice field uses the trail surface geometry and materials and disappears on expiry',()=>{
 const d=setup(),a=d.actors[0];d.magic.cast({sequence:'it',power:1},a,new T.Vector3(1,0,0),new T.Vector3(2,0,6));const ice=d.magic.iceCombos,surface=ice.rinkSurface,e=ice.effects[0];assert.ok(surface instanceof IceSurface);const expected=iceSurfaceGeometry([{kind:'i',x:e.point.x,z:e.point.z,radius:e.s.radius,life:e.life}]);assert.deepEqual(surface.mesh.geometry.attributes.position.array,expected.attributes.position.array);assert.equal(surface.mesh.material[0].opacity,.5);assert.equal(surface.mesh.material[0].customProgramCacheKey(),'ice-cracks-sparkle-1');ice.update(5);assert.equal(surface.mesh.visible,false);d.dispose();
});
