import * as T from './three.module.js';
const CELL=.16,HEIGHT=.12;
// Clip a regular triangular grid against the union of the ice footprints.
// Only the outer contour gets side walls, so overlapping trails have no seams.
export function iceSurfaceGeometry(zones){
 const disks=zones.filter(z=>z.kind==='i'&&z.life>0).map(z=>({...z,r:z.radius*Math.min(1,z.life/.4)}));
 const geometry=new T.BufferGeometry();if(!disks.length)return geometry;
 const minX=Math.floor(Math.min(...disks.map(d=>d.x-d.r))/CELL)*CELL,minZ=Math.floor(Math.min(...disks.map(d=>d.z-d.r))/CELL)*CELL;
 const nx=Math.ceil((Math.max(...disks.map(d=>d.x+d.r))-minX)/CELL)+1,nz=Math.ceil((Math.max(...disks.map(d=>d.z+d.r))-minZ)/CELL)+1;
 const samples=Array.from({length:(nx+1)*(nz+1)},(_,i)=>{const x=minX+i%(nx+1)*CELL,z=minZ+Math.floor(i/(nx+1))*CELL;let f=-Infinity;for(const d of disks)f=Math.max(f,d.r-Math.hypot(x-d.x,z-d.z));return {x,z,f};});
 const top=[],sides=[];const put=(out,a,y)=>out.push(a.x,y,a.z);
 function triangle(points){const clipped=[],crossings=[];for(let i=0;i<3;i++){const a=points[i],b=points[(i+1)%3];if(a.f>=0)clipped.push(a);if((a.f>=0)!==(b.f>=0)){const t=a.f/(a.f-b.f),p={x:a.x+(b.x-a.x)*t,z:a.z+(b.z-a.z)*t};clipped.push(p);crossings.push(p);}}
  for(let i=1;i<clipped.length-1;i++)for(const p of [clipped[0],clipped[i],clipped[i+1]])put(top,p,HEIGHT);
  if(crossings.length===2){const [a,b]=crossings;for(const [p,y] of [[a,.015],[a,HEIGHT],[b,HEIGHT],[a,.015],[b,HEIGHT],[b,.015]])put(sides,p,y);}
 }
 for(let z=0;z<nz;z++)for(let x=0;x<nx;x++){const i=z*(nx+1)+x,a=samples[i],b=samples[i+1],c=samples[i+nx+1],d=samples[i+nx+2];triangle([a,c,b]);triangle([b,c,d]);}
 geometry.setAttribute('position',new T.Float32BufferAttribute([...top,...sides],3));geometry.addGroup(0,top.length/3,0);geometry.addGroup(top.length/3,sides.length/3,1);geometry.computeVertexNormals();return geometry;
}
export class IceSurface{
 constructor(scene){this.mesh=new T.Mesh(new T.BufferGeometry(),[new T.MeshStandardMaterial({color:0xa4e6f6,roughness:.2,metalness:.08,side:T.DoubleSide,transparent:true,opacity:.5,depthWrite:false}),new T.MeshStandardMaterial({color:0x489bbd,roughness:.28,side:T.DoubleSide,transparent:true,opacity:.5,depthWrite:false})]);this.mesh.receiveShadow=true;this.mesh.visible=false;scene.add(this.mesh);this.key='';}
 update(zones){const ice=zones.filter(z=>z.kind==='i'&&z.life>0),key=ice.map(z=>[z.x,z.z,z.radius,Math.min(8,Math.ceil(z.life/.4*8))].join(',')).join(';');if(key===this.key)return;this.key=key;this.mesh.geometry.dispose();this.mesh.geometry=iceSurfaceGeometry(ice);this.mesh.visible=ice.length>0;}
}
