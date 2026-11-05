import * as T from './three.module.js';

// Use the pack's native frame timing and anchors; combat never waits for artwork.
export function frameAt(meta, seconds) {
 return Math.min(meta.frames-1, Math.floor(Math.max(0,seconds)*1000/meta.frame_ms));
}
export function frameUV(meta, frame) {
 const rows=Math.ceil(meta.frames/8);
 return {x:(frame%8)/8,y:1-(Math.floor(frame/8)+1)/rows,w:1/8,h:1/rows};
}
export class PixelVFX {
 constructor(scene,{loader=new T.TextureLoader(),fetcher=fetch}={}) {
  this.scene=scene;this.assets=new Map();this.active=[];this.played=0;this.failed=0;
  this.ready=this.load(loader,fetcher);
 }
 async load(loader,fetcher) {
  const base=new URL('./assets/pvfx/',import.meta.url);
  try {
   const response=await fetcher(new URL('manifest.json',base));
   if(!response.ok)throw new Error('VFX manifest unavailable');
   const manifest=await response.json();
   await Promise.all(Object.entries(manifest).map(async([id,meta])=>{
    try {
     const texture=await loader.loadAsync(new URL(meta.file,base).href);
     texture.magFilter=T.NearestFilter;texture.minFilter=T.NearestFilter;
     texture.generateMipmaps=false;texture.colorSpace=T.SRGBColorSpace;
     this.assets.set(id,{meta,texture});
    } catch {this.failed++;}
   }));
  } catch {this.failed++;}
 }
 play(id,x,z,{width=2,y=.15,color=0xffffff,duration}={}) {
  const asset=this.assets.get(id);if(!asset||this.active.length>=64)return false;
  const {meta}=asset,map=asset.texture.clone();
  const material=new T.SpriteMaterial({map,color,transparent:true,depthWrite:false,depthTest:true,toneMapped:false});
  const sprite=new T.Sprite(material);
  sprite.center.set(meta.pivot[0]/meta.size[0],1-meta.pivot[1]/meta.size[1]);
  sprite.scale.set(width,width*meta.size[1]/meta.size[0],1);sprite.position.set(x,y,z);
  const effect={sprite,map,meta,age:0,life:duration??meta.frames*meta.frame_ms/1000};
  this.setFrame(effect,0);this.scene.add(sprite);this.active.push(effect);this.played++;return true;
 }
 setFrame(effect,frame) {
  const uv=frameUV(effect.meta,frame);effect.map.repeat.set(uv.w,uv.h);effect.map.offset.set(uv.x,uv.y);
 }
 remove(index) {
  const e=this.active[index];this.scene.remove(e.sprite);e.sprite.material.dispose();e.map.dispose();this.active.splice(index,1);
 }
 update(dt) {
  for(let i=this.active.length-1;i>=0;i--){const e=this.active[i];e.age+=dt;if(e.age>=e.life){this.remove(i);continue;}
   const cycle=e.meta.frames*e.meta.frame_ms/1000;
   this.setFrame(e,frameAt(e.meta,e.meta.loop?e.age%cycle:e.age));
  }
 }
 clear(){for(let i=this.active.length-1;i>=0;i--)this.remove(i);}
 impact(kind,x,z,r=1){return this.play(({q:'small-explosion',i:'frost-nova',l:'static-burst',w:'wind-gust',g:'void-implosion'})[kind]||'hit-spark',x,z,{width:Math.max(1.3,Math.min(5,r*2)),y:kind==='l'?.7:.15});}
 stats(){return {loaded:this.assets.size,failed:this.failed,active:this.active.length,played:this.played};}
}
