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
 constructor(scene){this.mesh=new T.Mesh(new T.BufferGeometry(),new T.MeshBasicMaterial({transparent:true,opacity:.4,side:T.DoubleSide,depthWrite:false,depthTest:false}));this.mesh.renderOrder=3;this.mesh.visible=false;scene.add(this.mesh);this.reset();}
 reset(){this.lastElapsed=0;this.completed=0;this.flashAt=-Infinity;this.mesh.visible=false;}
 update(fill,points,charge,mode,direction,now){
 const elapsed=charge.elapsed||0,completed=Math.floor((elapsed+1e-7)/RING_SECONDS);if(elapsed<this.lastElapsed)this.completed=completed;
 if(completed>this.completed)this.flashAt=now;
 this.completed=completed;this.lastElapsed=elapsed;
 const progress=charge.pending?Math.min(1,(charge.progress||0)+(charge.pending.time||0)/RING_SECONDS):Math.max(0,Math.min(1,charge.progress||0)),flash=Math.max(0,1-(now-this.flashAt)/.35);
 this.mesh.geometry.dispose();this.mesh.geometry=tellFillGeometry(chargeTellPoints(points,progress,mode,direction));this.mesh.position.copy(fill.position);this.mesh.material.color.copy(fill.material.color).lerp(new T.Color(0xffffff),flash*.8);this.mesh.material.opacity=.4+flash*.25;this.mesh.visible=progress>0;
 fill.material.opacity=.09+flash*.46;fill.material.color.lerp(new T.Color(0xffffff),flash*.65);
 this.mesh.userData.progress=progress;this.mesh.userData.flash=flash;
 }
}
