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
