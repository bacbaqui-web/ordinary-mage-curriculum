import assert from 'node:assert/strict';
import {canSee} from './dist/vision.mjs';
const a={x:0,z:0},b={x:10,z:0},rock={x:5,z:0,w:2,h:2},wall={x:5,z:0,nx:1,nz:0,width:3,hp:20,life:5},cloud={x:5,z:0,radius:2,life:6};
assert.ok(canSee(a,b));assert.equal(canSee(a,b,{obstacles:[rock]}),false);assert.equal(canSee(a,b,{walls:[wall]}),false);assert.equal(canSee(a,b,{smoke:[cloud]}),false);
assert.equal(canSee(a,{x:5,z:0},{smoke:[cloud]}),false);assert.equal(canSee({x:5,z:0},b,{smoke:[cloud]}),false);assert.ok(canSee(a,a,{smoke:[{...cloud,x:0}]}));assert.ok(canSee(a,b,{smoke:[{...cloud,life:0}]}));assert.ok(canSee(a,b,{walls:[{...wall,hp:0}]}));assert.ok(canSee({x:0,z:4},{x:10,z:4},{obstacles:[rock],walls:[wall],smoke:[cloud]}));assert.equal(canSee(b,a,{smoke:[cloud]}),false);
console.log('PASS rock and wall occlusion, smoke inside/behind, symmetry, expiry, destroyed walls and unobstructed paths');
