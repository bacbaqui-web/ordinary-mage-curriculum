import * as T from './three.module.js';
import {TOWN_HALF} from './town-layout.mjs';
import {canSee} from './vision.mjs?v=iceberg-rise-1';
export class VisionShade{
 constructor(scene,{width=100,height=92}={}){
  this.width=width;this.height=height;this.data=new Uint8Array(width*height*4);this.current=new Float32Array(width*height);this.target=new Float32Array(width*height);this.timer=0;this.ready=false;
  this.texture=new T.DataTexture(this.data,width,height,T.RGBAFormat);this.texture.minFilter=this.texture.magFilter=T.LinearFilter;this.texture.generateMipmaps=false;this.texture.needsUpdate=true;
  const materials=new Set();scene.traverse(o=>{if(o.isMesh)for(const m of Array.isArray(o.material)?o.material:[o.material])if(m&&(m.isMeshStandardMaterial||m.isMeshBasicMaterial))materials.add(m);});
  for(const m of materials){const before=m.onBeforeCompile;m.onBeforeCompile=(shader,renderer)=>{before.call(m,shader,renderer);shader.uniforms.visionShade={value:this.texture};shader.vertexShader='varying vec2 sightWorld;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>','#include <project_vertex>\nsightWorld=(modelMatrix*vec4(transformed,1.0)).xz;');shader.fragmentShader='uniform sampler2D visionShade;varying vec2 sightWorld;\n'+shader.fragmentShader;shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
 float unseen=texture2D(visionShade,(sightWorld+vec2(${TOWN_HALF.toFixed(1)}))/vec2(${(TOWN_HALF*2).toFixed(1)})).r;
 diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*vec3(.19,.25,.39)+vec3(.008,.013,.025),unseen*.82);`);};m.customProgramCacheKey=()=> 'terrain-vision-shade-v1';m.needsUpdate=true;}
 }
 update(dt,viewer,blockers){this.timer-=dt;if(this.timer<=0){this.timer=.09;for(let z=0;z<this.height;z++)for(let x=0;x<this.width;x++){const p={x:(x+.5)/this.width*TOWN_HALF*2-TOWN_HALF,z:(z+.5)/this.height*TOWN_HALF*2-TOWN_HALF},i=z*this.width+x;this.target[i]=Math.hypot(p.x-viewer.x,p.z-viewer.z)<.6?0:canSee(viewer,p,blockers)?0:1;}if(!this.ready){this.current.set(this.target);this.ready=true;}}
 const blend=1-Math.exp(-Math.max(0,dt)/.16);for(let i=0;i<this.current.length;i++){this.current[i]+=(this.target[i]-this.current[i])*blend;const v=Math.round(this.current[i]*255),j=i*4;this.data[j]=this.data[j+1]=this.data[j+2]=v;this.data[j+3]=255;}this.texture.needsUpdate=true;
 }
 dispose(){this.texture.dispose();}
}
