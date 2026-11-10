import {BUILDINGS,TREES} from './town-layout.mjs';
// Simplified silhouettes use the same footprints, headings and heights as the town kit.
export function drawMinimapLandmarks(c,project){
 const p=([x,y,z])=>{const q=project({x,z});return {x:q.x,y:q.y-y*1.35};};
 const face=(v,color)=>{const q=v.map(p);c.beginPath();q.forEach((a,i)=>i?c.lineTo(a.x,a.y):c.moveTo(a.x,a.y));c.closePath();c.fillStyle=color;c.fill();c.strokeStyle='#263b4238';c.lineWidth=.45;c.stroke();};
 const objects=[...BUILDINGS.map(b=>({...b,kind:'building'})),...TREES.map(t=>({...t,kind:'tree'})),{x:33,z:33,kind:'pavilion'}].sort((a,b)=>a.x+a.z-b.x-b.z);
 for(const o of objects){
  if(o.kind==='tree'){
   const q=p([o.x,0,o.z]),t=p([o.x,3.6,o.z]);c.strokeStyle='#796044';c.lineWidth=1.7;c.beginPath();c.moveTo(q.x,q.y);c.lineTo(t.x,t.y);c.stroke();
   const ring=Array.from({length:6},(_,i)=>[o.x+2.5*Math.cos(i*Math.PI/3),4.2,o.z+2.5*Math.sin(i*Math.PI/3)]);
   for(let i=0;i<6;i++){face([ring[i],ring[(i+1)%6],[o.x,2.8,o.z]],'#526e43');face([ring[i],[o.x,6.5,o.z],ring[(i+1)%6]],['#7e9b56','#6e8c4c','#597b43','#54713f','#688949','#8ba760'][i]);}
   continue;
  }
  if(o.kind==='pavilion'){
   const ring=(r,y)=>Array.from({length:8},(_,i)=>[33+r*Math.cos(i*Math.PI/4+Math.PI/8),y,33+r*Math.sin(i*Math.PI/4+Math.PI/8)]);
   face(ring(5.5,.3),'#c5bca5');
   for(const a of ring(3.5,0)){const q=p(a),t=p([a[0],4.2,a[2]]);c.strokeStyle='#79563c';c.lineWidth=1.4;c.beginPath();c.moveTo(q.x,q.y);c.lineTo(t.x,t.y);c.stroke();}
   const e=ring(5.6,4.2),m=ring(2.6,5.4);for(let i=0;i<8;i++){const j=(i+1)%8;face([e[i],e[j],m[j],m[i]],i<4?'#596a7f':'#728094');face([m[i],m[j],[33,6.2,33]],i<4?'#63738a':'#8190a2');}
   continue;
  }
  const angle=o.id==='mart'?Math.PI/2:0,w=o.id==='mart'?42:o.w,d=o.id==='mart'?18:o.h;
  const v=(x,y,z)=>[o.x+x*Math.cos(angle)+z*Math.sin(angle),y,o.z-x*Math.sin(angle)+z*Math.cos(angle)];
  const f=(a,color)=>face(a.map(a=>v(...a)),color);
  const box=(x,y,z,bw,bh,bd,color)=>{const a=[[-bw/2,0,-bd/2],[bw/2,0,-bd/2],[bw/2,0,bd/2],[-bw/2,0,bd/2]].map(([xx,yy,zz])=>[xx+x,yy+y,zz+z]);const r=a.map(([x,y,z])=>[x,y+bh,z]);f([a[1],a[2],r[2],r[1]],'#a8afa5');f([a[2],a[3],r[3],r[2]],color);f(r,color);};
  const h=o.id==='mart'?5.95:o.id==='factory'?7.9:8.6;
  box(0,0,0,w,h,d,o.id==='office'?'#d7ccb2':'#bbc6b6');
  if(o.id==='office'){
   f([[-w/2,h,-d/2],[w/2,h,-d/2],[w/2,h,d/2],[-w/2,h,d/2]],'#789286');
   for(const y of[1.2,5.3])for(const x of[-16,-12,-8,0,8,12,16])f([[x-1.3,y,d/2+.1],[x+1.3,y,d/2+.1],[x+1.3,y+2.2,d/2+.1],[x-1.3,y+2.2,d/2+.1]],'#567680');
   box(0,3.8,10,9,.3,3,'#839a8e');box(12,h,-3,5,1.3,4,'#cac2ae');
  }else{
   const rise=o.id==='factory'?2.1:1.3;
   f([[-w/2,h,-d/2],[w/2,h,-d/2],[w/2,h+rise,0],[-w/2,h+rise,0]],o.id==='factory'?'#7c99ad':'#7c9489');
   f([[-w/2,h+rise,0],[w/2,h+rise,0],[w/2,h,d/2],[-w/2,h,d/2]],o.id==='factory'?'#5b7890':'#617975');
   if(o.id==='mart'){
    f([[-21,4.3,9.1],[21,4.3,9.1],[21,5.6,9.1],[-21,5.6,9.1]],'#315b43');
    for(const x of[-14,-8,-2,4])f([[x,0.6,9.15],[x+4,0.6,9.15],[x+4,3.7,9.15],[x,3.7,9.15]],'#526f70');
    box(-3,3.9,10,28,.2,2.2,'#587c53');
   }else{
    for(const x of[-12,4])f([[x-4,0,9.1],[x+4,0,9.1],[x+4,4.9,9.1],[x-4,4.9,9.1]],'#62777e');
    for(const x of[-17,-9,-1,7,15])f([[x-2,6,9.12],[x+2,6,9.12],[x+2,7.1,9.12],[x-2,7.1,9.12]],'#bdd2d0');
   }
  }
 }
}
