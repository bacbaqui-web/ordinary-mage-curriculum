import * as T from './three.module.js';
import {createWizard,animateWizard,projectWizard} from './wizard.mjs?v=no-floor-rings-1';
import {PixelVFX,frameAt} from './pixel-vfx.mjs?v=studio1';
import {RUNES} from './loadout.mjs?v=integer-damage-1';
import {groundSpec} from './ground.mjs?v=integer-damage-1';
import {elementalSpec} from './elements.mjs?v=integer-damage-1';
import {forceSpec,wardSpec,displacement} from './forces.mjs?v=iceberg-rise-1';
import {impactAsset,projectileAsset,groundAsset} from './effect-map.mjs?v=zones1';
import {ASSET_INDEX} from './asset-index.mjs?v=studio1';
export function previewSpec(seq){return groundSpec(seq)||elementalSpec(seq)||forceSpec(seq)||wardSpec(seq);}
export function previewAssets(seq){const s=previewSpec(seq),k=s.ground?s.kind:seq[0],ids=['magic-circle'];
 if(s.ground)ids.push(groundAsset(k),'hit-spark',...(s.shock?['static-burst']:[]));
 else if(seq[0]==='e')ids.push('ice-wall','shield-shatter',...(s.shock?['lightning-strike']:[]));
 else if(s.projectile)ids.push(projectileAsset(k),impactAsset(k),'hit-spark');
 else ids.push(k==='l'&&!s.falling?'lightning-strike':impactAsset(k),'hit-spark');
 if(s.burn)ids.push('burning-aura');if(s.slow)ids.push('frozen-chill');if(s.shield)ids.push('shield-bubble');return [...new Set(ids)];}
