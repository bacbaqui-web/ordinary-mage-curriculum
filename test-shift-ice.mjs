import test from 'node:test';import assert from 'node:assert/strict';import * as T from './dist/three.module.js';
import {Duel} from './dist/duel.mjs';import {bindDuelControls,mouseRecipe} from './dist/duel-controls.mjs';import {QueuedCharge} from './dist/queued-charge.mjs';import {plannerSpell} from './dist/planner-spell.mjs';import {plannerRange} from './dist/planner-range.mjs';
const loads=[{q:'i',w:'q',e:'w'},{q:'q',w:'i',e:'w'}],point={x:5,z:6};
const event=(target,type,props)=>{const e=new Event(type,{cancelable:true});Object.assign(e,props);target.dispatchEvent(e);};
test('Shift during either mouse charge replaces materials without resetting energy and keyup keeps the recipe',()=>{
 for(const button of [0,2]){const c=new QueuedCharge(),canvas=new EventTarget(),target=new EventTarget();let repeats=0;
 bindDuelControls(canvas,target,{enabled:()=>true,begin:buttons=>{mouseRecipe(buttons,{q:2,w:1,e:1},loads[0]).forEach(k=>c.enqueue(k));c.begin();},repeat:()=>{repeats++;c.retarget(['q','q']);},release:()=>c.release(),cancel:()=>c.clear(),walk(){}});
 event(canvas,'mousedown',{button});c.tick(.8);event(target,'keydown',{code:'ShiftLeft',repeat:false});assert.equal(c.elapsed,.8);assert.deepEqual(c.queue,['q','q']);
 event(target,'keydown',{code:'ShiftLeft',repeat:true});assert.equal(repeats,1);event(target,'keyup',{code:'ShiftLeft'});assert.deepEqual(c.queue,['q','q']);c.tick(1.6);assert.equal(c.parts.length,2);event(target,'mouseup',{button});assert.equal(c.active,false);
 }
});
test('server repeat only accepts ice, preserves charge and reproduces the right-hand variant',()=>{
 const casts=[],d=new Duel(loads,{onCast:s=>casts.push(s)}),a=d.actors[0];a.x=0;a.z=6;
 for(const k of ['q','e'])d.input(0,{action:'queue',key:k});d.input(0,{action:'begin',hand:'right',point});for(let i=0;i<24;i++)d.step();
 const before=a.charge.elapsed;d.input(0,{action:'repeat'});assert.equal(a.charge.elapsed,before);assert.deepEqual(a.charge.queue,['q','q']);
 const copy=new Duel(loads);copy.correct(d.snapshot());assert.equal(copy.actors[0].iceRepeat,true);copy.dispose();
 for(let i=0;i<50;i++)d.step();d.input(0,{action:'release',point});assert.equal(casts.at(-1).iceVariant,'beam');assert.equal(d.magic.iceCombos.effects.at(-1).type,'beam');assert.equal(a.iceRightCool,3.2);
 d.input(1,{action:'queue',key:'q'});d.input(1,{action:'begin',point});d.input(1,{action:'repeat'});assert.deepEqual(d.actors[1].charge.queue,['q']);d.dispose();
});
function setup(){const d=new Duel(loads),[a,b]=d.actors;Object.assign(a,{x:0,z:6});Object.assign(b,{x:2,z:6});a.dir.set(1,0,0);return d;}
function beam(d){d.magic.cast(plannerSpell('ii',{hand:'right'}),d.actors[0],new T.Vector3(1,0,0),new T.Vector3(5,0,6));}
test('beam freezes after continuous one-second contact, interrupts orders and thaws after one second',()=>{
 const d=setup(),b=d.actors[1];beam(d);for(let i=0;i<27;i++)d.step();assert.ok(!(b.frozen>0));d.input(1,{action:'queue',key:'q'});d.input(1,{action:'begin',point});
 for(let i=0;i<4;i++)d.step();assert.ok(b.frozen>.9);assert.equal(b.charge.active,false);assert.equal(d.input(1,{action:'move',point}),false);assert.equal(d.input(1,{action:'begin',point}),false);
 const x=b.x,z=b.z;for(let i=0;i<25;i++)d.step();assert.equal(b.x,x);assert.equal(b.z,z);for(let i=0;i<10;i++)d.step();assert.equal(b.frozen,0);assert.equal(d.input(1,{action:'move',point}),true);d.dispose();
});
test('leaving beam resets exposure; walls block both beam damage and freeze',()=>{
 const d=setup(),b=d.actors[1];beam(d);for(let i=0;i<20;i++)d.step();b.z=12;d.step();b.z=6;for(let i=0;i<25;i++)d.step();assert.ok(!(b.frozen>0));d.dispose();
 const blocked=setup();blocked.magic.a.wallBlocks=()=>true;beam(blocked);for(let i=0;i<55;i++)blocked.step();assert.equal(blocked.actors[1].hp,100);assert.ok(!(blocked.actors[1].frozen>0));blocked.dispose();
});
test('planner keeps left icicle and right focused mist distinct',()=>{assert.equal(plannerSpell('ii').name,'고드름');assert.equal(plannerSpell('ii',{hand:'right'}).name,'집중 얼음안개');assert.equal(plannerRange('ii',{hand:'right'}).value,5.5);});
