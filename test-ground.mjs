import assert from 'node:assert/strict';
import {groundSpec,groundPoint,inGround,advanceGround} from './dist/ground.mjs';
import {RUNES,validLoadout,spellName} from './dist/loadout.mjs';
import {describeSpell} from './dist/guide.mjs';
import {previewSpec} from './dist/spell-preview.mjs';
import {wardSpec,crossesWard} from './dist/forces.mjs';
import {createProgress} from './dist/progression.mjs';
assert.equal(RUNES.e.name,'장벽');assert.equal(RUNES.t.name,'장판');assert.equal(Object.values(RUNES).some(r=>r.name==='장막'),false);
assert(validLoadout({q:'t',w:'e',e:'q'}));assert.equal(createProgress({q:'t',w:'e',e:'q'}).ranks.q,1);
assert.equal(groundSpec('e'),null);assert(wardSpec('e').hp>0);assert(crossesWard({x:-1,z:0},{x:1,z:0},{x:0,z:0,nx:1,nz:0,width:2}));
const g=groundSpec('t');assert.equal(g.radius,1.6);assert.equal(g.duration,4);assert(groundSpec('tt').radius>g.radius);assert(groundSpec('te').duration>g.duration);
assert(groundSpec('qt').burn);assert(groundSpec('ti').slow);assert(groundSpec('ltw').shock);assert(groundSpec('tg').force<0);assert(groundSpec('tw').force>0);
assert.deepEqual(groundPoint({x:0,z:0},{x:0,z:0},6),{x:0,z:0});assert(Math.abs(groundPoint({x:0,z:0},{x:20,z:0},6).x-6)<1e-9);assert(groundPoint({x:0,z:0},{x:20,z:0},6,x=>x>=2).x<2);
assert(inGround({x:0,z:0},{x:1.6,z:0},1.6));assert(!inGround({x:0,z:0},{x:1.61,z:0},1.6));
for(const dt of [1/60,.04,.7,5]){const f={life:4,tick:0,spec:g};let hits=0;for(let i=0;i<Math.ceil(5/dt);i++)advanceGround(f,dt,()=>hits++);assert.equal(hits,8);assert.equal(f.life,0);}
let checked=0;const ids=Object.keys(RUNES);for(const a of ids)for(const b of ['',...ids])for(const c of b?['',...ids]:['']){const seq=a+b+c,s=previewSpec(seq);assert(s);assert(Number.isFinite(s.range));assert(!spellName(seq).includes('undefined'));assert(describeSpell(seq));if(seq.includes('t'))assert(s.ground);checked++;}assert.equal(checked,399);
console.log('PASS: seven runes, ground placement and range, no wall collision, elemental payloads, exact lifetime pulses, 399 preview/description combinations');
