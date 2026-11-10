import assert from 'node:assert/strict';
import * as T from './dist/three.module.js';
const listeners={};let data=null;
globalThis.localStorage={getItem:()=>data};globalThis.addEventListener=(type,fn)=>listeners[type]=fn;
const {MotionPuppet,demoMotion}=await import('./dist/motion-puppet.mjs');
const {JOINTS,samplePose}=await import('./dist/pose-data.mjs');
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

// Actual game wizard instances use independent character motion stores.
const {createWizard,projectWizard}=await import('./dist/wizard.mjs');
const {motionStorageKey}=await import('./dist/character-profiles.mjs');
const stores=new Map();globalThis.localStorage={getItem:key=>stores.get(key)||null};
const put=(id,y)=>stores.set(motionStorageKey(id),JSON.stringify({version:1,rigVersion:7,characterId:id,actions:[makeWalk(y)]}));
put('default',1.4);put('ice',2.1);put('fire',1.7);
const gameScene=new T.Scene(),iceWizard=createWizard(gameScene,0,0),fireWizard=createWizard(gameScene,0,0);
iceWizard.userData.puppet.setMotionCharacter('ice');fireWizard.userData.puppet.setMotionCharacter('fire');
projectWizard(iceWizard,camera);projectWizard(fireWizard,camera);
assert.equal(iceWizard.userData.puppet.lastPositions.Head.y,2.1);
assert.equal(fireWizard.userData.puppet.lastPositions.Head.y,1.7);
put('ice',2.4);projectWizard(iceWizard,camera);projectWizard(fireWizard,camera);
assert.equal(iceWizard.userData.puppet.lastPositions.Head.y,2.4,'newly saved pose is read without focus or reload');
assert.equal(fireWizard.userData.puppet.lastPositions.Head.y,1.7,'other actor is unaffected');
iceWizard.userData.puppet.setMotionCharacter('earth');projectWizard(iceWizard,camera);
assert.equal(iceWizard.userData.puppet.lastPositions.Head.y,1.4,'characters without saved clips retain default motions');
console.log('PASS: game wizard uses selected character, live saves apply, actors remain isolated, legacy fallback works');

const left={...makeWalk(2.2,100),name:'좌클릭 기본 공격'},right={...makeWalk(2.6,100),name:'우클릭 기본 공격'};
stores.set(motionStorageKey('ice'),JSON.stringify({version:1,rigVersion:7,actions:[makeWalk(1.5),left,right]}));
iceWizard.userData.puppet.setMotionCharacter('ice');
for(const [hand,height] of [['left',2.2],['right',2.6]]){
 const p=iceWizard.userData.puppet;p.playBasicAttack(hand);p.icePose=[{hand,dir:new T.Vector3(0,0,1),weight:1}];projectWizard(iceWizard,camera);
 assert.equal(p.lastPositions.Head.y,height,'left/right authored basic attack is selected');
 assert.deepEqual(p.lastPositions.LeftHand.toArray(),left.keys[0].pose.LeftHand,'procedural arm pose must not overwrite saved basic attack');
 p.update(2);projectWizard(iceWizard,camera);assert.equal(p.basicAttack,null,'attack ends instead of looping');
}
console.log('PASS: left/right basic attack clips play separately, survive procedural arm override, and end');

const {animateWizard}=await import('./dist/wizard.mjs');
const idle={...makeWalk(2.3,101),name:'대기',binding:'대기'};
stores.set(motionStorageKey('ice'),JSON.stringify({version:1,rigVersion:7,actions:[makeWalk(1.5),idle,left]}));
animateWizard(iceWizard,0,{speed:0});projectWizard(iceWizard,camera);
assert.equal(iceWizard.userData.puppet.lastPositions.Head.y,2.3,'standing uses saved idle');
animateWizard(iceWizard,0,{speed:4.4});projectWizard(iceWizard,camera);
assert.equal(iceWizard.userData.puppet.lastPositions.Head.y,1.5,'moving returns to saved walk');
animateWizard(iceWizard,0,{speed:0});iceWizard.userData.puppet.playBasicAttack('left');projectWizard(iceWizard,camera);
assert.equal(iceWizard.userData.puppet.lastPositions.Head.y,2.2,'attack overrides idle');
console.log('PASS: saved idle in actual game, walking transition, attack priority');

