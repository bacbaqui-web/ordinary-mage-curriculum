import {magicClipName} from './magic-clips.mjs';
import {savedMotion,savedPose} from './live-motions.mjs?v=cuff-pivot-1';
import * as T from './three.module.js';
import {MagicMotion} from './magic-motion.mjs';
import {actionClips} from './action-clips.mjs';
import {BVHLoader} from './vendor/BVHLoader.js';
import {GLTFLoader} from './vendor/GLTFLoader.js';
const names=['Hips','Spine','Head','LeftArm','LeftForeArm','LeftHand','RightArm','RightForeArm','RightHand','LeftUpLeg','LeftLeg','LeftFoot','RightUpLeg','RightLeg','RightFoot'];
const links=[['LeftFoot','LeftToe',.19,0x83bd69],['RightFoot','RightToe',.19,0x668fe2],['Spine','LeftArm',.19,0x57bdd3],['Spine','RightArm',.19,0x57bdd3],['Hips','LeftUpLeg',.25,0x57bdd3],['Hips','RightUpLeg',.25,0x57bdd3],['Hips','Spine',.38,0x57bdd3],['Spine','Head',.32,0x57bdd3],['LeftArm','LeftForeArm',.19,0xf28d61],['LeftForeArm','LeftHand',.17,0xf28d61],['RightArm','RightForeArm',.19,0xbf8de2],['RightForeArm','RightHand',.17,0xbf8de2],['LeftUpLeg','LeftLeg',.23,0x83bd69],['LeftLeg','LeftFoot',.2,0x83bd69],['RightUpLeg','RightLeg',.23,0x668fe2],['RightLeg','RightFoot',.2,0x668fe2]];
function material(color){return new T.MeshBasicMaterial({color,side:T.DoubleSide});}
function capsule(){const s=new T.Shape();s.moveTo(-.5,-.5);s.lineTo(-.5,.5);s.absarc(0,.5,.5,Math.PI,0,true);s.lineTo(.5,-.5);s.absarc(0,-.5,.5,0,-Math.PI,true);return new T.ShapeGeometry(s,10);}
export function demoMotion(){
 const root=new T.Group(),bones={};
 const add=(n,parent,x,y,z)=>{const b=new T.Bone();b.name=n;b.position.set(x,y,z);(bones[parent]||root).add(b);bones[n]=b;};
 add('Hips',null,0,1,0);add('Spine','Hips',0,.45,0);add('Neck','Spine',0,.228,0);add('Head','Neck',0,.172,0);
 for(const [side,x] of [['Left',-.36],['Right',.36]]){add(side+'Arm','Spine',x*2/3,0,0);add(side+'ForeArm',side+'Arm',0,-.32,0);add(side+'Hand',side+'ForeArm',0,-.32,0);add(side+'UpLeg','Hips',x*.45,-.08,0);add(side+'Leg',side+'UpLeg',0,-.4,0);add(side+'Foot',side+'Leg',0,-.4,.06);}
 const tracks=[],times=Array.from({length:33},(_,i)=>i/32);
 for(const [name,sign,amount,bend] of [['LeftUpLeg',1,.65,false],['RightUpLeg',-1,.65,false],['LeftArm',-1,.5,false],['RightArm',1,.5,false],['LeftLeg',-1,.8,true],['RightLeg',1,.8,true]]){const values=[];for(const t of times){let a=Math.sin(t*Math.PI*2)*sign*amount;if(bend)a=Math.max(0,a);values.push(...new T.Quaternion().setFromAxisAngle(new T.Vector3(1,0,0),a).toArray());}tracks.push(new T.QuaternionKeyframeTrack(name+'.quaternion',times,values));}
 return {root,clips:[new T.AnimationClip('기본 걷기',1,tracks),...actionClips(names)]};
}
export async function readMotion(file){
 const ext=file.name.split('.').pop().toLowerCase();
 if(ext==='bvh'){const r=new BVHLoader().parse(await file.text()),root=new T.Group();root.add(r.skeleton.bones[0]);return {root,clips:[r.clip]};}
 if(ext==='glb'||ext==='gltf'){const loader=new GLTFLoader();const r=await loader.parseAsync(ext==='gltf'?await file.text():await file.arrayBuffer(),'');if(!r.animations.length)throw Error('애니메이션이 없는 파일입니다. 동작이 포함된 GLB 또는 BVH를 선택하세요.');return {root:r.scene,clips:r.animations};}
 throw Error('GLB, glTF 또는 BVH 파일을 선택하세요. FBX는 Blender에서 GLB로 변환하세요.');
}
export class MotionPuppet{
 constructor(parent,motion=demoMotion()){
  this.group=new T.Group();parent.add(this.group);this.visual=new T.Group();this.group.add(this.visual);this.parts=[];
  for(const [a,b,w,c] of links){const mesh=new T.Mesh(capsule(),material(c));this.visual.add(mesh);this.parts.push({a,b,w,mesh});}
  this.head=new T.Mesh(new T.CircleGeometry(.235,24),material(0xffce65));this.visual.add(this.head);
  this.eyes=[-.085,.085].map(x=>{const m=new T.Mesh(new T.CircleGeometry(.025,8),material(0x25313b));m.userData.x=x;this.visual.add(m);return m;});
  this.magic=new MagicMotion();this.setMotion(motion);
 }
 setMotion({root,clips},mapping={}){
  const bones={};root.traverse(o=>{const key=o.name.replace(/^mixamorig[:_]?/i,'').replace(/[^a-z]/gi,'').toLowerCase();for(const n of names)if(key===n.toLowerCase())bones[n]=o;});
  for(const [n,name] of Object.entries(mapping))bones[n]=root.getObjectByName(name);
  const missing=names.filter(n=>!bones[n]);if(missing.length)throw Error('관절 연결이 필요합니다: '+missing.join(', '));
  if(this.mixer)this.mixer.stopAllAction();this.source=root;this.bones=bones;this.clips=clips;root.updateMatrixWorld(true);
  const hip=bones.Hips.getWorldPosition(new T.Vector3()),head=bones.Head.getWorldPosition(new T.Vector3());this.scale= .85/Math.max(.001,head.distanceTo(hip));
  this.mixer=new T.AnimationMixer(root);this.select(0);this.time=0;
 }
 select(i){this.selectedClip=i;this.mixer.stopAllAction();this.action=this.mixer.clipAction(this.clips[i]);this.action.play();this.time=0;}
 update(dt,{speed=1,charging=false,cast=0}={}){this.time+=dt*speed;this.mixer.setTime(this.time);this.source.updateMatrixWorld(true);this.charging=charging;this.cast=cast;}
 render(camera){
  this.group.updateWorldMatrix(true,false);camera.updateWorldMatrix(true,false);
  const positions={},hip=this.bones.Hips.getWorldPosition(new T.Vector3());
  for(const n of names)positions[n]=this.bones[n].getWorldPosition(new T.Vector3()).sub(hip).multiplyScalar(this.scale).add(new T.Vector3(0,1,0));
  positions.LeftToe=positions.LeftFoot.clone().add(new T.Vector3(0,0,.22));positions.RightToe=positions.RightFoot.clone().add(new T.Vector3(0,0,.22));
  if(this.magic.mode==='idle'&&(this.charging||this.cast>0)){positions.RightForeArm.copy(positions.RightArm).add(new T.Vector3(0,-.08,.31));positions.RightHand.copy(positions.RightForeArm).add(new T.Vector3(0,this.charging?.2:0,.3));}
  this.magic.apply(positions);
  const specific=this.magic.mode!=='idle'?magicClipName(this.magic.stage,this.magic.mode):null;
  const split=specific&&savedMotion(specific);
  const motionName=this.magic.mode!=='idle'?(split?specific:'마법 시전'):this.clips[this.selectedClip]?.name;
  const edited=savedPose(motionName,this.magic.mode!=='idle'?(split?this.magic.phaseElapsed:this.magic.elapsed):(this.editorActionTime??this.time),{loop:this.magic.mode==='idle'&&this.editorActionTime===undefined,hold:!split&&this.magic.mode==='hold'});
  if(edited){for(const [n,a] of Object.entries(edited))positions[n]=new T.Vector3(...a);positions.LeftToe=positions.LeftFoot.clone().add(new T.Vector3(0,0,.22));positions.RightToe=positions.RightFoot.clone().add(new T.Vector3(0,0,.22));}
  const magicClip=savedMotion(magicClipName(this.magic.stage,'release'))||savedMotion('마법 시전');this.magic.splitRelease=!!savedMotion(magicClipName(this.magic.stage,'release'));this.magic.releaseDuration=magicClip?Math.max(10/12,magicClip.frames/magicClip.fps):10/12;
  this.bodyFollow?.apply(positions,this.group);
  for(const n of Object.keys(positions))this.group.localToWorld(positions[n]);
  // Basic ice casts own the arm pose, after saved clips and body turning.
  if(this.icePose?.length){for(const side of ['Left','Right']){const shoulder=positions[side+'Arm'],elbow=positions[side+'ForeArm'],hand=positions[side+'Hand'];elbow.copy(shoulder).add(new T.Vector3(0,-.32,0));hand.copy(shoulder).add(new T.Vector3(0,-.64,0));const pose=this.icePose.find(p=>p.hand===side.toLowerCase());if(pose){const w=Math.max(0,Math.min(1,pose.weight));elbow.lerp(shoulder.clone().addScaledVector(pose.dir,.29).add(new T.Vector3(0,-.08,0)),w);const end=new T.Vector3().setFromMatrixPosition(this.group.matrixWorld).setY(pose.height??1.42).addScaledVector(pose.dir,pose.reach??.60);hand.lerp(end,w);}}}
  this.lastPositions=positions;
  const q=camera.getWorldQuaternion(new T.Quaternion()),iq=q.clone().invert(),gq=this.group.getWorldQuaternion(new T.Quaternion()).invert();
  for(const p of this.parts){const a=positions[p.a],b=positions[p.b],delta=a.clone().sub(b).applyQuaternion(iq),len=Math.hypot(delta.x,delta.y);p.mesh.position.copy(this.group.worldToLocal(a.clone().add(b).multiplyScalar(.5)));p.mesh.quaternion.copy(gq).multiply(q).multiply(new T.Quaternion().setFromAxisAngle(new T.Vector3(0,0,1),Math.atan2(-delta.x,delta.y)));p.mesh.scale.set(p.w,Math.max(.001,(len+p.w)*.5),1); // round end caps join adjacent segments
  }
  this.head.position.copy(this.group.worldToLocal(positions.Head.clone()));this.head.quaternion.copy(gq).multiply(q);
  const forward=this.bodyFollow?new T.Vector3(Math.sin(this.bodyFollow.head),0,Math.cos(this.bodyFollow.head)):new T.Vector3(0,0,1).transformDirection(this.group.matrixWorld),view=camera.getWorldPosition(new T.Vector3()).sub(positions.Head).normalize(),front=forward.dot(view);
  for(const eye of this.eyes){eye.visible=front>.12;const offset=new T.Vector3(eye.userData.x*Math.max(.25,front)+(this.bodyFollow?new T.Vector3(Math.sin(this.bodyFollow.head),0,Math.cos(this.bodyFollow.head)).applyQuaternion(iq).x*.09:0),.025,.012).applyQuaternion(q);eye.position.copy(this.group.worldToLocal(positions.Head.clone().add(offset)));eye.quaternion.copy(this.head.quaternion);}
 }
 dispose(){this.mixer.stopAllAction();this.group.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});this.group.removeFromParent();}
}
