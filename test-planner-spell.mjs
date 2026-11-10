import test from 'node:test';
import assert from 'node:assert/strict';
import {plannerSpell,basicKey} from './dist/planner-spell.mjs';
import {BASIC_DAMAGE_CATALOG} from './dist/damage-catalog.mjs';
import {ICE_BASIC} from './dist/ice-basic.mjs';
test('planner distinguishes live ice hands and charged basic range without boosting damage',()=>{
 for(const hand of ['left','right'])for(const charged of [false,true]){const s=plannerSpell('i',{hand,charged});assert.equal(s.iceHand,hand);assert.equal(s.name,ICE_BASIC[hand].name);assert.equal(s.rangeScale,charged?1.25:1);assert.equal(s.power,1);}
 assert.equal(BASIC_DAMAGE_CATALOG[basicKey('i','left')].direct,7);
 assert.equal(BASIC_DAMAGE_CATALOG[basicKey('i','right')].direct,12);
});
test('single runes use basic power while combinations retain their full charge power',()=>{
 for(const r of 'qildpetwgsh')assert.equal(plannerSpell(r).power,1);
 assert.equal(plannerSpell('iq').iceHand,undefined);assert.equal(plannerSpell('iq').power,1.76);
});