stores.set(motionStorageKey('ice'),JSON.stringify({version:1,rigVersion:7,actions:[makeWalk(1.5),left,right]}));
for(const [hand,clip] of [['left',left],['right',right]]){
 const p=iceWizard.userData.puppet;p.chargeHand=hand;p.chargeUsesIce=true;p.magic.press();p.magic.update(.4,1);projectWizard(iceWizard,camera);
 const held=samplePose(clip,Math.min(clip.frames-1,p.magic.phaseElapsed*clip.fps));
 assert.deepEqual(p.lastPositions.Head.toArray(),held.Head,'first ring plays the matching charge clip');
 assert.deepEqual(p.lastPositions.LeftHand.toArray(),held.LeftHand,'charge arm correction preserves authored cast pose');
 p.magic.reset();
}
console.log('PASS: left and right first-ring charge play the matching charge clip');

// Real game transitions begin at the last displayed pose, including interrupted blends.
stores.set(motionStorageKey('ice'),JSON.stringify({version:1,rigVersion:7,actions:[makeWalk(1.5),idle,left,right]}));
const blendPuppet=iceWizard.userData.puppet;blendPuppet.magic.reset();blendPuppet.basicAttack=null;blendPuppet.icePose=[];
animateWizard(iceWizard,.016,{speed:0});projectWizard(iceWizard,camera);
const standing=blendPuppet.lastPositions.Head.clone();
animateWizard(iceWizard,.016,{speed:4.4});projectWizard(iceWizard,camera);
assert.ok(blendPuppet.lastPositions.Head.distanceTo(standing)<1e-8,'walk transition starts without a jump');
animateWizard(iceWizard,.09,{speed:4.4});projectWizard(iceWizard,camera);
const middle=blendPuppet.lastPositions.Head.clone();assert.ok(middle.distanceTo(standing)>0);
blendPuppet.playBasicAttack('right');animateWizard(iceWizard,.016,{speed:0});projectWizard(iceWizard,camera);
assert.ok(blendPuppet.lastPositions.Head.distanceTo(middle)<1e-8,'interrupted transition starts from rendered pose');
console.log('PASS: smooth standing/walking transition and interruption without snapping');

const {firstRingClip}=await import('./dist/motion-catalog.mjs');
const fourClips=['left','right'].flatMap((hand,i)=>['hold','release'].map((mode,j)=>({...makeWalk(3+i+j*.2,200),name:firstRingClip(hand,mode),binding:firstRingClip(hand,mode)})));
stores.set(motionStorageKey('ice'),JSON.stringify({version:1,rigVersion:7,actions:[makeWalk(1.5),...fourClips]}));
blendPuppet.blendTransitions=false;
for(const hand of ['left','right']){
 blendPuppet.magic.reset();blendPuppet.chargeHand=hand;blendPuppet.magic.press();blendPuppet.magic.update(2,1);projectWizard(iceWizard,camera);
 const chargeClip=fourClips.find(c=>c.name===firstRingClip(hand,'hold'));
 assert.deepEqual(blendPuppet.lastPositions.Head.toArray(),samplePose(chargeClip,chargeClip.frames-1).Head,'charge ends in a held final pose');
 blendPuppet.magic.reset();blendPuppet.playBasicAttack(hand);projectWizard(iceWizard,camera);
 const releaseClip=fourClips.find(c=>c.name===firstRingClip(hand,'release'));
 assert.deepEqual(blendPuppet.lastPositions.Head.toArray(),samplePose(releaseClip,0).Head,'release starts the separate hand-specific cast');
}
console.log('PASS: four independent first-ring clips, charge final hold, hand-specific release');

// The game must sample the same authored joints as the editor, even with a spell arm overlay.
for(const stage of [1,2,3])for(const mode of ['hold','release']){
 const name=stage===1?firstRingClip('left',mode):`${stage}륜 ${mode==='hold'?'충전':'발사'}`;
 const clip={...makeWalk(2,400),name,binding:name};
 stores.set(motionStorageKey('ice'),JSON.stringify({version:1,rigVersion:7,actions:[clip]}));
 blendPuppet.magic.reset();blendPuppet.magic.mode=mode;blendPuppet.magic.stage=stage;blendPuppet.magic.phaseElapsed=.2;blendPuppet.magic.elapsed=.2;blendPuppet.basicAttack=null;blendPuppet.chargeHand='left';blendPuppet.bodyFollow=null;
 blendPuppet.icePose=[{hand:'right',dir:new T.Vector3(1,0,0),weight:1,reach:.6,height:1.42}];
 projectWizard(iceWizard,camera);
 const expected=samplePose(clip,.2*clip.fps);
 for(const n of JOINTS)assert.ok(blendPuppet.lastPositions[n].distanceTo(new T.Vector3(...expected[n]))<1e-8,`${name}: editor and game agree at ${n}`);
}
console.log('PASS: identical editor/game authored joints for all charge and release stages');
