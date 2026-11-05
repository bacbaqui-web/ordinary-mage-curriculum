import {RUNES} from './loadout.mjs?v=zones1';
import {groundSpec} from './ground.mjs?v=zones1';
import {elementalSpec} from './elements.mjs?v=zones1';
import {forceSpec,wardSpec} from './forces.mjs?v=zones1';
import {impactAsset,projectileAsset,groundAsset} from './effect-map.mjs?v=zones1';
export function previewSpec(seq){return groundSpec(seq)||elementalSpec(seq)||forceSpec(seq)||wardSpec(seq);}
let assetPromise;
function assets(){return assetPromise??=(async()=>{const base=new URL('./assets/pvfx/',import.meta.url),r=await fetch(new URL('manifest.json?v=zones1',base));if(!r.ok)throw Error('manifest');const manifest=await r.json();const entries=await Promise.all(Object.entries(manifest).map(async([id,meta])=>{const image=new Image();image.src=new URL(meta.file,base).href;await image.decode();return [id,{...meta,image}];}));return Object.fromEntries(entries);})().catch(error=>{assetPromise=null;throw error;});}
export function mountPreview(host,seq){
 const s=previewSpec(seq),kind=s.ground?s.kind:seq[0],color=RUNES[kind].color;
 host.innerHTML='<canvas width="640" height="380" aria-label="선택한 마법의 2D 애니메이션 미리보기"></canvas><div class="preview-controls"><span role="status">효과 불러오는 중</span><button type="button">일시정지</button><button type="button">다시 재생</button><button type="button">크게 보기</button></div><input type="range" min="0" max="1000" value="0" aria-label="미리보기 재생 위치" style="width:100%"><small>게임과 같은 2D 효과를 재생합니다. 캐릭터와 배경은 설명용 그림입니다.</small>';
 const canvas=host.querySelector('canvas'),c=canvas.getContext('2d'),status=host.querySelector('[role=status]'),buttons=host.querySelectorAll('button'),seek=host.querySelector('input');
 let pack=null,failed=false,paused=matchMedia('(prefers-reduced-motion: reduce)').matches,elapsed=0,last=performance.now(),raf,disposed=false;
 const charge=seq.length*1.2,hold=s.ground||seq[0]==='e'?s.duration:3,total=charge+hold+1,unit=36,caster={x:110,y:255},target={x:s.projectile?110+Math.min(s.range,5)*36:s.ground?330:seq[0]==='e'?350:110+Math.min(s.range*.72,6)*36,y:255};
 function sprite(id,x,y,width,time,{loop=false,holdFrame,center=false}={}){const a=pack?.[id];if(!a||time<0)return;const duration=a.frames*a.frame_ms/1000;if(time>=duration&&!loop&&!a.loop&&holdFrame===undefined)return;const f=Math.min(holdFrame??a.frames-1,Math.floor((holdFrame===undefined&&(loop||a.loop)?time%duration:time)*1000/a.frame_ms)),[w,h]=a.size,scale=width/w;c.save();c.imageSmoothingEnabled=false;c.drawImage(a.image,(f%8)*w,Math.floor(f/8)*h,w,h,x-(center?w/2:a.pivot[0])*scale,y-(center?h/2:a.pivot[1])*scale,width,h*scale);c.restore();}
 function circle(x,y,r,stroke,fill){c.beginPath();c.ellipse(x,y,r,r*.55,0,0,Math.PI*2);if(fill){c.fillStyle=fill;c.fill();}c.strokeStyle=stroke;c.lineWidth=2;c.stroke();}
 function mage(x,y,col,label){circle(x,y+2,15,'transparent','#0005');c.fillStyle=col;c.beginPath();c.moveTo(x,y-42);c.lineTo(x-14,y);c.lineTo(x+14,y);c.closePath();c.fill();c.beginPath();c.arc(x,y-45,7,0,Math.PI*2);c.fill();c.fillStyle='#d5e1e8';c.font='12px system-ui';c.textAlign='center';c.fillText(label,x,y+25);}
 function draw(){const t=elapsed%total,u=t-charge,active=u>=0&&u<hold;c.clearRect(0,0,640,380);c.fillStyle='#14232b';c.fillRect(0,0,640,380);c.strokeStyle='#2a3b43';c.lineWidth=1;for(let y=75;y<365;y+=36){c.beginPath();c.moveTo(0,y);c.lineTo(640,y);c.stroke();}for(let x=0;x<640;x+=36){c.beginPath();c.moveTo(x,65);c.lineTo(x,365);c.stroke();}
 c.fillStyle='#b6cbd4';c.font='13px system-ui';c.textAlign='left';c.fillText('시전 → 이동·설치 → 적중 → 효과 유지',18,27);
 const groundX=310,wallX=seq[0]==='e'&&s.moving?190+Math.min(s.travel,Math.max(0,u)*s.speed)*unit:310;
 let tx=target.x;if(active&&s.force&&!s.ground)tx+=s.force*unit*Math.min(1,Math.max(0,u)/.5);if(active&&s.moving)tx=Math.max(tx,wallX+25);
 if(s.ground){circle(groundX,255,s.radius*unit,color,active?color+'28':'#ffffff08');if(active){sprite(groundAsset(kind),groundX,255,s.radius*unit*2,u,{loop:true});if(Math.abs(tx-groundX)<=s.radius*unit){sprite('hit-spark',tx,230,40,u%s.interval);if(s.shock)sprite('static-burst',tx,230,65,u%s.interval);}}}
 if(seq[0]==='e'&&!s.ground){c.strokeStyle=color;c.beginPath();c.moveTo(wallX,210);c.lineTo(wallX,290);c.stroke();if(active){sprite('ice-wall',wallX,258,s.width*unit*1.25,u,{holdFrame:10});if(s.shock)sprite('lightning-strike',tx,255,90,u%.8);if(s.burn)sprite('burning-aura',tx,255,55,u,{loop:true});if(s.slow)sprite('frozen-chill',tx,255,55,u,{loop:true});}else if(u>=hold)sprite('shield-shatter',wallX,220,s.width*unit,u-hold,{center:true});}
 mage(caster.x,caster.y,'#c9d3ed','시전자');mage(tx,255,'#e6b77c','상대');
 if(t<charge){for(let i=0;i<seq.length;i++){c.beginPath();c.arc(caster.x+(i-(seq.length-1)/2)*25,185,8,-Math.PI/2,-Math.PI/2+Math.PI*2*Math.max(0,Math.min(1,t/1.2-i)));c.strokeStyle=RUNES[seq[i]].color;c.lineWidth=4;c.stroke();}}
 if(active){sprite('magic-circle',caster.x,caster.y,75,u);
 if(!s.ground&&seq[0]!=='e'){
 if(s.projectile){const distance=Math.min(s.range,5),flight=distance/s.speed,x=caster.x+Math.min(distance,u*s.speed)*unit;if(u<flight)sprite(projectileAsset(kind),x,235,Math.max(50,s.radius*unit*4),u,{loop:true});else sprite(impactAsset(kind),caster.x+distance*unit,255,Math.max(65,s.blast*unit*2),u-flight);}
 else if(s.falling){if(u<.28)sprite(impactAsset(kind),tx,255-140*(1-u/.28),50,u);else sprite(impactAsset(kind),tx,255,90,u-.28);}
 else if(kind==='l')sprite('lightning-strike',tx,255,s.height*unit*.75,u);
 else if('qi'.includes(kind)){for(let d=.5;d<=s.range;d+=.65)sprite(impactAsset(kind),caster.x+d*unit,255,48,u);}
 else sprite(impactAsset(kind),caster.x+90,255,110,u);
 if(s.burn&&u< s.burn)sprite('burning-aura',tx,255,55,u,{loop:true});if(s.slow&&u<s.slow)sprite('frozen-chill',tx,255,55,u,{loop:true});
 }if(s.shield)sprite('shield-bubble',caster.x,caster.y,75,u,{loop:true});}
 if(!pack)status.textContent=failed?'효과를 불러오지 못했습니다. 다시 재생을 누르세요.':'효과 불러오는 중';else status.textContent=t<charge?'시전 준비 · '+Math.min(seq.length,Math.floor(t/1.2)+1)+'번째 원':active?(s.ground?'장판 유지 · '+Math.ceil(hold-u)+'초':seq[0]==='e'?'장벽 유지 · '+Math.ceil(hold-u)+'초':s.projectile&&u<5/s.speed?'마법탄 이동':'적중 · 지속 효과'):'다음 시전 준비';seek.value=String(t/total*1000);
 }
 function tick(now){if(disposed)return;if(pack&&!paused&&!document.hidden)elapsed+=Math.min(.1,(now-last)/1000);last=now;draw();raf=requestAnimationFrame(tick);}
 const dialog=document.createElement('dialog');dialog.className='spell-preview preview-dialog';dialog.setAttribute('aria-label','스킬 미리보기');document.body.append(dialog);
 function restore(){if(disposed)return;while(dialog.firstChild)host.append(dialog.firstChild);buttons[2].textContent='크게 보기';}
 dialog.addEventListener('close',restore);buttons[2].onclick=()=>{if(dialog.open){dialog.close();restore();}else{while(host.firstChild)dialog.append(host.firstChild);buttons[2].textContent='작게 보기';dialog.showModal();}};
 function load(){assets().then(value=>{if(!disposed){pack=value;failed=false;}}).catch(()=>{failed=true;});}load();
 buttons[0].textContent=paused?'재생':'일시정지';buttons[0].onclick=()=>{paused=!paused;buttons[0].textContent=paused?'재생':'일시정지';};buttons[1].onclick=()=>{elapsed=0;paused=false;buttons[0].textContent='일시정지';if(failed)load();};seek.oninput=()=>{elapsed=Number(seek.value)/1000*total;paused=true;buttons[0].textContent='재생';draw();};raf=requestAnimationFrame(tick);return()=>{disposed=true;cancelAnimationFrame(raf);dialog.close();dialog.remove();};
}
