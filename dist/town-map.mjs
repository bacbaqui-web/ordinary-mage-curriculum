import * as T from './three.module.js';
import {createKoreanTownKit} from './korean-town-kit.mjs';
import {loadTownAssets} from './town-assets.mjs';
import {mergeGeometries} from './vendor/BufferGeometryUtils.js';
import {BUILDINGS,CARS,TREES,BENCHES,DISTRICTS,LAMP_POSITIONS,STREET_PROPS} from './town-layout.mjs';

// Original Korean buildings, pavilion and ground; Kenney vehicles and street props.
export async function buildTownMap(scene){
 const status=document.createElement('div');status.setAttribute('role','status');status.style.cssText='position:fixed;inset:45% auto auto 50%;transform:translateX(-50%);z-index:99;background:#20352eee;color:#fff;padding:18px 24px;border-radius:10px;font:14px system-ui';status.textContent='전장을 불러오는 중…';document.body.append(status);
 try{const root=await buildTownScene(scene);status.remove();return root;}catch(error){status.setAttribute('role','alert');status.textContent='전장을 불러오지 못했습니다. 연결을 확인한 뒤 새로고침해 주세요.';throw error;}
}
async function buildTownScene(scene){
 const root=new T.Group();root.name='면소재지';scene.add(root);
 const assets=await loadTownAssets(root),place=assets.place,kit=createKoreanTownKit(root);
 const batches=new Map(),materials=new Map(),texts=[];
 const surfaces=new Map();for(const name of ['asphalt','grass','concrete','pavers']){const texture=await new T.TextureLoader().loadAsync(new URL('./assets/town-surfaces/'+name+'.png',import.meta.url).href);texture.wrapS=texture.wrapT=T.RepeatWrapping;texture.colorSpace=T.SRGBColorSpace;texture.anisotropy=8;surfaces.set(name,texture);}
 const surfaceColors=new Map([[0x74717a,'asphalt'],[0x777e80,'asphalt'],[0x8c8687,'asphalt'],[0xa5b766,'grass'],[0xcbb8aa,'pavers'],[0xcbb9ad,'pavers'],[0xc1b2a5,'concrete'],[0x8a858c,'asphalt'],[0xaaa4a7,'concrete'],[0xbeb3ad,'concrete']]);
 const unit=new T.BoxGeometry(1,1,1),matrix=new T.Matrix4(),quat=new T.Quaternion();
 function material(color){if(!materials.has(color))materials.set(color,new T.MeshStandardMaterial({color:surfaceColors.has(color)?({asphalt:0xbabcc1,grass:0xb1bd89,concrete:0xd1cdc4,pavers:0xe0d4c2}[surfaceColors.get(color)]):color,map:surfaces.get(surfaceColors.get(color))||null,roughness:.92,flatShading:true}));return materials.get(color);}
 function shape(geo,color,x,y,z,sx=1,sy=1,sz=1,ry=0){const g=geo.clone();quat.setFromAxisAngle(new T.Vector3(0,1,0),ry);matrix.compose(new T.Vector3(x,y,z),quat,new T.Vector3(sx,sy,sz));g.applyMatrix4(matrix);if(!batches.has(color))batches.set(color,[]);batches.get(color).push(g);}
 const box=(x,y,z,w,h,d,c,ry=0)=>shape(unit,c,x,y,z,w,h,d,ry);
 const slab=(x,z,w,d,c,y=.025)=>box(x,y-.06,z,w,.12,d,c);
 const cylinder=(x,y,z,r,h,c,n=8)=>shape(new T.CylinderGeometry(r,r,h,n),c,x,y,z);
 function label(text,x,y,z,w,ry=0,bg='#245944'){
  const canvas=document.createElement('canvas');canvas.width=768;canvas.height=128;const ctx=canvas.getContext('2d');ctx.fillStyle=bg;ctx.fillRect(0,0,768,128);ctx.fillStyle='#fff8e6';ctx.font='600 64px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,384,68);
  const tex=new T.CanvasTexture(canvas);tex.colorSpace=T.SRGBColorSpace;const m=new T.Mesh(new T.PlaneGeometry(w,w/6),new T.MeshBasicMaterial({map:tex}));m.position.set(x,y,z);m.rotation.y=ry;root.add(m);texts.push(m);
 }
 function beam(a,b,r,color){const start=new T.Vector3(...a),end=new T.Vector3(...b),delta=end.clone().sub(start);const g=new T.CylinderGeometry(r,r,delta.length(),5);g.applyQuaternion(new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize()));g.translate(...start.add(end).multiplyScalar(.5).toArray());if(!batches.has(color))batches.set(color,[]);batches.get(color).push(g);}
 function tree(x,z,size=1){const variant=Math.abs(Math.round(x+z))%3;place('nature-kit/'+['tree_oak','tree_default','tree_small'][variant],x,z,{h:(variant===2?4.8:5.8)*size*(.9+(Math.abs(x*3+z)%5)*.045),w:(variant===2?2.7:3.8)*size,d:(variant===2?2.9:3.6)*size,rotation:((x*13+z*7)%17)*.37});}
 function tiles(x,z,w,d,color=0xcbb8aa,y=.102){slab(x,z,w,d,color,y);for(let u=-w/2;u<=w/2;u+=2)slab(x+u,z,.025,d,0xb7a99e,y+.002);for(let v=-d/2;v<=d/2;v+=2)slab(x,z+v,w,.025,0xb7a99e,y+.003);}
 function gable(x,z,w,d,y,color){const cross=new T.Shape();cross.moveTo(-d/2-.5,0);cross.lineTo(0,2.5);cross.lineTo(d/2+.5,0);cross.closePath();const g=new T.ExtrudeGeometry(cross,{depth:w+1,bevelEnabled:false});g.rotateY(Math.PI/2);g.translate(-w/2-.5,y,0);shape(g,color,x,0,z);g.dispose();for(let u=-w/2;u<=w/2;u+=1.1){beam([x+u,y+.06,z-d/2-.4],[x+u,y+2.55,z],.045,color+0x080808);beam([x+u,y+2.55,z],[x+u,y+.06,z+d/2+.4],.045,color+0x080808);}}
 function fence(x,z,length,axis='x',solid=false){
  const horizontal=axis==='x',w=horizontal?length:.35,d=horizontal?.35:length;
  if(solid){box(x,1.1,z,w,2.2,d,0xbfb9b5);box(x,2.23,z,w+.12,.12,d+.12,0xded6cc);for(const y of[.55,1.1,1.65])box(x,y,z,horizontal?length:.37,.025,horizontal?.37:length,0xa9a3a0);for(let n=-length/2;n<length/2;n+=2)box(x+(horizontal?n:0),1.1,z+(horizontal?0:n),horizontal?.025:.37,2.2,horizontal?.37:.025,0xa9a3a0);}
  else{for(const y of[.35,1.2])box(x,y,z,horizontal?length:.1,.09,horizontal?.1:length,0x47685a);for(let n=-length/2;n<=length/2;n+=1.2)box(x+(horizontal?n:0),.65,z+(horizontal?0:n),.1,1.3,.1,0x47685a);}
  for(let n=-length/2;n<=length/2;n+=6)box(x+(horizontal?n:0),solid?1.2:.7,z+(horizontal?0:n),.45,solid?2.4:1.4,.45,solid?0xc8c7bb:0x47685a);
 }
 // Flat ground and four clear parcels; walking surfaces never create collision steps.
 slab(0,0,196,196,0xb8b1b2,-.15);
 slab(0,0,120,120,0x777e80);
 for(const d of DISTRICTS){tiles(d.x,d.z,52,52,0xcbb8aa,.015);slab(d.x,d.z,48,48,d.color,.075);}
 // Raised-looking curb trim stays low enough for unrestricted walking.
 for(const side of[-1,1])for(const center of[-33,33]){box(side*6.7,.10,center,.22,.2,51,0xe1cdb6);box(center,.10,side*6.7,51,.2,.22,0xe1cdb6);}
 for(const side of[-1,1]){slab(side*67,0,7,180,0x8c8687,.02);slab(0,side*67,180,7,0x8c8687,.021);}
 slab(0,0,10,120,0x74717a,.04);slab(0,0,120,10,0x74717a,.041);
 // Lane lines stop at intersection; paint follows the same world axes as every building.
 for(let n=-56;n<=56;n+=7)if(Math.abs(n)>9){slab(0,n,.13,3,0xe3c15d,.055);slab(n,0,3,.13,0xe3c15d,.056);}
 for(const s of[-1,1])for(let n=-3.6;n<=3.7;n+=1.2){slab(n,s*7,.65,2.6,0xdedbc9,.06);slab(s*7,n,2.6,.65,0xdedbc9,.061);}
 // Boundary follows exactly the 120m square; park uses low fencing only outside.
 fence(-60,0,120,'z',true);fence(0,-60,120,'x',true);
 fence(60,-30,60,'z',true);fence(-30,60,60,'x',true);
 fence(60,30,60,'z');fence(30,60,60,'x');
 // End-of-road closed gates visibly explain the playable perimeter.
 for(const s of[-1,1]){box(0,.85,s*59.8,9,1.5,.25,0x57716c);box(s*59.8,.85,0,.25,1.5,9,0x57716c);}
 // Local coordinates for facade details; all facades have a single declared orientation.
 function local(b,u,y,v,w,h,d,c){const co=Math.cos(b.front),si=Math.sin(b.front);box(b.x+u*co+v*si,y,b.z-u*si+v*co,w,h,d,c,b.front);}
 for(const b of BUILDINGS)kit[b.id](b);
 function parking(x,z,count){for(let i=0;i<=count;i++)slab(x,z+i*3,5.6,.13,0xd6d3c4,.09);slab(x+2.8,z+count*1.5,.13,count*3,0xd6d3c4,.091);}
 parking(-32,12,5);parking(-32,36,6);parking(-16,39,5);parking(-14,-33,7);parking(21,-35,7);parking(42,-29,6);
 let carIndex=0;for(const c of CARS){place('car-kit/'+(c.truck?'delivery':['sedan','suv','hatchback-sports'][carIndex++%3]),c.x,c.z,{w:c.truck?2.8:2.1,d:c.truck?6.8:4.5,h:c.truck?3.2:1.7,rotation:c.truck?0:Math.PI/2});}
 // Cargo kept at the edges, away from open encounter spaces.
 for(const o of[{x:-52,z:-34},{x:-52,z:8}])for(let j=0;j<3;j++)for(let k=0;k<2;k++){box(o.x+j*.9,.45+k*.8,o.z,.8,.75,1.5,0xbb9560);box(o.x+j*.9,.45+k*.8,o.z+.76,.65,.04,.03,0x886c45);}
 // Park: square loop and four entrances, pavilion exactly at (33,33).
 slab(33,33,43,43,0xa5b766,.045);for(const n of[14,52]){slab(n,33,2,40,0xcdb8a9,.10);slab(33,n,40,2,0xcdb8a9,.10);}
 tiles(33,33,50,4);tiles(33,33,4,50);cylinder(33,.05,33,14.5,.12,0xcbb8aa,8);for(let n=-10;n<=10;n+=2){slab(33+n,33,.025,20,0xb7a99e,.112);slab(33,33+n,20,.025,0xb7a99e,.112);}
 cylinder(33,.12,33,5.5,.2,0xa9a89c,8);cylinder(33,.29,33,4.9,.22,0xc5c0ac,8);cylinder(33,.49,33,4.2,.25,0xa98053,8);
 for(let i=0;i<8;i++){const a=i*Math.PI/4+Math.PI/8;cylinder(33+3.5*Math.cos(a),2.2,33+3.5*Math.sin(a),.19,3.5,0x725137,8);}
 // Shallow swept eaves and roof ribs give the octagonal pavilion its Korean silhouette.
 const roofShape=new T.BufferGeometry(),verts=[];const rings=[[5.6,4.2],[4.7,4.4],[2.6,5.4],[.3,6.2]];
 for(let j=0;j<rings.length-1;j++)for(let i=0;i<8;i++){const point=(k,n)=>{const a=n*Math.PI/4+Math.PI/8;return[33+Math.cos(a)*rings[k][0],rings[k][1],33+Math.sin(a)*rings[k][0]];};const a=point(j,i),b=point(j,i+1),c=point(j+1,i),d=point(j+1,i+1);verts.push(...a,...c,...b,...b,...c,...d);}
 roofShape.setAttribute('position',new T.Float32BufferAttribute(verts,3));roofShape.computeVertexNormals();shape(roofShape,0x4c5970,0,0,0);roofShape.dispose();
 for(let i=0;i<8;i++){const a=i*Math.PI/4+Math.PI/8;for(let j=0;j<rings.length-1;j++)beam([33+Math.cos(a)*rings[j][0],rings[j][1]+.04,33+Math.sin(a)*rings[j][0]],[33+Math.cos(a)*rings[j+1][0],rings[j+1][1]+.04,33+Math.sin(a)*rings[j+1][0]],.065,0x6c768a);
 const b=a+Math.PI/4;beam([33+Math.cos(a)*3.5,3.7,33+Math.sin(a)*3.5],[33+Math.cos(b)*3.5,3.7,33+Math.sin(b)*3.5],.15,0x8b5931);
 if(i%2===0)for(const y of[.85,1.5])beam([33+Math.cos(a)*3.5,y,33+Math.sin(a)*3.5],[33+Math.cos(b)*3.5,y,33+Math.sin(b)*3.5],.08,0x9a6534);}
 for(let side=0;side<8;side++){
  const a=side*Math.PI/4+Math.PI/8,b=a+Math.PI/4;
  if(side%2===0)for(let j=1;j<7;j++){const t=j/7,x=33+3.5*((1-t)*Math.cos(a)+t*Math.cos(b)),z=33+3.5*((1-t)*Math.sin(a)+t*Math.sin(b));beam([x,.85,z],[x,1.5,z],.04,0xae793b);}
  for(let k=1;k<9;k++){const t=k/9;const rx=(1-t)*Math.cos(a)+t*Math.cos(b),rz=(1-t)*Math.sin(a)+t*Math.sin(b);for(let j=0;j<rings.length-1;j++)beam([33+rx*rings[j][0],rings[j][1]+.035,33+rz*rings[j][0]],[33+rx*rings[j+1][0],rings[j+1][1]+.035,33+rz*rings[j+1][0]],.028,0x647089);}
 }
 cylinder(33,6.5,33,.17,.55,0x485367,8);

 for(const b of BENCHES){box(b.x,.6,b.z,3,.17,.8,0x9e7851);box(b.x,1,b.z-.35,3,.65,.12,0x9e7851);for(const dx of[-1,1])box(b.x+dx,.3,b.z,.12,.6,.7,0x42534b);}
 for(const t of TREES)tree(t.x,t.z,1.08);
 // Street kit: poles, paving, transit and service furniture share the gameplay layout.
 function disc(x,y,z,r,color){const g=new T.CircleGeometry(r,20);g.rotateX(-Math.PI/2);shape(g,color,x,y,z);g.dispose();}
 function poleLamp(x,z,rotation=0){place('city-kit-roads/light-curved',x,z,{scale:8.6,rotation:rotation+Math.PI/2});}
 // Narrow sidewalk tiles, tree pits and individual curbstones keep the street legible.
 for(const sign of[-1,1])for(let n=-58;n<59;n+=1){if(Math.abs(n)>9){
  for(const lane of[5.4,6,6.6]){slab(sign*lane,n,.55,.92,((n+58)%3===0?0xd8bfb0:0xcbb9ad),.083);slab(n,sign*lane,.92,.55,((n+58)%3===0?0xd8bfb0:0xcbb9ad),.084);}
  box(sign*5.05,.08,n,.18,.16,.94,0xdbd0c2);box(n,.08,sign*5.05,.94,.16,.18,0xdbd0c2);
 }}
 for(const t of TREES)if(Math.abs(t.x)===8||Math.abs(t.z)===8){slab(t.x,t.z,1.65,1.65,0x625e4a,.087);for(const v of[-.84,.84]){box(t.x+v,.13,t.z,.10,.18,1.8,0xc1bab0);box(t.x,.13,t.z+v,1.8,.18,.10,0xc1bab0);}}
 // Tactile warning strips sit at the ends of the existing pedestrian crossings.
 for(const sign of[-1,1])for(const other of[-1,1])for(let j=0;j<3;j++){
  slab(sign*5.6,other*(6.2+j*.7),.85,.62,0xd8b34c,.097);slab(other*(6.2+j*.7),sign*5.6,.62,.85,0xd8b34c,.098);
  for(let a=0;a<3;a++)for(let b=0;b<3;b++){cylinder(sign*5.6+(a-1)*.21,.105,other*(6.2+j*.7)+(b-1)*.18,.035,.025,0xf0ca64,6);}
 }
 for(const n of[-44,-24,24,44])for(const side of[-1,1]){slab(side*4.65,n,.45,1,0x4a5356,.08);for(let k=-.4;k<.5;k+=.15)slab(side*4.65,n+k,.38,.035,0x9a9f9c,.085);}
 for(const [x,z] of[[-2,-24],[2,26],[-34,2],[37,-2]]){disc(x,.065,z,.58,0x5b6064);for(let i=-2;i<=2;i++)slab(x+i*.15,z,.035,.7,0x8f9290,.072);}
 for(const p of STREET_PROPS){
  if(p.kind==='signal'){
   place('city-kit-roads/traffic-light-hanging',p.x,p.z,{scale:12,rotation:p.front-Math.PI/2});
  }else if(p.kind==='shelter'){
   for(const z of[-2.6,2.6]){cylinder(p.x,1.45,p.z+z,.07,2.9,0x465e59,6);}
   box(p.x,2.95,p.z,1.9,.18,6.1,0x52766b);box(p.x-.75,1.55,p.z,.08,2.5,5.4,0xa0bab7);
   for(const z of[-2.6,0,2.6])box(p.x-.69,1.55,p.z+z,.08,2.6,.07,0x4c6a64);
   box(p.x,.7,p.z,.65,.15,4,0xa18663);for(const z of[-1.5,1.5])box(p.x,.35,p.z+z,.5,.7,.10,0x4c6a64);
   label('중앙 정류장',p.x+.97,2.9,p.z,4.5,Math.PI/2,'#52766b');
  }else if(p.kind==='notice'){
   for(const dx of[-1.2,1.2])box(p.x+dx,1.2,p.z,.13,2.4,.13,0x5b7165);
   box(p.x,2,p.z,2.8,1.5,.25,0x5b7165);box(p.x,2,p.z+.14,2.5,1.2,.035,0xe7debd);for(const dx of[-.8,0,.8])box(p.x+dx,2.05,p.z+.18,.6,.85,.025,0xf6f0df);
  }else if(p.kind==='recycle'){
   place('city-kit-roads/dumpster',p.x,p.z,{w:3.4,d:1.4,h:1.4});
  }else{cylinder(p.x,.55,p.z,.34,1.1,0x526e5b,8);cylinder(p.x,1.13,p.z,.38,.12,0x3f5549,8);}
 }
 // Low planting remains tucked against walls, never in open combat floors.
 for(const b of BUILDINGS){
  const width=b.front?b.h:b.w,depth=b.front?b.w:b.h;
  for(const u of[-width/2+2,width/2-2]){local(b,u,.22,depth/2+.8,2.7,.35,1.2,0xc8bbae);for(const offset of[-.8,0,.8])local(b,u+offset,.65,depth/2+.8,.85,.65,.9,0x7c9740);}
 }
 // Lamps on pavement; power lines follow the outer streets.
 for(const [x,z] of LAMP_POSITIONS)poleLamp(x,z,Math.abs(z)===6?Math.PI/2:0);
 // Diverse residential backdrop, outside the collidable square.
 let houseIndex=0;
 function house(x,z,rotation){const i=houseIndex++;kit.house(x,z,rotation,i);if(i%3!==1)tree(x+7,z-5,.65+(i%3)*.12);slab(x,z,16,18,0xc1b2a5,.005);}
 for(const [i,n] of [-66,-47,-29,-10,10,29,48,66].entries()){const setback=[0,1.8,-.5,2.7,-.8,1.2,0,2][i];house(-77-setback,n,Math.PI/2);house(77+setback,n+(i%2?1:-1),-Math.PI/2);house(n,-78-setback,0);house(n,78+setback,Math.PI);}
 // Custom concrete utility poles and Kenney sagging cables stay outside the combat boundary.
 for(const z of[-65,65]){
  for(let x=-65;x<=65;x+=26)kit.pole(x,z);
  for(let x=-52;x<65;x+=26)place('city-kit-roads/electricity-wires',x,z,{w:26,d:2.75,h:1.15,y:7.85});
 }
 for(const x of[-65,65]){
  for(let z=-39;z<=39;z+=26)kit.pole(x,z,Math.PI/2);
  for(let z=-52;z<65;z+=26)place('city-kit-roads/electricity-wires',x,z,{w:26,d:2.75,h:1.15,y:7.85,rotation:Math.PI/2});
 }
 assets.finish();kit.finish();
 // Merge static pieces by material for bounded draw calls instead of thousands of meshes.
 for(const [color,geos] of batches){const merged=mergeGeometries(geos,false);for(const g of geos)g.dispose();if(surfaceColors.has(color)){const pos=merged.attributes.position,uv=new Float32Array(pos.count*2),repeat=surfaceColors.get(color)==='pavers'?2:5;for(let i=0;i<pos.count;i++){uv[i*2]=pos.getX(i)/repeat;uv[i*2+1]=pos.getZ(i)/repeat;}merged.setAttribute('uv',new T.BufferAttribute(uv,2));}const m=new T.Mesh(merged,material(color));m.castShadow=true;m.receiveShadow=true;root.add(m);}
 unit.dispose();root.userData={...root.userData,districts:DISTRICTS,bounds:120,staticBatches:batches.size};return root;
}
export function lightTown(scene){scene.background=new T.Color(0xc2c4ba);scene.add(new T.HemisphereLight(0xf1f2e8,0x8e9580,2.0));const sun=new T.DirectionalLight(0xfff1d9,2.3);sun.position.set(-50,100,55);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-110,right:110,top:110,bottom:-110,far:280});sun.shadow.normalBias=.08;sun.shadow.bias=-.0001;scene.add(sun);return sun;}
