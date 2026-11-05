import assert from 'node:assert/strict';
import {SpriteSpells} from './dist/sprite-spells.mjs';
const calls=[],pixel={active:[],play:(...args)=>calls.push(args),impact:(...args)=>calls.push(args)};
const vfx=new SpriteSpells(pixel);vfx.burst({kind:'q',range:3},{x:1,z:0},{x:0,z:0},x=>x>=1.2);assert(calls.every(c=>c[1]<1.2));calls.length=0;
vfx.fall(1,2,{kind:'i',height:4},'#ffffff');const follow=calls[0][3].follow;assert(follow(.01).y>follow(.2).y);assert.equal(vfx.stats().particles,0);assert.equal(vfx.stats().style,'pvfx-2d');console.log('PASS: sprite-only dispatch, terrain-limited burst, descending sprite');
