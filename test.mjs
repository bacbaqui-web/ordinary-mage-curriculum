import assert from 'node:assert/strict';
import {Charge,resolveSpell,NAMES,RING_SECONDS} from './dist/spells.mjs';
let c=new Charge();c.down('q');c.tick(.08);assert.equal(resolveSpell(c.up('q')).sequence,'q');
c=new Charge();c.down('q');c.tick(.5);c.down('w');c.tick(.71);assert.deepEqual(c.parts,['q','w']);c.tick(1.2);assert.deepEqual(c.parts,['q','w','w']);c.tick(1.2);assert.equal(c.up('w'),null);assert.equal(resolveSpell(c.up('q')).sequence,'qww');
c=new Charge();c.down('q');c.tick(.5);c.down('w');c.tick(.71);c.up('w');c.tick(1.2);assert.deepEqual(c.parts,['q','w','q']);c.tick(1.2);assert.equal(resolveSpell(c.up('q')).sequence,'qwq');
c=new Charge();c.down('q');c.down('q');assert.deepEqual(c.held,['q']);c.tick(1.21);assert.equal(resolveSpell(c.up('q')).sequence,'q');
c=new Charge();c.down('e');c.tick(5);assert.deepEqual(c.parts,['e','e','e']);assert.equal(c.progress,1);assert.equal(resolveSpell(c.up('e')).sequence,'eee');
c=new Charge();c.down('q');c.down('w');c.down('e');c.up('e');assert.equal(c.next(),'w');c.clear();assert.equal(c.up('q'),null);
for(const a of'qwe')for(const b of'qwe')for(const d of'qwe')assert.ok(NAMES[a+b+d]);
console.log('PASS: tap, QWW, QWQ, key repeat, partial ring, three-ring cap, cancel, all 27 spell names');

assert.equal(RING_SECONDS,1.2);
c=new Charge();c.down('q');c.tick(.6);assert.equal(c.parts.length,1);assert.equal(c.progress,.5);
const {Roll,ROLL_DISTANCE, incomingThreat}=await import('./dist/combat.mjs');
const roll=new Roll();assert.equal(roll.start(3,4),true);assert.equal(roll.start(1,0),false);assert.equal(roll.invulnerable,true);
let x=0,z=0;for(let i=0;i<36;i++){const step=roll.tick(.01);x+=step.x;z+=step.z;}assert.ok(Math.abs(Math.hypot(x,z)-ROLL_DISTANCE)<1e-8);assert.equal(roll.active,false);assert.equal(roll.invulnerable,false);assert.equal(roll.start(1,0),false);roll.tick(3);assert.equal(roll.start(1,0),true);roll.tick(.29);assert.equal(roll.invulnerable,false);roll.reset();assert.equal(roll.cooldown,0);
assert.equal(incomingThreat(0,0,1,0,10,4,0),true);assert.equal(incomingThreat(0,0,-1,0,10,4,0),false);assert.equal(incomingThreat(0,0,1,0,10,4,3),false);
console.log('PASS: slower charge, roll distance, invulnerability window, cooldown, reset, directional AI threat detection');
const {RUNES,KEYS,DEFAULT_LOADOUT,validLoadout,assignRune,mapSequence,spellName,composition}=await import('./dist/loadout.mjs');
assert.equal(validLoadout({q:'q',w:'q',e:'i'}),false);
assert.equal(validLoadout({q:'bad',w:'w',e:'e'}),false);
assert.deepEqual(assignRune(DEFAULT_LOADOUT,'q','e'),{q:'e',w:'w',e:'q'});
assert.deepEqual(DEFAULT_LOADOUT,{q:'q',w:'w',e:'e'});
assert.deepEqual(assignRune(DEFAULT_LOADOUT,'w','i'),{q:'q',w:'i',e:'e'});
let checked=0;
for(const a of Object.keys(RUNES))for(const b of Object.keys(RUNES))for(const d of Object.keys(RUNES)){
 const config={q:a,w:b,e:d};if(!validLoadout(config))continue;
 for(const x of KEYS)for(const y of KEYS)for(const z of KEYS){const result=resolveSpell({parts:[x,y,z],progress:1,tap:false},config);assert.equal(result.sequence,config[x]+config[y]+config[z]);assert.ok(result.name&&!result.name.includes('undefined'));assert.equal(result.keys,x+y+z);const spec=composition(result.sequence,result.power);assert.ok(Number.isFinite(spec.damage));assert.ok(['shield','field','cone','projectile'].includes(spec.shape));checked++;}
}
assert.equal(checked,3240);
assert.equal(resolveSpell({parts:['q'],progress:0,tap:true},{q:'i',w:'l',e:'g'}).name,'빙결 분사');
assert.notEqual(spellName('ig',NAMES),spellName('gi',NAMES));
assert.ok(composition('i').slow>0);assert.ok(composition('g').force<0);assert.ok(composition('l').speed>composition('i').speed);
console.log('PASS: distinct rune selection, slot swap, 120 loadouts / 3240 mapped combos, new spell roles');

