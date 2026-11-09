import test from 'node:test';
import assert from 'node:assert/strict';
import {CHARACTERS,characterFor,chooseCharacter,chooseSupport} from './dist/character-loadout.mjs';
import {RUNES,validLoadout} from './dist/live-loadout.mjs?v=bolt17';
import {createProgress} from './dist/progression.mjs';
test('ten authored characters have unique main runes',()=>{
 assert.equal(CHARACTERS.length,10);assert.equal(new Set(CHARACTERS.map(c=>c.rune)).size,10);
 for(const c of CHARACTERS){assert.ok(RUNES[c.rune]);const l=chooseCharacter({q:'q',w:'w',e:'e'},c.id);assert.equal(l.q,c.rune);assert.ok(validLoadout(l));assert.equal(characterFor(l),c);assert.equal(Object.values(createProgress(l).ranks).reduce((a,b)=>a+b),1);}
});
test('all character switches retain valid unique supports and locked main rune',()=>{
 for(const a of Object.keys(RUNES))for(const b of Object.keys(RUNES))for(const c of Object.keys(RUNES)){
 const old={q:a,w:b,e:c};if(!validLoadout(old))continue;
 for(const hero of CHARACTERS){const l=chooseCharacter(old,hero.id);assert.ok(validLoadout(l));assert.equal(l.q,hero.rune);assert.deepEqual(chooseSupport(l,'q',b),l);assert.deepEqual(chooseSupport(l,'w',l.q),l);assert.deepEqual(chooseSupport(l,'w',l.e),{q:l.q,w:l.e,e:l.w});}
 }
});
