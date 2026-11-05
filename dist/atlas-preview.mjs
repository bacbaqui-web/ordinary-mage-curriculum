import * as T from './three.module.js';
import {createPublishedWizard} from './atlas-wizard.mjs';
import {LowPolyVFX} from './lowpoly-vfx.mjs';
import {RUNES,describe} from './combo-design.mjs?v=roles12';
export function mountAtlasPreview(host,seq){
 host.innerHTML='<canvas aria-label="마법사가 충전하고 마법을 시전하는 3D 미리보기"></canvas><div class="preview-controls"><button data-control="play">일시정지</button><button data-control="reset">다시 시전</button><button data-control="view">시점 바꾸기</button><span role="status">효과 불러오는 중</span></div><small>마법사와 모든 마법 효과를 3D로 표시합니다. 새 조합의 전투 판정은 게임 적용 전입니다.</small>';
 const canvas=host.querySelector('canvas'),status=host.querySelector('[role=status]'),play=host.querySelector('[data-control=play]');let renderer;
 try{renderer=new T.WebGLRenderer({canvas,antialias:true});}catch{status.textContent='3D 화면을 열지 못했습니다. 그래픽 가속을 켜고 새로고침해 주세요.';return()=>{};}
 renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setClearColor(0x1a2932);renderer.outputColorSpace=T.SRGBColorSpace;renderer.shadowMap.enabled=true;
 const scene=new T.Scene(),camera=new T.PerspectiveCamera(38,1,.1,70);scene.add(new T.HemisphereLight(0xd5ecff,0x5d6652,2.2));const sun=new T.DirectionalLight(0xffe5c0,3);sun.position.set(-3,9,6);sun.castShadow=true;scene.add(sun);
 const floor=new T.Mesh(new T.PlaneGeometry(30,22),new T.MeshStandardMaterial({color:0x58645c,roughness:1}));floor.rotation.x=-Math.PI/2;floor.receiveShadow=true;scene.add(floor);const grid=new T.GridHelper(24,24,0x748079,0x626e67);grid.position.y=.015;scene.add(grid);
 const caster=createPublishedWizard(scene,0x394351,0xe7b367),target=createPublishedWizard(scene,0x71566b,0xc2d6df);caster.position.x=-3.4;caster.rotation.y=Math.PI/2;target.position.x=2.6;target.rotation.y=-Math.PI/2;
 const d=describe(seq),color=new T.Color(d.color),vfx3d=new LowPolyVFX(scene),charge=seq.length*1.2;
 let age=0,last=performance.now(),raf,disposed=false,ready=true,paused=matchMedia('(prefers-reduced-motion: reduce)').matches,angle=0,fired=false,hit=false,burstClock=0;
 play.textContent=paused?'재생':'일시정지';
 const effects=new T.Group();scene.add(effects);const material=new T.MeshStandardMaterial({color,emissive:color,emissiveIntensity:.75,transparent:true,opacity:.85,roughness:.5});
 const extra=[...seq].filter(k=>k===seq[0]).length-1,size=.35+extra*.2;
 let geometry=d.shape==='wall'?new T.BoxGeometry(.22,2.3,3):d.shape==='field'?new T.CylinderGeometry(1.5,1.5,.07,48):(d.shape==='blade'||d.shape==='slash')?new T.BoxGeometry(.12,.12,2.3):(d.shape==='burst'||d.shape==='strike')?new T.IcosahedronGeometry(.7,0):new T.IcosahedronGeometry(size,1);
 const core=new T.Mesh(geometry,material);core.castShadow=true;effects.add(core);
 const mist=[];if(d.name.includes('증기')){core.visible=false;for(let i=0;i<9;i++){const puff=new T.Mesh(new T.SphereGeometry(.38,8,6),new T.MeshBasicMaterial({color:0xdde9ed,transparent:true,opacity:.22,depthWrite:false}));effects.add(puff);mist.push(puff);}}
 const halo=new T.Mesh(new T.TorusGeometry(1.4,.035,6,64),new T.MeshBasicMaterial({color,transparent:true,opacity:.6}));halo.rotation.x=-Math.PI/2;halo.position.y=.06;effects.add(halo);
 const rings=[...seq].map((k,i)=>{const o=new T.Mesh(new T.TorusGeometry(.13,.025,6,30),new T.MeshBasicMaterial({color:RUNES[k].color}));o.position.set(-3.4+(i-(seq.length-1)/2)*.38,2.9,0);scene.add(o);return o;});
 function emit(x,z,width,y=.15,impact=false){
  const count=impact?34:12,hex=color.getHex(),cold=seq[0]==='i';
  for(let i=0;i<count;i++){const angle=Math.random()*Math.PI*2,r=Math.random()*width*.3,speed=impact?1.8:.45;
   vfx3d.particle(cold?'shard':'chunk',[x+Math.cos(angle)*r,y+Math.random()*.35,z+Math.sin(angle)*r],[Math.cos(angle)*speed,.6+Math.random(),Math.sin(angle)*speed],cold?.09:.12,hex,.35+Math.random()*.4,{gravity:seq[0]==='d'?5:0,stretch:cold?2.3:1.3});}
  if(impact)vfx3d.pulse(x,z,width*.7,hex,.45);
 }
 function reset(){age=0;fired=false;hit=false;burstClock=0;vfx3d.clear();}
 function view(){camera.position.set(angle===1?0:7,angle===1?14:8,angle===1?.1:12);camera.lookAt(0,.7,0);}view();
 play.onclick=()=>{paused=!paused;play.textContent=paused?'재생':'일시정지';};host.querySelector('[data-control=reset]').onclick=()=>{reset();paused=false;play.textContent='일시정지';};host.querySelector('[data-control=view]').onclick=()=>{angle=1-angle;view();};
 status.textContent=paused?'일시정지':'충전 중';
 function frame(now){if(disposed)return;raf=requestAnimationFrame(frame);const dt=Math.min(.05,(now-last)/1000);last=now;if(!paused&&ready)age+=dt;if(age>charge+4.2)reset();
 const width=Math.max(200,host.clientWidth),height=Math.round(width*.72);if(canvas.width!==Math.round(width*renderer.getPixelRatio())||canvas.height!==Math.round(height*renderer.getPixelRatio())){renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();}
 const casting=age>=charge,t=age-charge,progress=Math.max(0,Math.min(1,t/(seq.endsWith('ww')?.42:.85)));
 caster.userData.body.rotation.z=casting?-.13*Math.exp(-t*3):.04*Math.sin(age*4);caster.userData.arm.rotation.x=casting?-.5*Math.exp(-t*3):-Math.min(1,age/.4)*.65;
 rings.forEach((r,i)=>{r.visible=!casting;r.quaternion.copy(camera.quaternion);const amount=Math.max(.04,Math.min(1,age/1.2-i));r.scale.setScalar(amount);});
 effects.visible=casting&&t<3.3;core.position.set(0,d.shape==='field'?.08:1.1,0);core.scale.setScalar(1);core.rotation.set(0,0,0);halo.visible=d.shape==='field'||d.motion==='pull'||d.motion==='spin';
 const landAfter=seq.endsWith('t')&&['w','l'].some(k=>seq.slice(0,-1).includes(k));
 if(d.motion==='forward'){effects.position.set(-2.7+progress*5.3,0,0);if(landAfter){core.scale.setScalar(progress<1?.25:1);core.position.y=progress<1?1:.08;halo.visible=progress===1;}}
 else if(d.motion==='fall'){effects.position.set(2.6,0,0);core.position.y=progress<1?5*(1-progress)+.3:d.shape==='field'?.08:.3;halo.visible=true;}
 else if(d.motion==='spin'){effects.position.set(.4,0,0);core.position.x=Math.cos(t*5)*1.8;core.position.z=Math.sin(t*5)*1.8;core.rotation.y=t*5;}
 else{effects.position.set(d.shape==='wall'||d.shape==='field'?1.5:-.5,0,0);if(d.shape==='orb'){core.scale.set(2.6,1.2,1.6);}}
 mist.forEach((p,i)=>{p.position.set(core.position.x+Math.sin(t*1.2+i*2)*.7,core.position.y+.3+(t*.4+i*.1)%1.1,core.position.z+Math.cos(i*2)*.6);p.scale.setScalar(1+Math.sin(t+i)*.2);});
 if(d.shape==='spread')core.scale.setScalar(.5+Math.min(2,Math.max(0,t)*1.4));
 if(d.shape==='condensed')core.scale.setScalar(Math.max(.28,1.3-Math.max(0,t)));
 if(d.shape==='solid'){core.rotation.y=.3;core.material.opacity=1;}
 if(d.shape==='coat'){effects.position.x=2.6;core.scale.set(.7,1.4,.7);}
 if(d.shape==='spray'){core.scale.set(1.5,.4,2.8);core.position.z=Math.sin(t*18)*.7;}
 if(d.shape==='slash'){effects.position.x=-2;core.rotation.y=t*7;core.position.x=Math.cos(t*7)*1.2;core.position.z=Math.sin(t*7)*1.2;}
 if(d.shape==='strike'){effects.position.x=2.6;core.scale.setScalar(.5+Math.min(.5,Math.max(0,t)*2));}
 if((d.shape==='burst'||d.shape==='strike'))core.scale.setScalar(.5+Math.min(1,t*2));
 if(casting&&!fired){fired=true;vfx3d.pulse(-3.4,0,1.2,color.getHex(),.5);if(seq[0]==='q'||seq[0]==='i')vfx3d.burst({kind:seq[0],rings:seq.length,halfAngle:.45,range:2.8},{x:1,z:0},{x:-3.4,z:0},()=>false);else emit(-2.4,0,2.2,1);}
 if(casting&&progress===1&&!hit){hit=true;emit(2.6,0,3,.5,true);if(seq[0]==='l')vfx3d.bolt(2.6,0,{rings:seq.length,height:4,radius:.6});}
 if(!paused&&casting&&!mist.length){burstClock+=dt;if(burstClock>.36){burstClock=0;const p=core.getWorldPosition(new T.Vector3());emit(p.x,p.z,d.shape==='field'?3:d.shape==='wall'?2.6:1.7,p.y);}}
 target.userData.body.rotation.z=hit?Math.sin(Math.max(0,t-.85)*12)*.12*Math.exp(-Math.max(0,t-.85)*2):0;
 target.position.x=d.motion==='pull'&&casting?2.6-Math.min(1,t)*1.2:seq[0]==='w'&&casting?2.6+Math.min(1,t)*.8:2.6;
 if(ready)status.textContent=paused?'일시정지':!casting?`충전 ${Math.min(seq.length,Math.floor(age/1.2)+1)} / ${seq.length}`:hit?'적중 · 남은 효과':'시전 중';
 if(!paused)vfx3d.update(dt);renderer.render(scene,camera);
 }raf=requestAnimationFrame(frame);
 return()=>{disposed=true;cancelAnimationFrame(raf);vfx3d.clear();scene.traverse(o=>{o.geometry?.dispose();if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.dispose());});renderer.dispose();renderer.forceContextLoss();};
}