const {elementalSpec,inElementCone,lightningPoint}=await import('./dist/elements.mjs');
for(const k of 'qil'){let previous=0;for(let n=1;n<=3;n++){const s=elementalSpec(k.repeat(n));assert.ok(s.range>previous);previous=s.range;}}
assert.equal(elementalSpec('q').burn,2);assert.equal(elementalSpec('i').burn,0);assert.equal(elementalSpec('i').slow,1.5);
assert.ok(inElementCone({x:0,z:0},{x:0,z:2},{x:0,z:1},elementalSpec('q')));
assert.ok(!inElementCone({x:0,z:0},{x:0,z:-2},{x:0,z:1},elementalSpec('q')));
assert.ok(!inElementCone({x:0,z:0},{x:0,z:3},{x:0,z:1},elementalSpec('q')));
assert.equal(lightningPoint({x:0,z:0},{x:1,z:1},2.5).targeted,true);
for(let n=0;n<100;n++){const p=lightningPoint({x:0,z:0},{x:10,z:10},2.5);assert.equal(p.targeted,false);assert.ok(Math.hypot(p.x,p.z)<=2.5);}
console.log('PASS: elemental range growth, fire/ice payloads, cone direction and range, lightning target/fallback');

const {forceSpec,wardSpec,displacement,crossesWard}=await import('./dist/forces.mjs');
for(const k of 'wg'){for(let n=1;n<3;n++){assert.ok(forceSpec(k.repeat(n+1)).range>forceSpec(k.repeat(n)).range);assert.ok(Math.abs(forceSpec(k.repeat(n+1)).force)>Math.abs(forceSpec(k.repeat(n)).force));}}
assert.ok(forceSpec('w').force>0);assert.ok(forceSpec('g').force<0);assert.equal(displacement(-3,.5),0);assert.equal(displacement(-3,2),-1.1);
assert.ok(wardSpec('eee').hp>wardSpec('ee').hp);assert.ok(wardSpec('ee').duration>wardSpec('e').duration);
const wall={x:0,z:0,nx:0,nz:1,width:3};
assert.ok(crossesWard({x:0,z:2},{x:0,z:-2},wall));assert.ok(!crossesWard({x:3,z:2},{x:3,z:-2},wall));assert.ok(!crossesWard({x:0,z:3},{x:0,z:2},wall));
console.log('PASS: push/pull scaling, pull stopping distance, ward durability/duration, swept projectile blocking');

const {enemyChargeProgress}=await import('./dist/combat.mjs');
assert.equal(enemyChargeProgress(.65,.65),0);assert.equal(enemyChargeProgress(.325,.65),.5);assert.equal(enemyChargeProgress(0,.65),null);assert.equal(enemyChargeProgress(-.1,.65),null);assert.equal(enemyChargeProgress(.2,0),null);
console.log('PASS: enemy charge progress and inactive state');
const {chooseLoadout,choosePlan,OpponentCharge}=await import('./dist/opponent.mjs');
for(let t=0;t<100;t++){const l=chooseLoadout();assert.ok(validLoadout(l));for(let n=0;n<6;n++){const plan=choosePlan(l,n,40,4);assert.ok(plan.length>=1&&plan.length<=3);assert.ok(plan.every(k=>Object.hasOwn(l,k)));}}
for(const a of KEYS)for(const b of ['',...KEYS])for(const c of (b?['',...KEYS]:[''])){
 const plan=[...a+b+c],op=new OpponentCharge();op.start(plan);let elapsed=0,result=null;
 while(elapsed<plan.length*1.2-.01){const dt=Math.min(.01,plan.length*1.2-.01-elapsed);if(dt<1e-9)break;result=op.tick(dt,DEFAULT_LOADOUT);assert.equal(result,null);elapsed+=dt;assert.ok(op.charge.parts.length<=3);}
 result=op.tick(.02,DEFAULT_LOADOUT);assert.ok(result);assert.equal(result.keys,plan.join(''));assert.equal(result.sequence,mapSequence(plan,DEFAULT_LOADOUT));assert.equal(op.active,false);
}
const staged=new OpponentCharge();staged.start(['q','w','e']);staged.tick(.6,DEFAULT_LOADOUT);assert.deepEqual(staged.charge.parts,['q']);assert.ok(Math.abs(staged.charge.progress-.5)<1e-8);staged.tick(.61,DEFAULT_LOADOUT);assert.deepEqual(staged.charge.parts,['q','w']);staged.clear();assert.equal(staged.active,false);assert.equal(staged.tick(5,DEFAULT_LOADOUT),null);
console.log('PASS: opponent loadouts, all 39 plans, 1.2 seconds per ring, ordered colors, three-ring cap, cancel');
