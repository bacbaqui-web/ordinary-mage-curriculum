import test from 'node:test';
import assert from 'node:assert/strict';
import {roundDamage,damageNumber} from './dist/damage-number.mjs';
import {Duel} from './dist/duel.mjs';
import {Vector3} from './dist/three.module.js';
import {DAMAGE_CATALOG,BASIC_DAMAGE_CATALOG,ICE_PAIR_DAMAGE_CATALOG} from './dist/damage-catalog.mjs';
test('rounding uses nearest integer, including zero damage',()=>{
 for(const [a,b] of [[0,0],[.49,0],[.5,1],[1.49,1],[1.5,2],[19.6,20]])assert.equal(roundDamage(a),b);
 assert.equal(damageNumber(1234.6),'1,235');
});
test('combat rounds damage after shields and for every damage-over-time tick',()=>{
 const d=new Duel([{q:'i',w:'q',e:'w'},{q:'q',w:'i',e:'w'}]),[a,b]=d.actors,dir=new Vector3(1,0,0);let last;
 d.onHit=(_,value)=>last=value;b.shield=.25;d.hit(b,7.75,dir,0,a);assert.equal(last,8);assert.equal(b.hp,92);
 b.burn=2;b.burnTick=0;b.burnDamage=1.76;b.burnOwner=a;d.statuses(.01);assert.equal(b.hp,90);assert.equal(last,2);
 b.burn=0;b.poison=2;b.poisonTick=0;b.poisonDamage=.65;b.poisonOwner=a;d.statuses(.01);assert.equal(b.hp,89);assert.equal(last,1);d.dispose();
});
test('all spell, basic attack and ice variant catalogs contain integer damage',()=>{
 for(const catalog of [DAMAGE_CATALOG,BASIC_DAMAGE_CATALOG,ICE_PAIR_DAMAGE_CATALOG])for(const [seq,d]of Object.entries(catalog)){
 for(const key of ['total','direct','dot'])assert.ok(Number.isInteger(d[key]),seq+' '+key);
 for(const g of d.groups)assert.ok(Number.isInteger(g.value),seq);
 assert.equal(d.total,d.direct+d.dot);
 }
});
