import {BAG_POINTS,BAG_LABELS,bagHandles,moveBag} from './bag-controls.mjs?v=bag-free-length-1';
import {loopFrame} from './motion-timing.mjs';
import {normalizeMovement,readMovement} from './character-movement.mjs?v=turn-rates-1';
import {syncLoop,resizeLoop,loopEndpoint} from './pose-loop.mjs?v=bag-free-length-1';
import {ensureMobility,ensureLocomotion,ensureBasicAttacks,ensureIdle,ensureFirstRingClips,actionGroups} from './motion-catalog.mjs?v=ice-step-1';
import {migrateAnklePivot} from './ankle-pivot.mjs?v=heel-free-1';
import {CHARACTERS,characterProfile,motionStorageKey,projectForCharacter,assertCharacterImport} from './character-profiles.mjs?v=heel-free-1';
import {CharacterRig,fitProjectToRig} from './character-rig.mjs?v=bag-free-length-1';
import {ensureMagicClips} from './magic-clips.mjs?v=bag-translate-1';
import {uniqueMotions,mergeMotions} from './pose-library.mjs?v=ice-step-1';
import * as T from './three.module.js';
import {footFaces} from './foot-shape.mjs';
import {PassiveFoot} from './passive-foot.mjs';
const feet={LeftFoot:new PassiveFoot(),RightFoot:new PassiveFoot()};
let footShapes={};
import {moveJoint as movePoseJoint,applyFootLocks} from './pose-constraints.mjs?v=bag-free-length-1';
import {demoMotion} from './motion-puppet.mjs?v=ice-step-1';
import {JOINTS,LABELS,samplePose,validateProject} from './pose-data.mjs?v=bag-free-length-1';
const $=id=>document.getElementById(id);
const jointLabel=n=>BAG_LABELS[n]||LABELS[JOINTS.indexOf(n)];
const editableJoints=JOINTS.filter(n=>n!=='Neck');
const footAnchors=()=>Object.fromEntries(Object.keys(current().footLocks||{}).filter(n=>current().footLocks[n]).map(n=>[n,current().keys[0].pose[n]]));
const moveJoint=(base,joint,target)=>BAG_POINTS.includes(joint)?moveBag(base,joint,target):movePoseJoint(base,joint,target,{lockedFeet:footAnchors(),footClearance:rig?Math.max(rig.restPose.LeftFoot[1],rig.restPose.RightFoot[1]):.10});
let characterId='default',storage=motionStorageKey(characterId),rig=null,loading=false,unsaved=false;
const modelScene=new T.Scene();modelScene.add(new T.HemisphereLight(0xffffff,0x84919d,2.4));
const light=new T.DirectionalLight(0xffffff,2);light.position.set(-3,6,5);modelScene.add(light);
let modelRenderer=null;
function renderer(){if(!modelRenderer){modelRenderer=new T.WebGLRenderer({alpha:true,antialias:true});modelRenderer.setPixelRatio(1);modelRenderer.setClearColor(0,0);}return modelRenderer;}
function initial(){const {root,clips}=demoMotion(),mixer=new T.AnimationMixer(root);return {version:1,compactShoulders:true,actions:clips.map((clip,i)=>{mixer.stopAllAction();mixer.clipAction(clip).play();const locomotion=['달리기','걷기'].includes(clip.name),walk=clip.name==='걷기';const samples=locomotion?[[0,0],[3,clip.duration*.25],[6,clip.duration*.5],[9,clip.duration*.75],[12,clip.duration]]:i===4?[[0,.3],[1,1],[2,1.12],[6,1.12],[10,0]]:[[0,clip.tracks[0].times[1]],[1,clip.tracks[0].times[2]],[2,clip.tracks[0].times[i===1?4:3]],[6,clip.tracks[0].times[i===1?4:3]],[10,0]];return {name:clip.name,binding:clip.name,frames:walk?19:locomotion?13:12,fps:12,keys:samples.map(([frame,time],index)=>{mixer.setTime(time);root.updateMatrixWorld(true);const pose=Object.fromEntries(JOINTS.map(n=>[n,root.getObjectByName(n).getWorldPosition(new T.Vector3()).toArray()]));return {frame:walk?Math.round(frame*1.5):frame,ease:'smooth',pose};})};})};}
let project=initial(),index=0,frame=0,selected='LeftHand',playing=false,history=[],future=[];
try{const raw=localStorage.getItem(storage);if(raw)project=validateProject(JSON.parse(raw));}catch{$('status').textContent='저장한 동작을 읽지 못해 기본 동작을 열었습니다.';}
function compactShoulders(p){
 if(p.compactShoulders)return false;
 for(const action of p.actions)for(const key of action.keys)for(const side of ['Left','Right']){
  const pose=key.pose,shift=pose[side+'Arm'].map((n,i)=>(pose.Spine[i]-n)/3);
  for(const part of ['Arm','ForeArm','Hand'])pose[side+part]=pose[side+part].map((n,i)=>n+shift[i]);
 }
 p.compactShoulders=true;return true;
}
function prepare(p){
 p.movementSettings=normalizeMovement(p.movementSettings||readMovement(p.characterId||'default'));
 compactShoulders(p);
 for(const a of p.actions)if(!a.binding&&['기본 걷기','베기','주먹 타격','방어','마법 시전'].includes(a.name))a.binding=a.name;
 p.actions=uniqueMotions(p.actions);ensureMagicClips(p);ensureBasicAttacks(p);ensureFirstRingClips(p);ensureLocomotion(p);ensureMobility(p);ensureIdle(p);for(const a of p.actions)syncLoop(a);return p;
}
prepare(project);
const current=()=>project.actions[index],pose=()=>samplePose(current(),frame);
const editPoint=(p,n)=>bagHandles(p)[n]||p[n];
function seedBag(){if(!rig?.accessories?.has('ice-bag'))return;for(const a of project.actions)for(const k of a.keys)if(!k.pose.BagCenter||!k.pose.BagDirection||!k.pose.BagSide){rig.apply(k.pose);Object.assign(k.pose,rig.bagControls());}}
function save(message='브라우저에 저장됨'){seedBag();syncLoop(current(),frame);for(const action of project.actions)for(const key of action.keys)key.ease='smooth';current().updatedAt=Date.now();project.characterId=characterId;try{localStorage.setItem(storage,JSON.stringify(project));$('status').textContent=`${characterProfile(characterId).label} · ${message}`;unsaved=false;return true;}catch{unsaved=true;$('status').textContent='자동 저장 공간이 부족합니다. 파일 저장으로 보관하세요.';return false;}}
function checkpoint(){history.push(JSON.stringify({project,index,frame}));if(history.length>60)history.shift();future=[];}
function restore(s){const v=JSON.parse(s);project=v.project;index=v.index;frame=v.frame;playing=false;save();sync();}
function syncPlayButton(){const label=playing?'일시정지':'재생';$('play').textContent=playing?'⏸':'▶';$('play').setAttribute('aria-label',label);$('play').title=label;}
function stop(){playing=false;syncPlayButton();}
function key(){seedBag();let k=current().keys.find(k=>k.frame===frame);if(!k){k={frame,ease:'smooth',pose:pose()};current().keys.push(k);current().keys.sort((a,b)=>a.frame-b.frame);}return k;}
let keyDrag=null;
function finishKeyDrag(commit){
 const drag=keyDrag;if(!drag)return;keyDrag=null;
 if(drag.button.hasPointerCapture(drag.pointer))drag.button.releasePointerCapture(drag.pointer);
 if(commit&&drag.moved&&drag.destination!==drag.source&&current()===drag.action){
  checkpoint();const moved=structuredClone(drag.action.keys.find(k=>k.frame===drag.source));
  moved.frame=drag.destination;drag.action.keys=drag.action.keys.filter(k=>k.frame!==drag.source&&k.frame!==drag.destination);
  drag.action.keys.push(moved);drag.action.keys.sort((a,b)=>a.frame-b.frame);frame=drag.destination;save();sync();
  $('status').textContent=`${drag.source+1}프레임의 키를 ${frame+1}프레임으로 옮겼습니다.`;
 }else{sync();}
}
function bindKeyDrag(button,source){
 button.onpointerdown=e=>{
  if(loading||e.button!==0)return;stop();button.focus();
  keyDrag={button,pointer:e.pointerId,source,destination:source,startX:e.clientX,moved:false,action:current()};button.setPointerCapture(e.pointerId);
 };
 button.onpointermove=e=>{
  const drag=keyDrag;if(!drag||drag.button!==button)return;
  if(!drag.moved&&Math.abs(e.clientX-drag.startX)<5)return;drag.moved=true;
  const timeline=$('timelineScroll'),bounds=timeline.getBoundingClientRect();
  if(e.clientX<bounds.left+24)timeline.scrollLeft-=20;else if(e.clientX>bounds.right-24)timeline.scrollLeft+=20;
  const cells=[...$('timeline').children];let nearest=source,distance=Infinity;
  for(const cell of cells){const r=cell.getBoundingClientRect(),d=Math.abs(e.clientX-(r.left+r.width/2));if(d<distance){nearest=Number(cell.dataset.frame);distance=d;}}
  drag.destination=nearest;
  for(const cell of cells){cell.classList.toggle('drag-source',Number(cell.dataset.frame)===source);cell.classList.toggle('drop-target',Number(cell.dataset.frame)===nearest);}
  $('status').textContent=`${source+1} → ${nearest+1}프레임 · 놓으면 이동${drag.action.keys.some(k=>k.frame===nearest)&&nearest!==source?'하고 기존 키를 덮어씁니다.':'합니다.'}`;
 };
 button.onpointerup=e=>{if(!keyDrag||keyDrag.button!==button)return;if(keyDrag.moved){e.preventDefault();finishKeyDrag(true);}else{keyDrag=null;}};
 button.onpointercancel=()=>finishKeyDrag(false);
 button.onlostpointercapture=()=>{if(keyDrag?.button===button)finishKeyDrag(false);};
}
document.addEventListener('keydown',e=>{if(!keyDrag)return;if(e.key==='Escape'){e.preventDefault();finishKeyDrag(false);}else if(e.ctrlKey||e.metaKey||e.key==='Delete'||e.key==='Backspace'){e.preventDefault();e.stopImmediatePropagation();}},true);
window.addEventListener('blur',()=>finishKeyDrag(false));
function sync(){
 seedBag();
 $('timelineContent').style.setProperty('--frame-count',current().frames);$('timelineContent').style.setProperty('--timeline-width',(current().frames*48-4)+'px');
 const joints=[...editableJoints,...(rig?.accessories?.has('ice-bag')?BAG_POINTS:[])];if(!joints.includes(selected))selected='LeftHand';$('joint').replaceChildren(...joints.map(n=>new Option(jointLabel(n),n)));
 syncMovement();
 $('loopMotion').checked=!!current().loop;
 for(const side of ['Left','Right'])$('lock'+side+'Foot').checked=!!current().footLocks?.[side+'Foot'];
 const visible=actionGroups(project.actions).flatMap(g=>g.entries);if(visible.length&&!visible.some(e=>e.index===index)){index=visible[0].index;frame=0;stop();}
 $('action').replaceChildren(...actionGroups(project.actions).map(group=>{const el=document.createElement('optgroup');el.label=group.label;el.append(...group.entries.map(({action,index})=>new Option(action.name,index)));return el;}));$('action').value=index;$('frames').value=current().frames;$('fps').value=current().fps;$('joint').value=selected;
 $('scrub').max=current().frames-1;$('scrub').value=frame;
 const p=editPoint(pose(),selected);['x','y','z'].forEach((n,i)=>$(n).value=p[i].toFixed(3));
 syncPlayButton();
 $('timeline').replaceChildren(...Array.from({length:current().frames},(_,i)=>{const b=document.createElement('button');const has=current().keys.some(k=>k.frame===i);b.textContent=(has?'◆ ':'')+(i+1);b.className=(has?'key ':'')+(i===Math.floor(frame)?'selected':'');b.setAttribute('aria-label',`${i+1}프레임${has?' 키프레임':''}`);b.dataset.frame=i;b.onclick=()=>{if(loading)return;stop();frame=i;sync();};if(has&&!loopEndpoint(current(),i))bindKeyDrag(b,i);return b;}));alignScrub();
}
for(const side of ['Left','Right'])$('lock'+side+'Foot').onchange=()=>{
 stop();const foot=side+'Foot',enabled=$('lock'+foot).checked,locks={...current().footLocks};
 if(enabled)locks[foot]=true;else delete locks[foot];
 const anchors=footAnchors();if(enabled)anchors[foot]=[...pose()[foot]];else delete anchors[foot];
 const poses=current().keys.map(k=>applyFootLocks(k.pose,anchors,{align:enabled}));
 if(poses.some(p=>!p)){$('status').textContent='두 발에 닿을 수 없는 자세가 있습니다. 한쪽 발만 고정하거나 자세를 조정하세요.';sync();return;}
 checkpoint();current().footLocks=locks;current().keys.forEach((k,i)=>k.pose=poses[i]);save((side==='Left'?'왼발':'오른발')+(enabled?' 고정됨 · 동작 전체에 적용':' 고정 해제됨'));sync();
};
$('loopMotion').onchange=()=>{stop();checkpoint();current().loop=$('loopMotion').checked;syncLoop(current());save(current().loop?'반복 동작 설정됨 · 첫 프레임과 끝 프레임이 함께 바뀝니다.':'반복 동작 해제됨');sync();};
const movementFields={baseMoveSpeed:'moveSpeed',headSpeed:'headSpeed',chestSpeed:'chestSpeed',pelvisSpeed:'pelvisSpeed'};
function syncMovement(){const settings=normalizeMovement(project.movementSettings);for(const [id,key] of Object.entries(movementFields)){$(id).value=settings[key];$(id+'Value').textContent=key==='moveSpeed'?settings[key].toFixed(1)+'배':settings[key]===0?'즉시':settings[key]+'°/초';}}
for(const [id,key] of Object.entries(movementFields)){$(id).oninput=()=>{$(id+'Value').textContent=key==='moveSpeed'?Number($(id).value).toFixed(1)+'배':Number($(id).value)===0?'즉시':$(id).value+'°/초';};$(id).onchange=()=>{checkpoint();project.movementSettings=normalizeMovement({...project.movementSettings,[key]:Number($(id).value)});save('캐릭터 이동 설정 저장됨');syncMovement();};}
$('resetMovement').onclick=()=>{checkpoint();project.movementSettings=normalizeMovement();save('이동 설정 초기화됨');syncMovement();};
$('joint').replaceChildren(...editableJoints.map(n=>new Option(LABELS[JOINTS.indexOf(n)],n)));$('joint').onchange=()=>{selected=$('joint').value;sync();};
$('action').onchange=()=>{stop();index=Number($('action').value);frame=0;sync();};
for(const [i,n] of ['x','y','z'].entries()){
 const input=$(n);let drag=null;
 input.title='좌우로 드래그하여 조절';
 input.onchange=()=>{if(drag?.moved)return;const value=Number(input.value);if(value===Number(editPoint(pose(),selected)[i].toFixed(3)))return;if(!Number.isFinite(value)||Math.abs(value)>10){sync();return;}stop();frame=Math.floor(frame);checkpoint();const k=key(),target=[...editPoint(k.pose,selected)];target[i]=value;k.pose=moveJoint(k.pose,selected,target);save();sync();};
 input.onpointerdown=e=>{if(loading||e.button!==0)return;drag={pointer:e.pointerId,x:e.clientX,moved:false};};
 input.onpointermove=e=>{
  if(!drag)return;const dx=e.clientX-drag.x;
  if(!drag.moved){if(Math.abs(dx)<4)return;stop();frame=Math.floor(frame);checkpoint();drag.moved=true;drag.key=key();drag.base=structuredClone(drag.key.pose);drag.target=[...editPoint(drag.base,selected)];input.setPointerCapture(drag.pointer);input.classList.add('scrubbing');}
  e.preventDefault();const target=[...drag.target];target[i]=T.MathUtils.clamp(target[i]+dx*.005,-10,10);
  drag.key.pose=moveJoint(BAG_POINTS.includes(selected)?drag.key.pose:drag.base,selected,target);syncLoop(current(),frame);sync();
 };
 const finish=()=>{if(!drag)return;const changed=drag.moved,pointer=drag.pointer;if(changed){input.blur();save();}drag=null;input.classList.remove('scrubbing');if(input.hasPointerCapture(pointer))input.releasePointerCapture(pointer);};
 input.onpointerup=finish;input.onpointercancel=finish;input.onlostpointercapture=finish;
 input.onpointerleave=()=>{if(drag&&!drag.moved)drag=null;};
}
function deleteKey(){if(loopEndpoint(current(),frame))return;if(playing||!current().keys.some(k=>k.frame===frame))return;if(current().keys.length===1){$('status').textContent='키프레임은 하나 이상 있어야 합니다.';return;}checkpoint();current().keys=current().keys.filter(k=>k.frame!==frame);save();sync();$('status').textContent=`${frame+1}프레임의 키프레임을 삭제했습니다.`;};
$('frames').onchange=()=>{const n=Number($('frames').value);if(!Number.isInteger(n)||n<2||n>240){sync();return;}const candidate=structuredClone(current());if(!resizeLoop(candidate,n)){$('status').textContent='뒤쪽 키프레임을 먼저 옮기거나 삭제하세요.';$('frames').value=current().frames;return;}stop();checkpoint();Object.assign(current(),candidate);frame=0;save();sync();};
$('fps').onchange=()=>{const n=Number($('fps').value);if(n<1||n>60||!Number.isFinite(n)){sync();return;}checkpoint();current().fps=n;save();};
function alignScrub(){const cell=$('timeline').firstElementChild;if(cell)$('timelineContent').style.setProperty('--scrub-inset',(cell.getBoundingClientRect().width/2-8)+'px');}
new ResizeObserver(alignScrub).observe($('timelineContent'));
function syncPlayback(){
 const index=Math.floor(frame);$('scrub').value=index;
 for(const cell of $('timeline').children)cell.classList.toggle('selected',Number(cell.dataset.frame)===index);
 if(playing){const cell=$('timeline').children[index],scroll=$('timelineScroll');if(cell){const x=cell.offsetLeft-$('timeline').children[0].offsetLeft;if(x<scroll.scrollLeft)scroll.scrollLeft=x;else if(x+cell.offsetWidth>scroll.scrollLeft+scroll.clientWidth)scroll.scrollLeft=x+cell.offsetWidth-scroll.clientWidth;}}
}
$('scrub').oninput=()=>{stop();frame=Number($('scrub').value);sync();};
$('play').onclick=()=>{playing=!playing;sync();};$('previous').onclick=()=>{stop();frame=current().keys.filter(k=>k.frame<frame).at(-1)?.frame??0;sync();};$('next').onclick=()=>{stop();frame=current().keys.find(k=>k.frame>frame)?.frame??current().frames-1;sync();};
function undo(){if(!history.length)return;future.push(JSON.stringify({project,index,frame}));restore(history.pop());};function redo(){if(!future.length)return;history.push(JSON.stringify({project,index,frame}));restore(future.pop());};
let copiedKey=null;
const editingText=e=>e.target.matches('input,textarea,[contenteditable=true]');
function copyKey(){if(loading)return false;const source=current().keys.find(k=>k.frame===Math.floor(frame));if(!source){$('status').textContent='복사할 키프레임을 먼저 선택하세요.';return false;}copiedKey=structuredClone(source);$('status').textContent=`${source.frame+1}프레임 자세를 복사했습니다.`;return true;}
function pasteKey(){if(loading||!copiedKey)return;stop();frame=Math.floor(frame);checkpoint();const pasted=structuredClone(copiedKey);pasted.frame=frame;const pinned=applyFootLocks(pasted.pose,footAnchors(),{align:true});if(!pinned){$('status').textContent='고정한 발에 닿지 않는 자세입니다. 발 고정을 풀고 붙여넣으세요.';return;}pasted.pose=pinned;const existing=current().keys.findIndex(k=>k.frame===frame);if(existing>=0)current().keys[existing]=pasted;else current().keys.push(pasted);current().keys.sort((a,b)=>a.frame-b.frame);save();sync();$('status').textContent=`${frame+1}프레임에 붙여넣었습니다.`;}
document.addEventListener('copy',e=>{if(editingText(e)||!copyKey())return;e.preventDefault();e.clipboardData?.setData('text/plain',JSON.stringify({type:'ordinary-mage-keyframe',key:copiedKey}));});
document.addEventListener('paste',e=>{if(editingText(e))return;if(copiedKey){e.preventDefault();pasteKey();}});
$('saveMotion').onclick=()=>{
 const active=document.activeElement;if(active?.matches('input,textarea'))active.blur();
 save(`${current().name} 동작을 브라우저에 저장했습니다.`);
};
document.addEventListener('keydown',e=>{
 if(loading)return;
 if((e.ctrlKey||e.metaKey)&&!e.altKey&&e.key.toLowerCase()==='s'){e.preventDefault();$('saveMotion').click();return;}
 if(editingText(e))return;
 if((e.key==='Delete'||e.key==='Backspace')&&!e.ctrlKey&&!e.metaKey&&!e.altKey){e.preventDefault();if(!e.repeat)deleteKey();return;}
 if(!(e.ctrlKey||e.metaKey)||e.altKey)return;
 const command=e.key.toLowerCase();
 if(command==='c'){e.preventDefault();copyKey();}
 else if(command==='v'){if(copiedKey){e.preventDefault();pasteKey();}}
 else if(command==='z'||command==='y'){e.preventDefault();(command==='y'||e.shiftKey?redo:undo)();}
});
$('export').onclick=()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(projectForCharacter(project,characterId),null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download=`ordinary-mage-${characterId}-motions.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
$('import').onchange=async()=>{try{const file=$('import').files[0];if(!file)return;if(file.size>10*1024*1024)throw Error('10MB 이하의 동작 파일을 선택하세요.');const targetId=characterId;const incoming=validateProject(JSON.parse(await file.text()));if(targetId!==characterId)throw Error('캐릭터가 바뀌었습니다. 파일을 다시 선택하세요.');assertCharacterImport(incoming,characterId);compactShoulders(incoming);ensureMagicClips(incoming);ensureBasicAttacks(incoming);ensureFirstRingClips(incoming);ensureLocomotion(incoming);ensureMobility(incoming);if(rig&&!incoming.rigVersion){const fitted=fitProjectToRig(incoming,rig.restPose,defaultRest());incoming.actions=fitted.actions;incoming.rigVersion=7;}if(rig)migrateAnklePivot(incoming,rig.ankleLift,rig.ankleBack);incoming.actions=uniqueMotions(incoming.actions);for(const a of incoming.actions)a.updatedAt=Date.now();const merged=mergeMotions(project.actions,incoming.actions);if(merged.length>100)throw Error('동작은 최대 100개까지 보관할 수 있습니다.');checkpoint();if(incoming.movementSettings)project.movementSettings=normalizeMovement(incoming.movementSettings);project.actions=merged;index=Math.max(0,project.actions.indexOf(incoming.actions[0]));frame=0;stop();save();sync();}catch(e){$('status').textContent='불러오지 못했습니다. '+e.message;}};
function defaultRest(){const {root}=demoMotion();root.updateMatrixWorld(true);return Object.fromEntries(JOINTS.map(n=>[n,root.getObjectByName(n).getWorldPosition(new T.Vector3()).toArray()]));}
function setBusy(value){loading=value;$('motionControls').disabled=value;for(const id of ['export','import','saveMotion','play','previous','next','frames','fps','scrub','character','loopMotion'])$(id).disabled=value;}
async function selectCharacter(id){
 if(loading)return;
 document.activeElement?.blur();if(keyDrag)finishKeyDrag(true);stop();
 if(unsaved&&!save()){$('character').value=characterId;return;}
 const profile=characterProfile(id),nextKey=motionStorageKey(profile.id);setBusy(true);$('status').textContent='캐릭터를 여는 중입니다…';
 let nextRig=null;
 try{
  const raw=localStorage.getItem(nextKey);let next=raw?validateProject(JSON.parse(raw)):projectForCharacter(initial(),profile.id);
  assertCharacterImport(next,profile.id);prepare(next);
  if(profile.model){nextRig=await CharacterRig.load(profile.model,profile.accessories,profile.garment,profile.ankleLift,profile.ankleBack);renderer();if(!next.rigVersion)next=fitProjectToRig(next,nextRig.restPose,defaultRest());else if(migrateAnklePivot(next,nextRig.ankleLift,nextRig.ankleBack)&&raw){localStorage.setItem(nextKey+':before-ankle-pivot-7',raw);}}
  next.characterId=profile.id;
  // A failed model load or storage write must not replace the current editor session.
  if(!raw||profile.id!=='default')localStorage.setItem(nextKey,JSON.stringify(next));
  rig?.dispose();rig=nextRig;if(rig)modelScene.add(rig.group);
  characterId=profile.id;storage=nextKey;project=next;index=0;frame=0;history=[];future=[];copiedKey=null;footShapes={};
  for(const n of Object.keys(feet))feet[n]=new PassiveFoot();
  try{localStorage.setItem('ordinary-mage-editor-character',characterId);}catch{}
  $('character').value=characterId;$('import').value='';
  $('status').textContent='';
  $('labLink').href='character-lab.html?v=ice-step-1&character='+characterId;
  const url=new URL(location.href);url.searchParams.set('character',characterId);window.history.replaceState(null,'',url);
  $('status').textContent=`${profile.label} 동작을 열었습니다. 이 캐릭터에만 저장됩니다.`;sync();
 }catch(e){nextRig?.dispose();$('character').value=characterId;$('status').textContent=e.message;}
 finally{setBusy(false);}
}
$('character').replaceChildren(...CHARACTERS.map(c=>new Option(c.label,c.id)));
$('character').onchange=()=>void selectCharacter($('character').value);
const segments=[['Hips','Spine',.36,'#55b9cd'],['Spine','Neck',.28,'#55b9cd'],['Neck','Head',.16,'#55b9cd'],['Spine','LeftArm',.18,'#55b9cd'],['Spine','RightArm',.18,'#55b9cd'],['LeftArm','LeftForeArm',.19,'#f18d65'],['LeftForeArm','LeftHand',.17,'#f18d65'],['RightArm','RightForeArm',.19,'#bb8bdd'],['RightForeArm','RightHand',.17,'#bb8bdd'],['Hips','LeftUpLeg',.23,'#55b9cd'],['Hips','RightUpLeg',.23,'#55b9cd'],['LeftUpLeg','LeftLeg',.22,'#86ba6d'],['LeftLeg','LeftFoot',.20,'#86ba6d'],['RightUpLeg','RightLeg',.22,'#688ee1'],['RightLeg','RightFoot',.20,'#688ee1']];
const views=[['앞',[0,0,6]],['옆',[6,0,0]],['위',[0,6,0]],['쿼터뷰',[5,4,6]]].map(([name,dir])=>{
 const box=document.createElement('div');box.className='view';const title=document.createElement('h2');title.textContent=name;const canvas=document.createElement('canvas');canvas.setAttribute('aria-label',name+' 관절 편집');canvas.tabIndex=0;box.append(title,canvas);$('views').append(box);
 const camera=new T.OrthographicCamera(-2,2,2,-2,.1,100);camera.position.set(dir[0],dir[1]+1,dir[2]);if(name==='위')camera.up.set(0,0,-1);camera.lookAt(0,1,0);camera.updateMatrixWorld();const right=new T.Vector3(1,0,0).applyQuaternion(camera.quaternion),up=new T.Vector3(0,1,0).applyQuaternion(camera.quaternion);const v={canvas,camera,right,up,points:{},scale:1,zoom:1};
 const orbit=name==='쿼터뷰',radius=Math.hypot(...dir),initialYaw=Math.atan2(dir[0],dir[2]),initialPitch=Math.asin(dir[1]/radius);
 let yaw=initialYaw,pitch=initialPitch,drag=null;
 const orient=()=>{camera.position.set(radius*Math.cos(pitch)*Math.sin(yaw),1+radius*Math.sin(pitch),radius*Math.cos(pitch)*Math.cos(yaw));camera.lookAt(0,1,0);camera.updateMatrixWorld();right.set(1,0,0).applyQuaternion(camera.quaternion);up.set(0,1,0).applyQuaternion(camera.quaternion);};
 canvas.style.touchAction='none';
 canvas.addEventListener('wheel',e=>{e.preventDefault();const delta=e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?canvas.clientHeight:1);v.zoom=T.MathUtils.clamp(v.zoom*Math.exp(-delta*.0015),.4,3);},{passive:false});
 if(orbit){title.textContent='쿼터뷰 · 빈 곳을 끌어 회전';const reset=document.createElement('button');reset.textContent='시점 초기화';reset.className='view-reset';reset.onclick=()=>{yaw=initialYaw;pitch=initialPitch;orient();};box.append(reset);canvas.oncontextmenu=e=>e.preventDefault();}
 canvas.onpointerdown=e=>{if(loading)return;const r=canvas.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;const nearest=Object.entries(v.points).filter(([n])=>n!=='Neck').map(([n,p])=>({n,d:Math.hypot(p.x-x,p.y-y)})).sort((a,b)=>a.d-b.d)[0];if(orbit&&(e.button===2||!$('handles').checked||!nearest||nearest.d>18)){drag={orbit:true,x:e.clientX,y:e.clientY,yaw,pitch};canvas.setPointerCapture(e.pointerId);e.preventDefault();return;}if(!$('handles').checked||!nearest||nearest.d>18)return;stop();frame=Math.floor(frame);selected=nearest.n;canvas.focus();checkpoint();const k=key();drag={x:e.clientX,y:e.clientY,start:[...editPoint(k.pose,selected)],base:structuredClone(k.pose),k};canvas.setPointerCapture(e.pointerId);sync();};
 canvas.onpointermove=e=>{if(!drag)return;if(drag.orbit){yaw=drag.yaw-(e.clientX-drag.x)*.008;pitch=T.MathUtils.clamp(drag.pitch+(e.clientY-drag.y)*.008,-1.35,1.35);orient();return;}const dx=(e.clientX-drag.x)/v.scale,dy=-(e.clientY-drag.y)/v.scale,p=new T.Vector3(...drag.start).addScaledVector(right,dx).addScaledVector(up,dy);drag.k.pose=moveJoint(BAG_POINTS.includes(selected)?drag.k.pose:drag.base,selected,p.toArray());syncLoop(current(),frame);sync();};
 canvas.onpointerup=()=>{if(drag){const changed=!drag.orbit;drag=null;if(changed)save();}};canvas.onpointercancel=()=>{const changed=drag&&!drag.orbit;drag=null;if(changed)save();};return v;
});
function draw(v,p){const {canvas,camera}=v,w=Math.round(canvas.clientWidth),h=Math.round(canvas.clientHeight);if(!w||!h)return;if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}const ctx=canvas.getContext('2d'),scale=h/3.1*v.zoom;v.scale=scale;const point=a=>{const local=new T.Vector3(...a).applyMatrix4(camera.matrixWorldInverse);return {x:w/2+local.x*scale,y:h/2-local.y*scale,z:local.z};};const controlPose=rig?rig.controlPose(p):p;v.points=Object.fromEntries([...JOINTS,...BAG_POINTS.filter(n=>controlPose[n])].map(n=>[n,point(controlPose[n])]));ctx.fillStyle='#2b3c44';ctx.fillRect(0,0,w,h);ctx.strokeStyle='#354a52';ctx.lineWidth=1;const spacing=scale*.25;for(let x=w/2%spacing;x<w;x+=spacing){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.stroke();}for(let y=h/2%spacing;y<h;y+=spacing){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke();}
 // Shared world-space floor: Y=0 in every camera.
 const floor=[[-4,0,-4],[4,0,-4],[4,0,4],[-4,0,4]].map(point);
 ctx.beginPath();floor.forEach((a,i)=>i?ctx.lineTo(a.x,a.y):ctx.moveTo(a.x,a.y));ctx.closePath();ctx.fillStyle='#344b49';ctx.fill();
 const groundLine=(a,b,color,width=1)=>{a=point(a);b=point(b);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();};
 for(let i=-8;i<=8;i++){const n=i*.5;groundLine([n,0,-4],[n,0,4],'#4a6660');groundLine([-4,0,n],[4,0,n],'#4a6660');}
 groundLine([-4,0,0],[4,0,0],'#91aa83',2);groundLine([0,0,-4],[0,0,4],'#91aa83',2);
 const origin=point([0,0,0]);ctx.font='11px system-ui';ctx.fillStyle='#d1dfc3';ctx.fillText('바닥 · Y=0',origin.x+8,origin.y-8);
 if(rig){camera.left=-w/(2*scale);camera.right=w/(2*scale);camera.top=h/(2*scale);camera.bottom=-h/(2*scale);camera.updateProjectionMatrix();const r=renderer();r.setSize(w,h,false);r.render(modelScene,camera);ctx.drawImage(r.domElement,0,0,w,h);}
 else {const shapes=segments.map(([a,b,width,color])=>({a:v.points[a],b:v.points[b],width:width*scale,color,z:(v.points[a].z+v.points[b].z)/2}));for(const [n,foot] of Object.entries(footShapes))for(const face of footFaces(foot)){const polygon=face.vertices.map(point),rgb=n==='LeftFoot'?[177,220,145]:[149,182,255];shapes.push({polygon,color:`rgb(${rgb.map(c=>Math.round(c*face.shade)).join(',')})`,z:polygon.reduce((sum,a)=>sum+a.z,0)/polygon.length});}shapes.push({head:true,a:v.points.Head,width:.43*scale,color:'#ffcc65',z:v.points.Head.z});shapes.sort((a,b)=>a.z-b.z);ctx.lineCap='round';for(const s of shapes){ctx.fillStyle=ctx.strokeStyle=s.color;if(s.polygon){ctx.beginPath();s.polygon.forEach((a,i)=>i?ctx.lineTo(a.x,a.y):ctx.moveTo(a.x,a.y));ctx.closePath();ctx.fill();ctx.lineWidth=.6;ctx.stroke();}else if(s.head){ctx.beginPath();ctx.arc(s.a.x,s.a.y,s.width/2,0,Math.PI*2);ctx.fill();}else{ctx.lineWidth=s.width;ctx.beginPath();ctx.moveTo(s.a.x,s.a.y);ctx.lineTo(s.b.x,s.b.y);ctx.stroke();}}
 }
 if($('handles').checked){
  const links=segments.filter(([a,b])=>a!=='Neck'&&b!=='Neck').map(([a,b])=>[a,b]);links.push(['Spine','Head']);if(v.points.BagCenter)links.push(['BagCenter','BagDirection']);
  ctx.lineCap='round';for(const [from,to] of links){const a=v.points[from],b=v.points[to];ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.strokeStyle='#12232dcc';ctx.lineWidth=4;ctx.stroke();ctx.strokeStyle=from===selected||to===selected?'#ffd37c':'#d9eaf0';ctx.lineWidth=1.5;ctx.stroke();}
  for(const [n,a] of Object.entries(v.points).filter(([n])=>n!=='Neck')){ctx.beginPath();ctx.arc(a.x,a.y,n===selected?7:4,0,Math.PI*2);ctx.fillStyle=n===selected?'#fff1bd':'#17282f';ctx.fill();ctx.lineWidth=1.5;ctx.strokeStyle=n===selected?'#e7aa42':'#e7eff0';ctx.stroke();}const a=v.points[selected];ctx.font='12px system-ui';ctx.fillStyle='#fff1bd';ctx.fillText(jointLabel(selected),a.x+10,a.y-10);}
}
let last=performance.now();function tick(now){requestAnimationFrame(tick);const dt=Math.min(.05,(now-last)/1000);last=now;if(playing){frame=loopFrame(current(),frame+dt*current().fps);syncPlayback();}const p=pose();if(rig)rig.apply(p,dt);for(const n of Object.keys(feet))footShapes[n]=feet[n].update(p[n],dt);for(const v of views)draw(v,p);}sync();requestAnimationFrame(tick);

let wanted=new URLSearchParams(location.search).get('character');try{wanted ||= localStorage.getItem('ordinary-mage-editor-character');}catch{}if(wanted&&wanted!=='default')void selectCharacter(wanted);
