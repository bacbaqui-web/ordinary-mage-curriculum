import * as T from './three.module.js';
// Compatibility for non-spell feedback (hits, level-up, dodge). No image assets.
export class MeshFeedback{
 constructor(scene,vfx){this.scene=scene;this.vfx=vfx;this.played=0;}
 play(id,x,z,{width=1,color=0xe4c78f,y=.3}={}){this.played++;const hex=new T.Color(color).getHex();this.vfx.pulse(x,z,width*.6,hex,.35);for(let i=0;i<7;i++){const a=i/7*Math.PI*2;this.vfx.particle('shard',[x,y,z],[Math.cos(a),1,Math.sin(a)],.07,hex,.35,{gravity:2});}return true;}
 impact(kind,x,z,r){this.play('impact',x,z,{width:r*2});}
 clear(){} update(){} stats(){return{style:'3d-mesh',played:this.played};}
}
