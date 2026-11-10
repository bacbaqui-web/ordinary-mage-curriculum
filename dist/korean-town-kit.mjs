import * as T from './three.module.js';
import {mergeGeometries} from './vendor/BufferGeometryUtils.js';

// Original metre-scale meshes. Local +Z is always the street-facing facade.
export function createKoreanTownKit(root){
 const batches=new Map(),materials=new Map(),records=[];
 let frame={x:0,z:0,angle:0};
 function texture(){
  const c=document.createElement('canvas');c.width=512;c.height=256;const g=c.getContext('2d');g.fillStyle='#ad9b88';g.fillRect(0,0,512,256);
  for(let row=0;row<8;row++)for(let col=-1;col<9;col++){
   const n=(row*17+col*13+100)%5;g.fillStyle=['#955d46','#a16b51','#ae7357','#8e5845','#b47b60'][n];g.fillRect(col*64+(row%2)*32+2,row*32+2,60,28);
   g.fillStyle='#ffffff0a';g.fillRect(col*64+(row%2)*32+4,row*32+4,56,2);
  }
  const t=new T.CanvasTexture(c);t.wrapS=t.wrapT=T.RepeatWrapping;t.colorSpace=T.SRGBColorSpace;t.anisotropy=8;return t;
 }
 const brick=texture();
 function mat(c){if(!materials.has(c))materials.set(c,new T.MeshStandardMaterial({color:c==='brick'?0xffffff:c,map:c==='brick'?brick:null,roughness:.88}));return materials.get(c);}
 function emit(g,c){
  if(c==='brick'){const p=g.attributes.position,n=g.attributes.normal,uv=new Float32Array(p.count*2);for(let i=0;i<p.count;i++){uv[i*2]=(Math.abs(n.getX(i))>.5?p.getZ(i):p.getX(i))/2;uv[i*2+1]=p.getY(i); }g.setAttribute('uv',new T.BufferAttribute(uv,2));}
  g.rotateY(frame.angle);g.translate(frame.x,0,frame.z);const geo=g.index?g.toNonIndexed():g;if(geo!==g)g.dispose();
  for(const a of Object.keys(geo.attributes))if(!['position','normal','uv'].includes(a))geo.deleteAttribute(a);
  if(!geo.attributes.uv)geo.setAttribute('uv',new T.Float32BufferAttribute(new Float32Array(geo.attributes.position.count*2),2));
  if(!batches.has(c))batches.set(c,[]);batches.get(c).push(geo);
 }
 function box(x,y,z,w,h,d,c){const g=new T.BoxGeometry(w,h,d);g.translate(x,y,z);emit(g,c);}
 function cylinder(x,y,z,r,h,c){const g=new T.CylinderGeometry(r*.92,r,h,10);g.translate(x,y,z);emit(g,c);}
 function beam(a,b,r,c){const start=new T.Vector3(...a),end=new T.Vector3(...b),v=end.clone().sub(start);const g=new T.CylinderGeometry(r,r,v.length(),6);g.applyQuaternion(new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),v.normalize()));g.translate(...start.add(end).multiplyScalar(.5).toArray());emit(g,c);}
 function sign(text,x,y,z,w,h,bg='#375f4a',fg='#fff5dd'){
  const c=document.createElement('canvas');c.width=1024;c.height=Math.max(64,Math.round(1024*h/w));const g=c.getContext('2d');g.fillStyle=bg;g.fillRect(0,0,c.width,c.height);g.fillStyle=fg;g.textAlign='center';g.textBaseline='middle';g.font='700 '+Math.round(c.height*.78)+'px sans-serif';g.fillText(text==='태극기'?'':text,512,c.height*.53,960);
  if(text==='태극기'){
   const cx=512,cy=c.height/2,r=c.height*.22;g.save();g.translate(cx,cy);g.rotate(.5);
   g.fillStyle='#c34b4b';g.beginPath();g.arc(0,0,r,Math.PI,Math.PI*2);g.fill();g.fillStyle='#356a93';g.beginPath();g.arc(0,0,r,0,Math.PI);g.fill();
   g.fillStyle='#c34b4b';g.beginPath();g.arc(-r/2,0,r/2,0,Math.PI*2);g.fill();g.fillStyle='#356a93';g.beginPath();g.arc(r/2,0,r/2,0,Math.PI*2);g.fill();g.restore();
   for(const [sx,sy,broken]of[[-1,-1,0],[1,1,7],[1,-1,5],[-1,1,2]]){g.save();g.translate(cx+sx*r*1.7,cy+sy*r*1.1);g.rotate(sx*sy*-.6);g.fillStyle='#35403b';for(let j=0;j<3;j++){const yy=(j-1)*r*.23;if(broken&(1<<j)){g.fillRect(-r*.55,yy,r*.46,r*.12);g.fillRect(r*.09,yy,r*.46,r*.12);}else g.fillRect(-r*.55,yy,r*1.1,r*.12);}g.restore();}
  }
  const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;const m=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({map:tex,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2}));m.rotation.y=frame.angle;m.position.set(frame.x+x*Math.cos(frame.angle)+(z+.08)*Math.sin(frame.angle),y,frame.z-x*Math.sin(frame.angle)+(z+.08)*Math.cos(frame.angle));root.add(m);
 }
 function window(x,y,z,w=1.6,h=1.65){
  box(x,y,z,w+.18,h+.18,.17,0xe0dacf);box(x,y,z+.10,w,h,.05,0x537078);
  box(x,y,z+.15,.065,h,.055,0xc2c8c2);box(x,y-h/2-.1,z+.10,w+.30,.12,.3,0xbcb9aa);
  box(x-w*.23,y+.05,z+.14,w*.38,h*.88,.025,0x739094);
 }
 function ac(x,y,z){box(x,y,z,1,.65,.5,0xd7d4c6);const g=new T.CylinderGeometry(.23,.23,.025,12);g.rotateX(Math.PI/2);g.translate(x,y,z+.265);emit(g,0x89928a);for(let n=-2;n<=2;n++)box(x+n*.065,y,z+.29,.025,.4,.025,0xc2c4b8);}
 function flatRoof(w,d,y,tone=0x789286){
  box(0,y,0,w,.22,d,0xb9b5a4);box(0,y+.13,0,w-.5,.08,d-.5,tone);
  // Faded waterproofing along parapets and repairs around drains.
  for(const side of[-1,1])box(side*(w/2-.43),y+.177,0,.36,.018,d-.6,0x8c9b89);
  box(w/2-.7,y+.19,-d/2+.7,.44,.025,.44,0x626f65);
  if(w>25)for(let x=-w/2+6;x<w/2;x+=7)box(x,y+.178,0,.025,.015,d-.7,0x6e857b);
  for(const side of[-1,1]){box(side*(w/2-.12),y+.46,0,.24,.8,d,0xc9c3b2);box(0,y+.46,side*(d/2-.12),w,.8,.24,0xc9c3b2);box(side*w/2,y+.89,0,.35,.10,d+.2,0xe1d9c6);box(0,y+.89,side*d/2,w+.2,.10,.35,0xe1d9c6);}
 }
 function roof(w,d,y,rise,color){
  const points=[[-w/2,y,-d/2],[w/2,y,-d/2],[-w/2,y+rise,0],[w/2,y+rise,0],[-w/2,y,d/2],[w/2,y,d/2]];
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(points.flat(),3));g.setIndex([0,2,1,1,2,3,2,4,3,3,4,5,0,4,2,1,3,5]);const flat=g.toNonIndexed();g.dispose();flat.computeVertexNormals();emit(flat,color);
  for(let x=-w/2+.3;x<w/2;x+=1.2){beam([x,y+.10,-d/2],[x,y+rise+.10,0],.035,0x8b9995);beam([x,y+rise+.10,0],[x,y+.10,d/2],.035,0x8b9995);}
  beam([-w/2,y+rise,0],[w/2,y+rise,0],.11,color);
 }
 function set(kind,x,z,angle,w,d){frame={x,z,angle};records.push({kind,x,z,angle,w,d});}
 function mart(b){
  set('mart',b.x,b.z,b.front,42,18);
  box(0,.25,0,42,.5,18,0xa6a79b);box(0,3.05,0,41.8,5.6,17.8,0xd5d4bc);
  // Broad horizontal proportions, sheet cladding and a shallow metal roof.
  for(let x=-20.5;x<21;x+=.8)box(x,3.1,8.94,.035,5.6,.04,0xb7bcae);
  for(const side of[-1,1])for(let z=-8.5;z<9;z+=.8)box(side*20.94,3.1,z,.04,5.6,.035,0xb7bcae);
  roof(42,18,5.95,1.3,0x617975);
  box(0,4.9,9.02,41.8,1.35,.22,0x315b43);sign('중앙 식자재마트',0,4.93,9.15,15,1.25);
  sign('농산 · 축산 · 수산',-14.5,4.92,9.16,9,.55);sign('도매 · 소매',15.2,4.92,9.16,8,.6);
  for(let x=-14;x<=9;x+=3.8)window(x,2.25,9.02,3.35,3.45);
  // Sliding entrance and a long projecting sunshade, mounted above walking height.
  box(2,1.95,9.26,5,3.8,.10,0x435f60);for(const x of[-.5,2,4.5])box(x,1.95,9.34,.065,3.8,.05,0xd7d7c4);
  for(const x of[1.7,2.3])box(x,1.75,9.40,.045,.65,.06,0xe5e0d0);
  box(-3,4.1,10,28,.18,2.2,0x587c53);box(-3,3.92,11,28,.3,.10,0x3f6243);
  // Roller loading door at the end of the facade.
  box(16.8,1.95,9.04,5,3.6,.15,0x9baba4);for(let y=.3;y<3.8;y+=.23)box(16.8,y,9.15,4.9,.025,.025,0x74857f);
  sign('상품 하역',16.8,3.95,9.18,3,.35,'#d8d5bd','#3f5148');
  for(const x of[-9,6]){box(x,4.25,9.38,.7,.14,.28,0xb9bfb0);box(x,4.2,9.53,.55,.05,.06,0xe5dfba);}
  sign('영업중',3.1,2.3,9.46,.65,.45,'#e2d3b1','#984c3e');
  for(const x of[-18.5,19.7]){ac(x,1,9.4);beam([x,5.5,8.96],[x,.3,8.96],.065,0x82908a);}
 }
 function office(b){
  set('office',b.x,b.z,0,40,17);
  box(0,.3,0,40,.6,17,0xa9a99a);box(0,4.4,0,39.8,8.2,16.8,0xd7ccb2);
  flatRoof(40,17,8.6);
  for(const y of[2.3,6.4])for(const x of[-16,-12,-8,8,12,16])window(x,y,8.45,2.7,2.25);
  const officeFrame={...frame};for(const side of[-1,1]){frame.angle=side*Math.PI/2;for(const y of[2.3,6.4])for(const x of[-5,0,5])window(x,y,20,2.3,2.25);}frame=officeFrame;
  for(const y of[.9,4.5,8.25])box(0,y,8.47,40,.16,.18,0xb4ad97);
  box(0,4.4,8.5,6.6,8.2,.4,0xbeb59f);window(0,6.4,8.8,4.8,2.3);window(0,2.1,8.8,4.8,3.5);
  box(0,3.9,9.5,9,.28,3.1,0x7c8d85);for(const x of[-4,4])box(x,1.9,10.55,.3,3.8,.3,0xc3c0af);
  sign('중 앙 면 사 무 소',0,4.65,8.83,8.5,.75,'#d4cbb4','#304e51');
  for(let i=0;i<3;i++)box(0,.12+i*.12,9.2-i*.35,8,.24+i*.24,1.9-i*.4,0xb9b6a6);
  box(12,9.3,-3,5,1.3,4,0xcac2ae);for(const x of[-12,-7,8])ac(x,9,0);
  cylinder(17,4.7,11,.065,9.4,0xc1c7bd);sign('태극기',18.05,7.8,11.02,2.1,1.35,'#f0eee3','#33547a');
 }
 function factory(b){
  set('factory',b.x,b.z,0,44,18);box(0,3.9,0,43.8,7.8,17.8,0xbbc6c1);roof(44,18,7.9,2.1,0x5b7890);
  for(let x=-21.5;x<22;x+=.8)box(x,3.8,8.94,.035,7.5,.04,0x91a19e);
  for(const x of[-12,4]){box(x,2.5,9,8,4.9,.15,0x6b7c7e);for(let y=.2;y<4.9;y+=.3)box(x,y,9.1,7.9,.03,.03,0x8c9a97);}
  for(const x of[-17,-9,-1,7,15])window(x,6.5,8.98,4,1.15);
  sign('한 빛 정 밀',13,3.5,9.12,8,1,'#ebe7d4','#3b5660');
  for(const x of[-20,20])cylinder(x,4.1,9,.12,8.2,0x7d8d86);
 }
 function house(x,z,angle,i){
  const kind=i%5,w=[9.2,10.6,11.2,9,12][kind]+((i*7)%4-1.5)*.45,d=[9.5,10,9,10,9.5][kind]+(i%3-1)*.65,two=kind!==2&&(kind!==3||i%2===0),h=(two?6.3:3.35)+(i%3)*.22;
  set(['brick-house','shop-house','tile-house','plaster-house','corner-shop'][kind],x,z,angle,w,d);
  box(0,.2,0,w+.2,.4,d+.2,0xa8a294);box(0,h/2+.2,0,w,h,d,kind===0||kind===2?'brick':[0xd5c8ad,0xc1b7a3,0xc9c3b3,0xd9cfb8,0xc0b7a0][kind]);
  if(kind===2){roof(w+.5,d+.6,h+.3,1.45,0x4f666c);for(let xx=-w/2;xx<w/2;xx+=.28)beam([xx,h+.32,d/2+.3],[xx,h+1.77,0],.045,0x657b7d);}
  else{
   flatRoof(w,d,h+.2,[0x789286,0x88988a,0x7d958d,0x899b90][i%4]);
   if(i%3!==1){const rx=(i%2?1:-1)*w*.24;box(rx,h+1.15,-d*.24,2.8,1.9,3.1,kind===0?'brick':0xc1b8a3);box(rx,h+2.17,-d*.24,3,.16,3.3,0xa7a899);window(rx,h+1.15,-d*.24+1.58,1.05,1.3);}
   if(i%3===0){cylinder(w*.23,h+.9,-d*.25,.58,1.3,0xa0b4af);cylinder(w*.23,h+1.6,-d*.25,.65,.12,0xc7d1c7);}
   if(i%2===0)ac(-w*.25,h+.75,d*.1);
   if(i%4===1){
    for(const xx of[-2,2])beam([xx,h+.3,-1],[xx,h+1.6,-1],.035,0x7a8178);
    beam([-2,h+1.5,-1],[2,h+1.5,-1],.015,0x7a8178);
    for(let n=0;n<3;n++)box(-1.3+n*1.1,h+1.05,-1,.7,.85,.025,[0xd5c6b5,0x8c9ea0,0xc7b4a1][n]);
   }
   if(i%3===2){for(const y of[h+.75,h+1.2])beam([-w/2+.5,y,d/2-.35],[w/2-.5,y,d/2-.35],.025,0x58665f);for(let xx=-w/2+.5;xx<w/2;xx+=.7)beam([xx,h+.4,d/2-.35],[xx,h+1.2,d/2-.35],.025,0x58665f);}

  }
  for(const y of(two?[1.95,h-1.35]:[1.95]))for(const xx of[-w*.27,w*.27])window(xx,y,d/2+.03,2,1.65);
  // Side windows avoid blank walls in the fixed quarter view.
  const saved={...frame};for(const side of[-1,1]){frame.angle=saved.angle+side*Math.PI/2;for(const y of(two?[1.95,h-1.35]:[1.95]))for(const xx of[-d*.25,d*.25])window(xx,y,w/2+.03,1.7,1.6);}frame.angle=saved.angle+Math.PI;for(const y of(two?[1.95,h-1.35]:[1.95]))for(const xx of[-w*.25,w*.25])window(xx,y,d/2+.03,1.5,1.4);frame=saved;
  if(kind===1||kind===4){
   box(0,1.7,d/2+.13,w-.7,2.8,.08,0x476968);for(let xx=-w/2+.5;xx<w/2;xx+=1.8)box(xx,1.7,d/2+.21,.07,2.8,.05,0xc9cbbd);
   sign(['중앙철물','동네미용실','우리세탁소','중앙부동산'][Math.floor(i/5)%4],0,3.25,d/2+.27,w-.5,.9,['#396a69','#7b4c46','#c3ad76','#536278'][Math.floor(i/5)%4]);
   box(0,2.8,d/2+.75,w,.12,1.4,0x9c8761);for(let xx=-w/2;xx<w/2;xx+=.5)box(xx,2.82,d/2+.75,.2,.12,1.4,0xd0bb8e);
  }else{box(0,1.2,d/2+.16,1.3,2.3,.10,0x5f6c64);box(0,.12,d/2+.5,2,.24,.9,0xb6b0a0);}
  if(two&&i%4===0){
   box(-w*.22,3.8,d/2+.65,w*.48,.17,1.5,0xb4b0a0);
   for(const yy of[4.05,4.65])beam([-w*.46,yy,d/2+1.32],[w*.02,yy,d/2+1.32],.035,0x5d706b);
   for(let xx=-w*.46;xx<w*.03;xx+=.55)beam([xx,3.9,d/2+1.32],[xx,4.65,d/2+1.32],.025,0x5d706b);
  }
  if(i%2===1)for(const xx of[-w*.27,w*.27])box(xx-.5,two?h-1.35:1.95,d/2+.19,.42,1.35,.02,0xc5c2b1);
  ac(w/2-.8,1,d/2+.4);beam([w/2-.25,.4,d/2+.18],[w/2-.25,h+.3,d/2+.18],.055,0x7c8880);
  // Short garden wall, gate, kimchi jars and planters are separate silhouettes.
  box(-w/2-1,.6,0,.22,1.2,d+3,0xa69d8a);box(0,.6,-d/2-1.4,w+2,1.2,.22,0xa69d8a);
  for(let n=0;n<(i%3===0?3:1);n++){cylinder(-w/2-.65,.45,d/2-1.5-n*.7,.26,.7,0x655244);cylinder(-w/2-.65,.83,d/2-1.5-n*.7,.29,.08,0x4e4239);}
  // Planting and small paving patches belong to the house rather than a repeated display plinth.
  for(let n=0;n<2+i%3;n++){
   const px=w/2+.6,pz=-d/2+1+n*1.1;cylinder(px,.28,pz,.32,.5,0x9b7560);
   const shrub=new T.IcosahedronGeometry(.48+(n%2)*.12,1);shrub.scale(1,.8,1);shrub.translate(px,.8,pz);emit(shrub,[0x71845c,0x849365,0x607952][n%3]);
  }
  box(0,.04,d/2+1.2,2.2,.08,2,0xb9b3a2);
 }
 function pole(x,z,angle=0){set('utility-pole',x,z,angle,.4,.4);cylinder(0,4.7,0,.16,9.4,0xa8afa6);box(0,8.9,0,.16,.16,3,0x727f78);for(const v of[-1.2,0,1.2]){cylinder(0,9.08,v,.11,.24,0xd0d2bb);cylinder(0,9.2,v,.14,.08,0xa2b0a6);}box(.38,6.9,0,.5,1.1,.65,0xabb5ad);for(const y of[1,1.5])box(.01,y,.16,.2,.28,.04,0x4a4d45);}
 function finish(){for(const[c,geos]of batches){const g=mergeGeometries(geos,false);if(!g)throw new Error('한국식 건물 모델을 합치지 못했습니다.');const m=new T.Mesh(g,mat(c));m.castShadow=![0x8b9995,0x657b7d,0x8c9b89,0x6e857b,0x626f65].includes(c);m.receiveShadow=![0x8b9995,0x657b7d,0x8c9b89,0x6e857b,0x626f65].includes(c);m.name='한국식 건물 · '+c;root.add(m);for(const geo of geos)geo.dispose();}root.userData.koreanKit={buildings:records.filter(r=>r.kind!=='utility-pole'),batches:batches.size};}
 return {mart,office,factory,house,pole,finish};
}
