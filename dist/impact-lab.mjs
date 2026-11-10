import * as T from './three.module.js';
import {GROUPS,FIELDS,DEFAULTS,NONE,STORAGE_KEY,normalize,timing as baseTiming,attackPose,hitPose,particleOffset,numberOffset} from './impact-settings.mjs';
import {createWizard,setWizardCharacter,animateWizard,projectWizard} from './wizard.mjs?v=ice-step-1';
import {IceBasic,ICE_BASIC} from './ice-basic.mjs?v=forward-glow-1';
import {GameAudio} from './game-audio.mjs?v=game-impact-1';
import {applyActorImpact} from './impact-feedback.mjs?v=game-impact-1';
const flightSeconds=3.6/ICE_BASIC.left.speed;
const timing=s=>baseTiming(s,flightSeconds);
const $=id=>document.getElementById(id);
let settings={...DEFAULTS},playing=true,time=0,soundEnabled=false,audio=null,last=performance.now(),lastSoundCycle=-1,cycle=0;
try{const raw=localStorage.getItem(STORAGE_KEY);if(raw){settings=normalize(JSON.parse(raw));$('preset').value='custom';}$('saveStatus').textContent='브라우저에 자동 저장';}catch{$('saveStatus').textContent='설정을 읽지 못해 기본값을 열었습니다.';}
const display=(v,unit)=>`${Number(v.toFixed(2))}${unit?' '+unit:''}`;
for(const group of GROUPS){const box=document.createElement('details');box.className='group';box.open=true;const summary=document.createElement('summary');summary.textContent=group.title;const desc=document.createElement('p');desc.textContent=group.description;summary.append(desc);box.append(summary);const fields=document.createElement('div');fields.className='fields';for(const [key,label,min,max,step,,unit,hint] of group.fields){const wrap=document.createElement('label');wrap.className='field';wrap.htmlFor=key;const heading=document.createElement('span');heading.className='field-head';const title=document.createElement('span');title.textContent=label;const output=document.createElement('output');output.id=key+'Value';output.htmlFor=key;heading.append(title,output);const input=document.createElement('input');Object.assign(input,{type:'range',id:key,min,max,step,value:settings[key]});const small=document.createElement('small');small.id=key+'Hint';small.textContent=hint;input.setAttribute('aria-describedby',small.id);input.addEventListener('input',()=>{settings[key]=Number(input.value);$('preset').value='custom';sync();save();});wrap.append(heading,input,small);fields.append(wrap);}box.append(fields);$('controls').append(box);}
function sync(){for(const [key,,,,,,unit] of FIELDS){$(key).value=settings[key];$(key+'Value').textContent=display(settings[key],unit);}time=Math.min(time,timing(settings).end);}
function save(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(settings));$('saveStatus').textContent='브라우저에 저장됨';}catch{$('saveStatus').textContent='저장하지 못했습니다. 설정 파일로 보관하세요.';}}
function restart(){time=0;cycle++;lastSoundCycle=-1;playing=true;updatePlay();}
function updatePlay(){$('play').textContent=playing?'일시정지':'재생';}
$('play').onclick=()=>{playing=!playing;updatePlay();};$('replay').onclick=restart;
$('scrub').oninput=()=>{playing=false;time=Number($('scrub').value)*timing(settings).end;updatePlay();};
$('preset').onchange=()=>{const p=$('preset').value;if(p==='custom')return;settings=normalize(p==='none'?NONE:p==='heavy'?{...DEFAULTS,anticipation:420,windup:28,recoil:.4,stretch:2.3,trail:1,flash:110,squash:.4,knockback:.85,particles:36,shake:.12,freeze:110,volume:55}:DEFAULTS);sync();save();restart();};
$('reset').onclick=()=>{settings={...DEFAULTS};$('preset').value='default';sync();save();restart();};
$('export').onclick=()=>{const url=URL.createObjectURL(new Blob([JSON.stringify({version:1,settings},null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='타격감-설정.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
$('sound').onclick=async()=>{try{if(!audio)audio=new GameAudio();audio.enabled=true;await audio.unlock();if(!audio.available||!audio.buffers.has('hit'))throw Error('audio');soundEnabled=!soundEnabled;$('sound').textContent=soundEnabled?'소리 끄기':'소리 켜기';$('sound').setAttribute('aria-pressed',String(soundEnabled));if(!soundEnabled)audio.stopAll();}catch{$('sound').textContent='소리를 불러오지 못했습니다. 다시 누르세요.';}};
function playHit(){if(soundEnabled&&audio&&settings.volume>0)audio.hit({x:0,z:0},{x:0,z:0},false,settings.volume/35);}
sync();
const scene=new T.Scene();scene.add(new T.HemisphereLight(0xe2efff,0x5a614c,2.3));const light=new T.DirectionalLight(0xffe4ba,3.2);light.position.set(-8,18,9);light.castShadow=true;light.shadow.mapSize.set(2048,2048);Object.assign(light.shadow.camera,{left:-12,right:12,top:12,bottom:-12});light.shadow.normalBias=.04;scene.add(light);
let renderer;try{renderer=new T.WebGLRenderer({canvas:$('scene'),alpha:true,antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setClearColor(0,0);renderer.outputColorSpace=T.SRGBColorSpace;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;}catch{$('canvasError').hidden=false;}
const camera=new T.PerspectiveCamera(38,1,.1,100),origin=new T.Vector3(12,17,15).multiplyScalar(.32),target=new T.Vector3(0,0,0);
function mesh(geometry,material,parent,x=0,y=0,z=0){const m=new T.Mesh(geometry,material);m.position.set(x,y,z);parent.add(m);return m;}
function actor(parent,id,x){const root=createWizard(parent,id==='ice'?0x394351:0x73899c,id==='ice'?0xe7b367:0xc2d6df);root.position.x=x;root.rotation.y=x<0?Math.PI/2:-Math.PI/2;const ready=setWizardCharacter(root,id);return {root,ready,id,dir:new T.Vector3(x<0?1:-1,0,0)};}
function poseActor(a,time,releaseAt){const g=a.root,u=g.userData,puppet=u.puppet,pre=time<releaseAt,post=Math.max(0,time-releaseAt);g.position.set(a.dir.x>0?-2:2,0,0);g.rotation.set(0,a.dir.x>0?Math.PI/2:-Math.PI/2,0);g.scale.set(1,1,1);u.body.rotation.set(0,0,0);puppet.blendTransitions=false;puppet.chargeHand='left';puppet.chargeUsesIce=a.id==='ice';
 puppet.magic.reset();puppet.basicAttack=null;animateWizard(g,0,{charging:pre,cast:pre?0:Math.max(0,1-post/.5)});
 if(pre){puppet.magic.mode='hold';puppet.magic.elapsed=time;puppet.magic.phaseElapsed=time;}
 else if(a.id==='ice'&&post<.8){puppet.playBasicAttack('left');puppet.basicAttack.time=post;puppet.magic.mode='release';puppet.magic.elapsed=post+2/12;puppet.magic.phaseElapsed=post;}
 puppet.icePose=a.id==='ice'?[{hand:'left',dir:a.dir,weight:pre?Math.min(1,time/.14):Math.max(0,1-post/.5),reach:.6,height:1.42}]:[];
 projectWizard(g,camera);
 for(const entry of u.palette){entry.material.color.copy(entry.color);if(entry.material.emissive){entry.impactEmissive??=entry.material.emissive.clone();entry.material.emissive.copy(entry.impactEmissive);}}
}
const views=[];
for(let row=0;row<2;row++){const group=new T.Group();scene.add(group);const grid=new T.GridHelper(9,18,0x3a4c64,0x24344b);group.add(grid);const a=actor(group,'ice',-2),b=actor(group,'default',2);const factory=new IceBasic({scene:group});factory.emit({x:-2,z:0},new T.Vector3(1,0,0),'left',new T.Vector3(-1.6,1.42,0));const ball=factory.effects.find(e=>e.type==='shot').mesh;for(const e of factory.effects)if(e.mesh!==ball){e.mesh.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});e.mesh.removeFromParent();}const trail=[];for(let i=0;i<12;i++)trail.push(mesh(new T.SphereGeometry(.12,8,6),new T.MeshBasicMaterial({color:0xa8e5ff,transparent:true,opacity:.5}),group));const particles=[];for(let i=0;i<60;i++)particles.push(mesh(new T.OctahedronGeometry(.045),new T.MeshBasicMaterial({color:i%3?0xa8e5ff:0xffffff,transparent:true}),group));const c=document.createElement('canvas');c.width=128;c.height=64;const ctx=c.getContext('2d');ctx.font='bold 40px system-ui';ctx.fillStyle='#fff0b6';ctx.textAlign='center';ctx.fillText('28',64,46);const number=new T.Sprite(new T.SpriteMaterial({map:new T.CanvasTexture(c),transparent:true,depthTest:false}));number.scale.set(.65,.325,1);group.add(number);views.push({group,a,b,ball,trail,particles,number});}
const clamp=(v)=>Math.max(0,Math.min(1,v));
function drawView(v,s,t,hitAt,releaseAt){const frozen=s.freeze/1000,age=t<hitAt?t:t< hitAt+frozen?hitAt:t-frozen,impact=age-hitAt;
 poseActor(v.a,age,releaseAt);poseActor(v.b,10,0);
 const attack=attackPose(s,age),reaction=hitPose(s,impact);
 applyActorImpact(v.a.root,attack,null,v.a.dir,null);applyActorImpact(v.b.root,null,reaction,null,v.a.dir);
 if(reaction.flash)for(const entry of v.b.root.userData.palette){entry.material.color.set(0xffffff);entry.material.emissive?.set(0xffffff);}
 const flight=clamp((age-releaseAt)/flightSeconds);v.ball.visible=age>=releaseAt&&age<hitAt;v.ball.position.set(-1.6+3.6*flight,1.42+Math.sin(flight*3.6/ICE_BASIC.left.range*Math.PI)*s.arc,0);v.ball.scale.set(.7,.7,2*s.stretch);
 v.trail.forEach((p,i)=>{const delayed=flight-(i+1)*s.trail/45;const tailAfter=impact>=0&&impact<.14*(1-i/12)&&s.trail>0;p.visible=s.trail>0&&age>=releaseAt&&delayed>=0&&(v.ball.visible||tailAfter);p.position.set(-1.6+3.6*delayed,1.42+Math.sin(clamp(delayed)*3.6/ICE_BASIC.left.range*Math.PI)*s.arc,0);p.scale.setScalar((1-i/12)*.8);p.material.opacity=(1-i/12)*.6;});
 v.particles.forEach((p,i)=>{p.visible=i<s.particles&&impact>=0&&impact<.65;if(!p.visible)return;const o=particleOffset(s,i,impact);p.position.set(2+o.forward,1.2+o.up,o.side);p.rotation.set(impact*6+i,impact*3,0);p.material.opacity=1-impact/.65;});
 v.number.visible=impact>=0&&impact<1;const number=numberOffset(s,impact);v.number.position.set(v.b.root.position.x+number.x,2.2+number.y,0);v.number.material.opacity=1-clamp(impact);
 return impact;
}
let width=0,height=0;
function frame(now){requestAnimationFrame(frame);const dt=Math.min(.05,(now-last)/1000);last=now;if(!renderer)return;const schedule=timing(settings);if(playing){time+=dt*Number($('speed').value);if(time>schedule.end){time=0;cycle++;}}
 const stage=$('stage'),w=stage.clientWidth,h=stage.clientHeight;if(w!==width||h!==height){width=w;height=h;renderer.setSize(w,h,false);}
 const compare=$('compare').checked;$('baselineLabel').hidden=!compare;$('tunedLabel').style.top=compare?'52%':'16px';
 $('scrub').value=time/schedule.end;$('timeLabel').textContent=time.toFixed(2)+'초';$('phase').textContent=time<schedule.release?'준비':time<schedule.hit?'발사':time<schedule.hit+settings.freeze/1000?'순간 멈춤':'피격 · 회복';
 if(playing&&time>=schedule.hit&&lastSoundCycle!==cycle){playHit();lastSoundCycle=cycle;}
 renderer.setScissorTest(true);const count=compare?2:1;for(let i=0;i<count;i++){const tuned=!compare||i===1,view=views[tuned?1:0],s=tuned?settings:NONE;for(const v of views)v.group.visible=v===view;const hh=compare?Math.floor(h/2):h,y=compare&&i===0?h-hh:0;renderer.setViewport(0,y,w,hh);renderer.setScissor(0,y,w,hh);camera.aspect=w/hh;camera.position.copy(origin);const impact=Math.max(-1,time-schedule.hit-s.freeze/1000);const shake=impact>=0&&impact<.25?s.shake*(1-impact/.25):0;camera.position.x+=Math.sin(time*127)*shake;camera.position.y+=Math.cos(time*101)*shake;camera.lookAt(target);camera.updateProjectionMatrix();camera.updateMatrixWorld(true);drawView(view,s,time,schedule.hit,schedule.release);renderer.render(scene,camera);}}
Promise.all(views.map(v=>v.a.ready)).then(rigs=>{if(rigs.some(r=>!r)){$('modelStatus').textContent='빙결 모델을 불러오지 못했습니다. 새로고침해 주세요.';}else $('modelStatus').textContent='시전자: 빙결 · 서린 / 대상: 게임 기본 모델';});
requestAnimationFrame(frame);
