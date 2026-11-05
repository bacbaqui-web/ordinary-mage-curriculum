import assert from 'node:assert/strict';
import {bindMouseControls} from './dist/mouse-controls.mjs';
import {QueuedCharge} from './dist/queued-charge.mjs';
const canvas=new EventTarget(),win=new EventTarget(),charge=new QueuedCharge();let moves=0,casts=0;
bindMouseControls(canvas,win,{move:()=>moves++,begin:()=>charge.begin(),release:()=>{if(charge.release())casts++;},cancel:()=>charge.clear()});
function send(target,type,button,buttons){const e=new Event(type,{cancelable:true});Object.assign(e,{button,buttons});target.dispatchEvent(e);}
charge.enqueue('q');send(canvas,'mousedown',0,1);charge.tick(.6);send(canvas,'mousedown',2,3);send(canvas,'mousemove',-1,3);
assert.equal(moves,2);assert.equal(charge.active,true);send(win,'mouseup',2,1);assert.equal(casts,0);assert.equal(charge.active,true);
send(canvas,'mousedown',2,3);send(win,'mouseup',0,2);assert.equal(casts,1);assert.deepEqual(charge.queue,[]);send(canvas,'mousemove',-1,2);assert.equal(moves,4);
charge.enqueue('q');send(canvas,'mousedown',0,3);assert.equal(charge.active,true);send(win,'mouseup',0,2);assert.equal(casts,2);
console.log('PASS left/right chords, right release preserves charge, left release casts outside canvas, movement continues');
