import * as T from './three.module.js';
export class TellIcon{
 constructor(scene){this.cache=new Map();this.sprite=new T.Sprite(new T.SpriteMaterial({transparent:true,depthTest:false,depthWrite:false}));this.sprite.renderOrder=4;this.sprite.visible=false;scene.add(this.sprite);}
 update(fill,sequence,runes){
  let texture=this.cache.get(sequence);if(!texture){const canvas=document.createElement('canvas');canvas.width=sequence.length*96;canvas.height=96;const ctx=canvas.getContext('2d');ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='bold 66px system-ui';ctx.shadowColor='#132c39';ctx.shadowBlur=7;for(let i=0;i<sequence.length;i++){ctx.fillStyle=runes[sequence[i]].color;ctx.fillText(runes[sequence[i]].icon,i*96+48,49);}texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;this.cache.set(sequence,texture);}
  const position=fill.geometry.attributes.position,center=new T.Vector3();let total=0;
  for(let i=0;i<position.count;i+=3){const a=new T.Vector3().fromBufferAttribute(position,i),b=new T.Vector3().fromBufferAttribute(position,i+1),c=new T.Vector3().fromBufferAttribute(position,i+2),area=b.clone().sub(a).cross(c.clone().sub(a)).length();center.add(a.add(b).add(c).multiplyScalar(area/3));total+=area;}
  this.sprite.visible=total>0;if(!total)return;center.divideScalar(total).add(fill.position);center.y+=.06;this.sprite.position.copy(center);this.sprite.scale.set(sequence.length*.7,.7,1);if(this.sprite.material.map!==texture){this.sprite.material.map=texture;this.sprite.material.needsUpdate=true;}
 }
}
