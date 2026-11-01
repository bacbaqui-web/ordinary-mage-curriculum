import assert from 'node:assert/strict';
import {chooseLoadout,chooseLearnedPlan,spendEnemyPoints,OpponentCharge} from './dist/opponent.mjs';
import {createProgress,awardKill} from './dist/progression.mjs';
import {elementalSpec} from './dist/elements.mjs';
import {forceSpec,wardSpec} from './dist/forces.mjs';
import {fallsFromAbove} from './dist/delivery.mjs';
import {spellName} from './dist/loadout.mjs';
for(let n=0;n<120;n++){
 const loadout=chooseLoadout(),p=createProgress(loadout);assert.equal(Object.values(p.ranks).filter(Boolean).length,1);
 for(let level=1;level<=9;level++){
  for(let attack=0;attack<10;attack++){const plan=chooseLearnedPlan(loadout,p,attack,30,4);assert(plan.every(k=>p.ranks[k]>0));const c=new OpponentCharge();c.start(plan);let spell;for(let j=0;j<120&&!spell;j++)spell=c.tick(.04,loadout);assert(spell);assert(spell.parts.every(k=>p.ranks[k]>0));}
  awardKill(p,200);spendEnemyPoints(p,loadout);
 }
 assert.deepEqual(p.ranks,{q:3,w:3,e:3});assert.equal(p.points,0);
}
for(const first of 'qiwg')for(const seq of [first+'l',first+'lq',first+'ql']){
 const spec=elementalSpec(seq)||forceSpec(seq);assert(spec.falling&&spec.overhead);assert.equal(spec.echo,0);assert(spellName(seq).includes('낙하'));assert(fallsFromAbove(seq));assert(spec.radius>0);if(first==='q')assert.equal(spec.burn,2);if(first==='i')assert(spec.slow>0);if(first==='w')assert(spec.force>0);if(first==='g')assert(spec.force<0);
}
for(const seq of ['q','qw','lq','il'.split('').reverse().join(''),'el','eql'])assert.equal(fallsFromAbove(seq),false);
assert(wardSpec('el').shock>0);assert.equal(elementalSpec('lq').kind,'l');console.log('PASS: enemy learned-only plans through levels, automatic point spending, overhead ordering and original payloads');
