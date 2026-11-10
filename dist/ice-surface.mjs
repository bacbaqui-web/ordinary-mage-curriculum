import {iceEdgeOffset} from './ice-shape.mjs?v=ice-detail-1';
import * as T from './three.module.js';
const CELL=.16,HEIGHT=.12;
// Clip a regular triangular grid against the union of the ice footprints.
// Only the outer contour gets side walls, so overlapping trails have no seams.
export function iceSurfaceGeometry(zones){
 const disks=zones.filter(z=>z.kind==='i'&&z.life>0).map(z=>({...z,r:z.radius*Math.min(1,z.life/.4)}));
 const geometry=new T.BufferGeometry();if(!disks.length)return geometry;
 const minX=Math.floor(Math.min(...disks.map(d=>d.x-d.r-.28))/CELL)*CELL,minZ=Math.floor(Math.min(...disks.map(d=>d.z-d.r-.28))/CELL)*CELL;
 const nx=Math.ceil((Math.max(...disks.map(d=>d.x+d.r+.28))-minX)/CELL)+1,nz=Math.ceil((Math.max(...disks.map(d=>d.z+d.r+.28))-minZ)/CELL)+1;
 const samples=Array.from({length:(nx+1)*(nz+1)},(_,i)=>{const x=minX+i%(nx+1)*CELL,z=minZ+Math.floor(i/(nx+1))*CELL;let f=-Infinity;for(const d of disks)f=Math.max(f,d.r+iceEdgeOffset(x,z)*Math.min(1,d.life/.4)-Math.hypot(x-d.x,z-d.z));return {x,z,f};});
 const top=[],sides=[];const put=(out,a,y)=>out.push(a.x,y,a.z);
 function triangle(points){const clipped=[],crossings=[];for(let i=0;i<3;i++){const a=points[i],b=points[(i+1)%3];if(a.f>=0)clipped.push(a);if((a.f>=0)!==(b.f>=0)){const t=a.f/(a.f-b.f),p={x:a.x+(b.x-a.x)*t,z:a.z+(b.z-a.z)*t};clipped.push(p);crossings.push(p);}}
  for(let i=1;i<clipped.length-1;i++)for(const p of [clipped[0],clipped[i],clipped[i+1]])put(top,p,HEIGHT);
  if(crossings.length===2){const [a,b]=crossings;for(const [p,y] of [[a,.015],[a,HEIGHT],[b,HEIGHT],[a,.015],[b,HEIGHT],[b,.015]])put(sides,p,y);}
 }
 for(let z=0;z<nz;z++)for(let x=0;x<nx;x++){const i=z*(nx+1)+x,a=samples[i],b=samples[i+1],c=samples[i+nx+1],d=samples[i+nx+2];triangle([a,c,b]);triangle([b,c,d]);}
 geometry.setAttribute('position',new T.Float32BufferAttribute([...top,...sides],3));geometry.addGroup(0,top.length/3,0);geometry.addGroup(top.length/3,sides.length/3,1);geometry.computeVertexNormals();return geometry;
}
export class IceSurface{
 constructor(scene){this.mesh=new T.Mesh(new T.BufferGeometry(),[new T.MeshStandardMaterial({color:0xa4e6f6,roughness:.2,metalness:.08,side:T.DoubleSide,transparent:true,opacity:.5,depthWrite:false}),new T.MeshStandardMaterial({color:0x489bbd,roughness:.28,side:T.DoubleSide,transparent:true,opacity:.5,depthWrite:false})]);this.time={value:0};decorateIce(this.mesh.material[0],this.time);this.mesh.receiveShadow=true;this.mesh.visible=false;scene.add(this.mesh);this.key='';}
 update(zones){this.time.value=performance.now()/1000;const ice=zones.filter(z=>z.kind==='i'&&z.life>0),key=ice.map(z=>[z.x,z.z,z.radius,Math.min(8,Math.ceil(z.life/.4*8))].join(',')).join(';');if(key===this.key)return;this.key=key;this.mesh.geometry.dispose();this.mesh.geometry=iceSurfaceGeometry(ice);this.mesh.visible=ice.length>0;}
}

// World coordinates prevent cracks from sliding or repeating at each footprint.
function decorateIce(material,time){
 material.onBeforeCompile=shader=>{
  shader.uniforms.iceTime=time;
  shader.vertexShader='varying vec3 icePosition;\n'+shader.vertexShader;
  shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nicePosition=position;');
  shader.fragmentShader=`varying vec3 icePosition;
uniform float iceTime;
vec2 iceHash(vec2 p){return fract(sin(vec2(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3))))*43758.5453);}
`+shader.fragmentShader;
  shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
vec2 p=icePosition.xz*1.35;
p+=.12*sin(p.yx*3.1);
vec2 cell=floor(p),f=fract(p);float first=10.,second=10.;
for(int y=-1;y<=1;y++)for(int x=-1;x<=1;x++){
 vec2 offset=vec2(float(x),float(y));vec2 r=offset+iceHash(cell+offset)-f;float d=dot(r,r);
 if(d<first){second=first;first=d;}else second=min(second,d);
}
float crack=1.-smoothstep(.008,.045,second-first);
float frost=.5+.5*sin(icePosition.x*2.3+sin(icePosition.z*3.4));
diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.87,.98,1.),crack*.48+frost*.06);
vec2 sparkleP=icePosition.xz*3.6, sparkleCell=floor(sparkleP),random=iceHash(sparkleCell);
vec2 delta=abs(fract(sparkleP)-(.15+.7*random));
float pulse=pow(max(0.,sin(iceTime*1.7+random.x*35.)),14.);
float star=(exp(-delta.x*250.-delta.y*35.)+exp(-delta.y*250.-delta.x*35.))*step(.78,random.y)*pulse;
`);
  shader.fragmentShader=shader.fragmentShader.replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\ntotalEmissiveRadiance+=vec3(.65,.9,1.)*(star*.9+crack*.025);');
 };
 material.customProgramCacheKey=()=> 'ice-cracks-sparkle-1';
}
