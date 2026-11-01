import {RUNES} from './loadout.mjs';
import {elementalSpec} from './elements.mjs';
import {forceSpec,wardSpec} from './forces.mjs';
// Diagram renderer: shared gameplay specs, fixed metres-to-pixels scale.
export function mountPreview(host,seq){
 const s=elementalSpec(seq)||forceSpec(seq)||wardSpec(seq),kind=seq[0],color=RUNES[kind].color;
 host.innerHTML='<canvas width="640" height="380" aria-label="선택한 마법의 시전과 적중 애니메이션"></canvas><div class="preview-controls"><span role="status"></span><button type="button">일시정지</button><button type="button">다시 재생</button></div><small>효과를 이해하기 위한 도식입니다. 범위와 속성은 게임 규칙을 따릅니다.</small>';
 const canvas=host.querySelector('canvas'),c=canvas.getContext('2d'),status=host.querySelector('[role=status]'),buttons=host.querySelectorAll('button');
 let paused=matchMedia('(prefers-reduced-motion: reduce)').matches,elapsed=0,last=performance.now(),frame,disposed=false;
 const charge=seq.length*1.2,hold=kind==='e'?s.duration:Math.max(3,s.burn||0,s.slow||0),total=charge+hold+1,unit=27,ox=190,oy=220,range=s.range*unit,target=kind==='e'?115:range*.72;
 const clamp=x=>Math.max(0,Math.min(1,x)),ease=x=>1-Math.pow(1-clamp(x),3);
 function line(x,y,x2,y2,col,width=2){c.strokeStyle=col;c.lineWidth=width;c.beginPath();c.moveTo(x,y);c.lineTo(x2,y2);c.stroke()}
 function circle(x,y,r,col,fill=false){c.beginPath();c.arc(x,y,r,0,Math.PI*2);c[fill?'fillStyle':'strokeStyle']=col;c.lineWidth=2;c[fill?'fill':'stroke']()}
 function bolt(x,y,size=1){c.save();c.shadowColor='#e5c8ff';c.shadowBlur=14;c.strokeStyle='#eedbff';c.lineWidth=3*size;c.beginPath();c.moveTo(x+12,y-85*size);c.lineTo(x-9,y-49*size);c.lineTo(x+8,y-49*size);c.lineTo(x,y-8);c.stroke();c.restore();circle(x,y,15*size,'#bf8bff')}
 function mage(x,y,col,label){c.fillStyle='#0006';c.beginPath();c.ellipse(x,y+6,15,6,0,0,7);c.fill();c.fillStyle=col;c.beginPath();c.moveTo(x,y-28);c.lineTo(x-11,y);c.lineTo(x+11,y);c.fill();circle(x,y-32,7,col,true);c.fillStyle='#a6b6c1';c.font='12px system-ui';c.textAlign='center';c.fillText(label,x,y+28)}
 function cone(r,a,alpha){c.save();c.globalAlpha=alpha;c.fillStyle=color;c.strokeStyle=color;c.beginPath();c.moveTo(ox,oy);c.arc(ox,oy,r,-a,a);c.closePath();c.fill();c.globalAlpha=Math.min(1,alpha*3);c.stroke();c.restore()}
 function draw(){const t=elapsed%total,u=t-charge,active=u>=0&&u<hold,charging=u<0;
 c.clearRect(0,0,640,380);c.fillStyle='#101b23';c.fillRect(0,0,640,380);for(let x=0;x<640;x+=27)line(x,45,x,350,'#22313b',.6);for(let y=58;y<350;y+=27)line(0,y,640,y,'#22313b',.6);
 c.fillStyle='#b0c3cc';c.font='12px system-ui';c.textAlign='left';c.fillText('시전 → 적중 → 효과 유지',18,25);line(18,355,18+unit,355,'#a3b1ba');c.fillText('1m',52,359);
 if(kind==='l'){c.save();c.globalAlpha=.22;circle(ox,oy,range,color,true);c.restore();circle(ox,oy,range,color)}else if(kind!=='e')cone(range,s.halfAngle,.08);
 let move=active?(s.force||s.push||-(s.pull||0))*unit*ease(u/.5):0;
 if(kind==='e')move=Math.max(-8,move);
 const tx=ox+target+move,burning=active&&s.burn&&(kind==='e'?u%.8<s.burn:u<s.burn),slowed=active&&s.slow&&(kind==='e'?u%.8<s.slow:u<s.slow),hit=burning||slowed||(active&&u<.5),targetColor=hit?(burning?'#ff7750':slowed?'#74c9ff':'#e4bd8c'):'#e4bd8c';
 if(kind==='e'){
 const wx=ox+95,w=s.width*unit;
 c.save();c.globalAlpha=charging?.25:active?1:.12;c.fillStyle='#7de0b733';c.fillRect(wx-6,oy-w/2-40,12,w+40);line(wx,oy-w/2,wx,oy+w/2,'#a3ffd4',5);line(wx,oy-w/2-40,wx,oy+w/2-40,'#a3ffd4',3);line(wx,oy-w/2,wx,oy-w/2-40,'#a3ffd4');line(wx,oy+w/2,wx,oy+w/2-40,'#a3ffd4');
 s.colors.forEach((k,i)=>line(wx-3+i*3,oy-w/2-35,wx-3+i*3,oy+w/2-5,RUNES[k].color,3));c.restore();
 if(active){c.fillStyle='#a3ffd4';c.fillRect(wx-25,oy-w/2-53,50*(1-u/hold),3);if(s.shock&&u%.8<.23)bolt(tx,oy);c.fillStyle='#b6c7c9';c.fillText('이동 차단',wx+17,oy+w/2+20)}
 }else if(active&&kind==='l'&&u<.65)bolt(tx,oy,.75+seq.length*.22);
 else if(active&&'qi'.includes(kind)&&u<.65){cone(range*ease(u/.18),s.halfAngle,.2*(1-u/.65));for(let j=0;j<28;j++){const p=((u*1.8+j/28)%1),a=Math.sin(j*12.3)*s.halfAngle,r=range*p,x=ox+Math.cos(a)*r,y=oy+Math.sin(a)*r;c.globalAlpha=(1-p)*.85;if(kind==='q')circle(x,y,3+8*p,j%2?'#ffb94e':'#ff633a',true);else{line(x-3,y+6,x+3,y-6,'#a8efff',3);line(x-4,y,x+4,y,'#a8efff',2)}}c.globalAlpha=1;
 }else if(active&&'wg'.includes(kind)&&u<.6){const p=clamp(u/.6),r=range*(kind==='g'?1-p:p);c.strokeStyle=color;c.lineWidth=5*(1-p)+1;c.beginPath();c.arc(ox,oy,Math.max(1,r),-s.halfAngle,s.halfAngle);c.stroke()}
 mage(ox,oy,'#e2e9e6','시전자');mage(tx,oy,targetColor,'상대');
 if(active&&s.shield)circle(ox,oy-18,29,'#8affe0');
 if(active&&s.echo&&u>.45&&u<.72)bolt(tx,oy,.65);
 if(burning){for(let j=0;j<5;j++)circle(tx-10+j*5,oy-8-((u*30+j*9)%35),2.5,'#ff873f',true)}
 if(burning||slowed){c.fillStyle=targetColor;c.textAlign='center';c.fillText([burning&&'화상',slowed&&'감속'].filter(Boolean).join(' · '),tx,oy-53)}
 if(charging){for(let j=0;j<seq.length;j++){const x=ox+(j-(seq.length-1)/2)*24;circle(x,oy-65,8,'#3f5361');const p=clamp(t/1.2-j);c.beginPath();c.arc(x,oy-65,8,-Math.PI/2,-Math.PI/2+Math.PI*2*p);c.strokeStyle=RUNES[seq[j]].color;c.lineWidth=4;c.stroke()}}
 status.textContent=charging?`충전 중 · ${Math.min(seq.length,Math.floor(t/1.2)+1)}번째 원`:active?(kind==='e'?`장벽 유지 · ${Math.ceil(hold-u)}초`:'시전 · 적중 효과'):'다음 시전 준비';
 }
 function tick(now){if(disposed)return;if(!paused&&!document.hidden)elapsed+=(now-last)/1000;last=now;draw();frame=requestAnimationFrame(tick)}
 buttons[0].textContent=paused?'재생':'일시정지';buttons[0].onclick=()=>{paused=!paused;buttons[0].textContent=paused?'재생':'일시정지'};buttons[1].onclick=()=>{elapsed=0;paused=false;buttons[0].textContent='일시정지'};
 frame=requestAnimationFrame(tick);return()=>{disposed=true;cancelAnimationFrame(frame)};
}
