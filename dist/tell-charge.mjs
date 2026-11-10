import * as T from './three.module.js';
import {tellFillGeometry} from './tell-fill.mjs';
import {RING_SECONDS} from './spells.mjs?v=integer-damage-1';
export function chargeTellPoints(points,progress,mode,direction){
 const p=Math.max(0,Math.min(1,progress));
 if(mode==='forward'){const dir=new T.Vector3(direction.x,0,direction.z).normalize(),start=Math.min(...points.map(v=>v.dot(dir)));return points.map(v=>v.clone().addScaledVector(dir,-(v.dot(dir)-start)*(1-p)));}
 const result=[];let start=0;
 while(start<points.length){let end=start+1;while(end<points.length&&points[end].distanceToSquared(points[start])>1e-8)end++;const loop=points.slice(start,Math.min(end+1,points.length)),box=new T.Box3().setFromPoints(loop),center=box.getCenter(new T.Vector3());for(const v of loop)result.push(v.clone().sub(center).multiplyScalar(p).add(center));start=end+1;}return result;
}
export class TellCharge{
 constructor(scene){this.mesh=new T.Mesh(new T.BufferGeometry(),new T.MeshBasicMaterial({transparent:true,opacity:.4,side:T.DoubleSide,depthWrite:false,depthTest:false}));this.mesh.renderOrder=3;this.mesh.visible=false;scene.add(this.mesh);
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.BufferAttribute(new Float32Array(24*3),3));
 const material=new T.ShaderMaterial({transparent:true,depthTest:false,depthWrite:false,blending:T.AdditiveBlending,uniforms:{tint:{value:new T.Color()},strength:{value:1}},vertexShader:'void main(){gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);gl_PointSize=10.0;}',fragmentShader:'uniform vec3 tint;uniform float strength;void main(){vec2 p=gl_PointCoord-.5;float r=length(p)*2.;float glow=pow(max(0.,1.-r),2.);float core=pow(max(0.,1.-r),9.);gl_FragColor=vec4(mix(tint,vec3(1.),core),glow*strength);}' });
 this.sparks=new T.Points(geometry,material);this.sparks.renderOrder=4;this.mesh.add(this.sparks);this.reset();}
 reset(){this.lastElapsed=0;this.completed=0;this.flashAt=-Infinity;this.mesh.visible=false;this.sparks.visible=false;this.mesh.userData.ready=false;}
 update(fill,points,charge,mode,direction,now){
 const elapsed=charge.elapsed||0,completed=Math.floor((elapsed+1e-7)/RING_SECONDS);if(elapsed<this.lastElapsed)this.completed=completed;
 if(completed>this.completed)this.flashAt=now;
 this.completed=completed;this.lastElapsed=elapsed;
 const progress=charge.pending?Math.min(1,(charge.progress||0)+(charge.pending.time||0)/RING_SECONDS):Math.max(0,Math.min(1,charge.progress||0)),flash=Math.max(0,1-(now-this.flashAt)/.35);
 const ready=progress>=1-1e-6,breath=.5+.5*Math.sin(now*2.4),glow=ready?.16+breath*.09:0;
 this.mesh.geometry.dispose();this.mesh.geometry=tellFillGeometry(chargeTellPoints(points,progress,mode,direction));this.mesh.position.copy(fill.position);this.mesh.material.color.copy(fill.material.color).lerp(new T.Color(0xffffff),Math.max(flash*.8,glow));this.mesh.material.opacity=.4+flash*.25+(ready?.06+breath*.05:0);this.mesh.visible=progress>0;
 fill.material.opacity=.09+flash*.46+(ready?.06:0);fill.material.color.lerp(new T.Color(0xffffff),Math.max(flash*.65,glow));
 this.sparks.visible=ready&&this.mesh.geometry.attributes.position.count>=3;
 if(this.sparks.visible){const pos=this.mesh.geometry.attributes.position,out=this.sparks.geometry.attributes.position,triangles=pos.count/3;this.sparks.material.uniforms.tint.value.copy(fill.material.color);this.sparks.material.uniforms.strength.value=.65+breath*.25;for(let i=0;i<out.count;i++){const triangle=(i*7%triangles)*3,u=Math.sqrt((i*.618+.17)%1),v=(i*.381+.31)%1,phase=(now*.6+i*.137)%1;const a=new T.Vector3().fromBufferAttribute(pos,triangle),b=new T.Vector3().fromBufferAttribute(pos,triangle+1),c=new T.Vector3().fromBufferAttribute(pos,triangle+2);a.multiplyScalar(1-u).addScaledVector(b,u*(1-v)).addScaledVector(c,u*v);out.setXYZ(i,a.x,a.y+.04+phase*.4,a.z);}out.needsUpdate=true;this.sparks.geometry.computeBoundingSphere();}
 this.mesh.userData.ready=ready;this.mesh.userData.progress=progress;this.mesh.userData.flash=flash;
 }
}
