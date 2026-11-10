import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from './dist/three.module.js';
import {Duel} from './dist/duel.mjs';
import {castWithPresentation,renderCastPresentation} from './dist/cast-presentation.mjs';
import {CastingFeedback,runeRing} from './dist/casting-feedback.mjs';
test('projectiles flash at the source without a following beam; fields keep a fixed beam',()=>{
 for(const seq of ['qw','qqw','qlw','qiw','ii','iw','lw','qt','it','lt']){
 const d=new Duel([{q:'i',w:'q',e:'w'},{q:'q',w:'i',e:'w'}]),a=d.actors[0];a.g=new T.Group();a.x=a.z=0;d.actors[1].x=20;
 const scene=new T.Scene(),feedback=new CastingFeedback(scene),point=new T.Vector3(3,0,0);
 castWithPresentation({magic:d.magic,wards:d.wards,clearPath:()=>true,collides:()=>false,wallBlocks:()=>false},{sequence:seq,power:1},a,new T.Vector3(1,0,0),point);
 renderCastPresentation(a,feedback);assert.equal(feedback.bursts.length,1,seq);assert.equal(feedback.beams.length,seq.endsWith('t')?1:0,seq);
 if(seq.endsWith('t')){const before=feedback.beams[0].end.clone();point.x=8;feedback.update(.05);assert.deepEqual(feedback.beams[0].end,before);}
 feedback.update(.5);assert.equal(feedback.bursts.length,0);assert.equal(feedback.beams.length,0);feedback.clear();d.dispose();
 }
});
test('each rune has one thick solid outline and transparent-center glow',()=>{
 const ring=runeRing(),solid=ring.children.filter(m=>m.geometry.type==='TorusGeometry');assert.equal(solid.length,1);assert.ok(solid[0].geometry.parameters.tube*2>=.23);
 for(const m of ring.children.filter(m=>m.material.map)){const image=m.material.map.image;assert.equal(image.data[(128*256+128)*4+3],0);}
});
test('flash and beam originate ahead of the casting hand and follow the release pose',async()=>{
 const {castHandPoint}=await import('./dist/cast-presentation.mjs');const scene=new T.Scene(),feedback=new CastingFeedback(scene),hands={LeftHand:new T.Vector3(1,2,3),RightHand:new T.Vector3(4,2,3)},actor={x:0,z:0,g:{visible:true,userData:{puppet:{lastPositions:hands}}}},event={dir:new T.Vector3(1,0,0),origin:new T.Vector3(0,1,0),colors:['#ffffff'],tier:1,beamTarget:()=>({point:new T.Vector3(8,0,0),active:false})};
 assert.deepEqual(castHandPoint(actor,{...event,hand:'left'}).toArray(),[1.12,2,3]);actor.pendingCastLight=event;renderCastPresentation(actor,feedback);assert.deepEqual(feedback.bursts[0].group.position.toArray(),[4.12,2,3]);hands.RightHand.x=5;feedback.update(.02);assert.deepEqual(feedback.bursts[0].group.position.toArray(),[5.12,2,3]);assert.deepEqual(feedback.beams[0].start.toArray(),[5.12,2,3]);feedback.clear();
});