export function mountPreview(host,seq){
 const s=previewSpec(seq),kind=s.ground?s.kind:seq[0],color=RUNES[kind].color;
 host.innerHTML='<canvas width="800" height="480" aria-label="게임의 3D 마법사가 주문을 시전하는 미리보기"></canvas><div class="preview-controls"><span role="status">효과 불러오는 중</span><button type="button">일시정지</button><button type="button">다시 재생</button><button type="button">크게 보기</button><button type="button">시점 바꾸기</button></div><input type="range" min="0" max="1000" value="0" aria-label="미리보기 재생 위치" style="width:100%"><small>게임과 같은 3D 캐릭터·2D 효과로 시전과 적중을 보여줍니다.</small><div class="preview-materials"></div>';
 const canvas=host.querySelector('canvas'),status=host.querySelector('[role=status]'),buttons=host.querySelectorAll('button'),seek=host.querySelector('input');
 host.querySelector('.preview-materials').innerHTML='사용 소재: '+previewAssets(seq).map(id=>`<a href="materials.html#${ASSET_INDEX[id].number}" target="_blank" rel="noopener">#${String(ASSET_INDEX[id].number).padStart(3,'0')} ${ASSET_INDEX[id].name}</a>`).join(' · ');
 let renderer;try{renderer=new T.WebGLRenderer({canvas,antialias:true});}catch{status.textContent='3D 미리보기를 열지 못했습니다. 브라우저의 그래픽 가속 설정을 확인해 주세요.';return()=>{};}
 renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.outputColorSpace=T.SRGBColorSpace;renderer.setClearColor(0x25343b);renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
 const scene=new T.Scene(),camera=new T.PerspectiveCamera(38,5/3,.1,100),pixel=new PixelVFX(scene),caster=createWizard(scene,0x394351,0xe7b367),target=createWizard(scene,0x73899c,0xc2d6df);
 scene.add(new T.HemisphereLight(0xe2efff,0x5a614c,2.3));const sun=new T.DirectionalLight(0xffe4ba,3.2);sun.position.set(-5,12,8);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-12,right:12,top:12,bottom:-12});scene.add(sun);
 const floor=new T.Mesh(new T.PlaneGeometry(32,24),new T.MeshStandardMaterial({color:0x7b8278,roughness:1}));floor.rotation.x=-Math.PI/2;floor.receiveShadow=true;scene.add(floor);
 const grid=new T.GridHelper(32,32,0x545f59,0x657067);grid.position.y=.015;scene.add(grid);
 const charge=seq.length*1.2,hold=s.ground||seq[0]==='e'?s.duration:3,total=charge+hold+1;
 const startX=-3,reach=s.ground?4:s.projectile?Math.min(s.range*.65,5):seq[0]==='e'?3.8:Math.min(s.range*.7,5),hitX=startX+reach;
 caster.position.set(startX,0,0);caster.rotation.y=Math.PI/2;target.rotation.y=-Math.PI/2;
 const schedules=[],markers=[];let loaded=false,paused=matchMedia('(prefers-reduced-motion: reduce)').matches,elapsed=0,last=performance.now(),raf,disposed=false,angle=0;
 function view(){const center=s.moving?Math.max(0,s.travel*.35-1):Math.max(-.8,(startX+hitX)/2),zoom=s.moving?1.25:1;camera.position.set(center+(angle===1?0:angle===2?-8:7)*zoom,(angle===1?14:9)*zoom,(angle===1?.1:14)*zoom);camera.lookAt(center,.7,0);}
 view();
 function mark(radius,x,fill=.15){const g=new T.Group(),material=new T.MeshBasicMaterial({color,transparent:true,opacity:fill,depthWrite:false,side:T.DoubleSide});const disc=new T.Mesh(new T.CircleGeometry(radius,64),material);disc.rotation.x=-Math.PI/2;g.add(disc);const edge=new T.Mesh(new T.RingGeometry(radius-.035,radius,64),material.clone());edge.material.opacity=.7;edge.rotation.x=-Math.PI/2;edge.position.y=.01;g.add(edge);g.position.set(x,.035,0);scene.add(g);markers.push(g);return g;}
 const area=s.ground?mark(s.radius,hitX):s.projectile?mark(s.blast,hitX,.04):s.overhead?mark(s.radius+.35,hitX,.06):null;
 const orbs=[];for(let i=0;i<seq.length;i++){const orb=new T.Mesh(new T.RingGeometry(.08,.11,24),new T.MeshBasicMaterial({color:RUNES[seq[i]].color,side:T.DoubleSide,transparent:true}));orb.position.set(startX+(i-(seq.length-1)/2)*.3,2.9,0);scene.add(orb);orbs.push(orb);}
 function event(id,x,z,width,start=0,options={}){const effect=pixel.play(id,x,z,{width,...options});if(effect)schedules.push({effect,start,x,z,position:options.position});}
 function build(){
  event('magic-circle',startX,0,1.8,0,{color:RUNES[seq[0]].color,duration:.55});
  if(s.ground){event(groundAsset(kind),hitX,0,s.radius*2,0,{duration:s.duration,loop:true});for(let t=0;t<s.duration;t+=s.interval){event('hit-spark',hitX+.35,0,1.1,t,{y:1});if(s.shock)event('static-burst',hitX+.35,0,1.2,t,{y:.7});}}
  else if(seq[0]==='e'){
   const wallPos=age=>({x:s.moving?startX+1.2+Math.min(s.travel,age*s.speed):hitX-.6,y:.12,z:0});
   event('ice-wall',hitX-.6,0,s.width*1.25,0,{duration:s.duration,planeAngle:Math.PI/2,holdFrame:10,position:wallPos});
   event('shield-shatter',s.moving?startX+1.2+s.travel:hitX-.6,0,s.width,s.duration,{y:1.2,center:[.5,.5]});
   if(s.shock)for(let t=.1;t<s.duration;t+=.8)event('lightning-strike',hitX,0,2,t);
  }else if(s.projectile){const flight=reach/s.speed;event(projectileAsset(kind),startX,0,Math.max(1.4,s.radius*4),0,{duration:flight,loop:true,position:age=>({x:startX+age*s.speed,y:.95,z:0})});event(impactAsset(kind),hitX,0,Math.max(1.3,Math.min(5,s.blast*2)),flight);event('hit-spark',hitX,0,1.1,flight,{y:1});}
  else if(s.falling){event(impactAsset(kind),hitX,0,1.1,0,{duration:.28,color,position:age=>({x:hitX,y:.2+s.height*(1-age/.28),z:0})});event(impactAsset(kind),hitX,0,Math.max(1.3,s.radius*2),.28);event('hit-spark',hitX,0,1.1,.28,{y:1});}
  else if(kind==='l'){event('lightning-strike',hitX,0,Math.min(4,s.height*.75));event('hit-spark',hitX,0,1.1,0,{y:1});}
  else if('qi'.includes(kind)){for(let d=.5;d<=s.range;d+=.65)event(impactAsset(kind),startX+d,0,1.3);event('hit-spark',hitX,0,1.1,.1,{y:1});}
  else {event(impactAsset(kind),startX+1.2,0,2.6,0,{y:.35});event('hit-spark',hitX,0,1.1,.15,{y:1});}
  const hitTime=s.projectile?reach/s.speed:s.falling?.28:0;
  if(s.burn)event('burning-aura',hitX,0,1.35,hitTime,{duration:s.ground||seq[0]==='e'?hold:s.burn,loop:true,position:()=>({x:target.position.x,y:.12,z:0})});
  if(s.slow)event('frozen-chill',hitX,0,1.2,hitTime,{duration:s.ground||seq[0]==='e'?hold:s.slow,loop:true,position:()=>({x:target.position.x,y:.12,z:0})});
  if(s.shield)event('shield-bubble',startX,0,1.8,0,{duration:2,loop:true});
 }
 pixel.ready.then(()=>{if(disposed){for(const a of pixel.assets.values())a.texture.dispose();return;}build();loaded=true;});
 function draw(){const t=elapsed%total,u=t-charge,active=u>=0&&u<hold,hitTime=s.projectile?reach/s.speed:s.falling?.28:0,hitAge=u-hitTime;
  animateWizard(caster,0,{charging:t<charge,cast:u>=0&&u<.35?1-u/.35:0});
  caster.userData.body.rotation.z=t<charge?-.07*Math.sin(t*7):u<.3?-.15*(1-u/.3):0;caster.userData.arm.rotation.x=t<charge?-.55:active&&u<.4?-.8*(1-u/.4):0;
  target.position.set(hitX+(s.ground?.35:0),0,0);let shift=active&&hitAge>=0?displacement(s.force||-(s.pull||0),reach)*Math.min(1,hitAge/.5):0;if(s.ground)shift*=Math.min(1,u);target.position.x+=shift;
  if(s.moving&&active)target.position.x=Math.max(target.position.x,startX+1.2+Math.min(s.travel,u*s.speed)+.55);
  target.userData.body.rotation.z=active&&hitAge>=0&&hitAge<.35?-.2*Math.sin(hitAge/.35*Math.PI):0;
  for(const entry of target.userData.palette){entry.material.color.copy(entry.color);if(active&&hitAge>=0&&(s.burn||s.slow))entry.material.color.lerp(new T.Color(s.burn?0xff543e:0x479eff),.35);}
  if(area)area.visible=u<hold;orbs.forEach((orb,i)=>{orb.visible=t<charge;orb.quaternion.copy(camera.quaternion);orb.material.opacity=t/1.2>=i?.95:.18;});
  for(const item of schedules){const {effect:e}=item,age=u-item.start;e.sprite.visible=age>=0&&age<e.life;if(!e.sprite.visible)continue;const cycle=e.meta.frames*e.meta.frame_ms/1000;pixel.setFrame(e,e.holdFrame!==undefined?Math.min(e.holdFrame,frameAt(e.meta,age)):frameAt(e.meta,e.loop||e.meta.loop?age%cycle:age));if(item.position){const p=item.position(age);e.sprite.position.set(p.x,p.y,p.z);}
   if(e.meta.file===projectileAsset(kind)+'.png'&&e.sprite.isSprite){const p=e.sprite.position.clone().project(camera),q=e.sprite.position.clone().add(new T.Vector3(1,0,0)).project(camera);e.sprite.material.rotation=Math.atan2(q.y-p.y,q.x-p.x);}
  }
  status.textContent=!loaded?'효과 불러오는 중':pixel.failed?'일부 효과를 불러오지 못했습니다. 페이지를 새로고침해 주세요.':t<charge?'마법사 시전 준비 · '+Math.min(seq.length,Math.floor(t/1.2)+1)+'번째 원':active?(s.ground?'장판 유지 · '+Math.ceil(hold-u)+'초':seq[0]==='e'?'장벽 유지 · '+Math.ceil(hold-u)+'초':s.projectile&&u<hitTime?'마법탄 이동':'상대 적중 · 효과 유지'):'다음 시전 준비';seek.value=String(t/total*1000);
  const width=Math.max(1,Math.round(canvas.getBoundingClientRect().width)),height=Math.round(width*.6);if(canvas.clientHeight!==height)canvas.style.height=height+'px';if(renderer.domElement.width!==Math.round(width*renderer.getPixelRatio())){renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();}projectWizard(caster,camera);projectWizard(target,camera);renderer.render(scene,camera);
 }
 function tick(now){if(disposed)return;if(loaded&&!paused&&!document.hidden)elapsed+=Math.min(.1,(now-last)/1000);last=now;draw();raf=requestAnimationFrame(tick);}
 const dialog=document.createElement('dialog');dialog.className='spell-preview preview-dialog';dialog.setAttribute('aria-label','3D 마법사 스킬 미리보기');document.body.append(dialog);
 function restore(){if(disposed)return;while(dialog.firstChild)host.append(dialog.firstChild);buttons[2].textContent='크게 보기';}
 dialog.addEventListener('close',restore);buttons[2].onclick=()=>{if(dialog.open){dialog.close();restore();}else{while(host.firstChild)dialog.append(host.firstChild);buttons[2].textContent='작게 보기';dialog.showModal();}};
 buttons[0].textContent=paused?'재생':'일시정지';buttons[0].onclick=()=>{paused=!paused;buttons[0].textContent=paused?'재생':'일시정지';};buttons[1].onclick=()=>{elapsed=0;paused=false;buttons[0].textContent='일시정지';};buttons[3].onclick=()=>{angle=(angle+1)%3;view();};seek.oninput=()=>{elapsed=Number(seek.value)/1000*total;paused=true;buttons[0].textContent='재생';draw();};raf=requestAnimationFrame(tick);
 return()=>{disposed=true;cancelAnimationFrame(raf);dialog.close();dialog.remove();pixel.clear();for(const a of pixel.assets.values())a.texture.dispose();scene.traverse(o=>{o.geometry?.dispose();if(Array.isArray(o.material))o.material.forEach(m=>m.dispose());else o.material?.dispose();});renderer.dispose();renderer.forceContextLoss();};
}
