import assert from 'node:assert/strict';
import {DAMAGE_CATALOG as c} from './dist/damage-catalog.mjs';
import {fireSpec} from './dist/fire-spec.mjs';
import {damageSummary,damageDetails} from './dist/damage-display.mjs';
assert.equal(Object.keys(c).length,1463);
for(const [seq,d] of Object.entries(c)){assert.ok(Number.isInteger(d.total)&&d.total>=0,seq);for(const g of d.groups)assert.ok(Number.isInteger(g.value),seq);assert.ok(!/\d+\.\d+/.test(damageSummary(seq)),seq);assert.ok(Math.abs(d.direct+d.dot-d.total)<1e-7,seq);assert.ok(Math.abs(d.groups.reduce((sum,g)=>sum+g.value*g.count,0)-d.total)<1e-7,seq);assert.ok(damageDetails(seq).includes('계산 기준'));assert.ok(!damageSummary(seq).includes('NaN'));}
assert.equal(c.qi.total,0);assert.equal(c.qli.direct,Math.round(fireSpec('qli',2.24).damage));assert.equal(c.qli.dot,0);assert.equal(c.qlp.groups[0].value,Math.round(fireSpec('qlp',2.24).damage));assert.ok(c.qlp.dot>c.qlp.direct);assert.ok(c.qlq.groups.some(g=>g.count>1));
console.log('PASS all 1463 damage displays, sums, repeated hit counts, zero-damage skills and live spec values');
