import assert from 'node:assert/strict';
import * as T from './dist/three.module.js';
const listeners={};let data=null;
globalThis.localStorage={getItem:()=>data};globalThis.addEventListener=(type,fn)=>listeners[type]=fn;
const {MotionPuppet,demoMotion}=await import('./dist/motion-puppet.mjs');
const {JOINTS}=await import('./dist/pose-data.mjs');
const {root}=demoMotion();root.updateMatrixWorld(true);
const pose=Object.fromEntries(JOINTS.map(n=>[n,root.getObjectByName(n).getWorldPosition(new T.Vector3()).toArray()]));
const project={version:1,actions:[{name:'수정한 걷기',binding:'기본 걷기',frames:12,fps:12,keys:[{frame:0,ease:'hold',pose}]}]};
const puppet=new MotionPuppet(new T.Scene()),camera=new T.PerspectiveCamera();camera.position.set(4,4,4);camera.lookAt(0,1,0);
function publish(){data=JSON.stringify(project);listeners.storage({key:'ordinary-mage-pose-editor-v1'});puppet.render(camera);}
publish();assert.ok(Math.abs(puppet.lastPositions.Head.y-pose.Head[1])<1e-8);
pose.Head[1]+=.25;publish();assert.ok(Math.abs(puppet.lastPositions.Head.y-pose.Head[1])<1e-8);
project.actions[0].binding='마법 시전';puppet.magic.press();publish();assert.ok(Math.abs(puppet.lastPositions.Head.y-pose.Head[1])<1e-8);
data='{invalid';listeners.storage({key:'ordinary-mage-pose-editor-v1'});assert.doesNotThrow(()=>puppet.render(camera));
console.log('PASS: saved pose renders in game puppet, live storage updates, stable binding, magic override, invalid data fallback');
puppet.magic.reset();
const makeWalk=(y,updatedAt=0)=>({name:'기본 걷기',frames:12,fps:12,updatedAt,keys:[{frame:0,ease:'linear',pose:{...structuredClone(pose),Head:[0,y,0]}},{frame:6,ease:'linear',pose:{...structuredClone(pose),Head:[0,y+.6,0]}}]});
project.actions=[makeWalk(1),makeWalk(2)];puppet.time=0;publish();assert.equal(puppet.lastPositions.Head.y,2,'imported walking overrides earlier default');
puppet.update(.25);puppet.render(camera);assert.ok(Math.abs(puppet.lastPositions.Head.y-2.3)<1e-6,'saved walking advances while moving');
project.actions[0].updatedAt=100;puppet.time=0;publish();assert.equal(puppet.lastPositions.Head.y,1,'most recently edited walking wins even if earlier in list');
console.log('PASS: imported duplicate walking, moving playback and most recently saved selection');
const {ensureMagicClips,magicClipName}=await import('./dist/magic-clips.mjs');
project.actions=[{...makeWalk(1),name:'마법 시전'}];assert.equal(ensureMagicClips(project),true);assert.equal(ensureMagicClips(project),false);assert.equal(project.actions.length,7);
for(const stage of [1,2,3])for(const mode of ['hold','release']){
 const clip=project.actions.find(a=>a.binding===magicClipName(stage,mode));for(const k of clip.keys)k.pose.Head[1]=stage+(mode==='release'?.5:0);
 puppet.magic.reset();if(mode==='hold'){puppet.magic.press();puppet.magic.update(.01,stage);}else puppet.magic.release(stage);
 publish();assert.equal(puppet.lastPositions.Head.y,stage+(mode==='release'?.5:0));assert.equal(puppet.magic.phaseElapsed,mode==='hold'&&stage===1?.01:0);
}
puppet.magic.press();puppet.magic.update(.8,1);puppet.magic.update(.4,2);assert.equal(puppet.magic.phaseElapsed,0);
console.log('PASS: six independent magic clips, idempotent migration, per-ring pose selection and phase clock reset');

const legacy={actions:[{name:'3륜 충전',keys:[{frame:4,pose:{Head:[1,2,3]}}]},{name:'3륜 발사',binding:'3륜 발사',keys:[]}]};
const priorKeys=JSON.stringify(legacy.actions.map(a=>a.keys));assert.equal(ensureMagicClips(legacy),true);
assert.deepEqual(legacy.actions.map(a=>a.name),['2륜 복합 충전','2륜 복합 발사']);
assert.deepEqual(legacy.actions.map(a=>a.binding),['3륜 충전','3륜 발사']);assert.equal(JSON.stringify(legacy.actions.map(a=>a.keys)),priorKeys);assert.equal(ensureMagicClips(legacy),false);
