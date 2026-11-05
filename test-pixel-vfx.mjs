import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import * as T from './dist/three.module.js';
import {PixelVFX,frameAt,frameUV} from './dist/pixel-vfx.mjs';
const manifest=JSON.parse(await readFile(new URL('./dist/assets/pvfx/manifest.json',import.meta.url)));
for(const meta of Object.values(manifest)){
 const png=await readFile(new URL('./dist/assets/pvfx/'+meta.file,import.meta.url));
 assert.equal(png.readUInt32BE(16),meta.size[0]*8);
 assert.equal(png.readUInt32BE(20),meta.size[1]*Math.ceil(meta.frames/8));
 assert.equal(frameAt(meta,(meta.frames-.5)*meta.frame_ms/1000),meta.frames-1);
 const uv=frameUV(meta,8);assert.equal(uv.x,0);assert.equal(uv.y,1-2/Math.ceil(meta.frames/8));
}
const scene=new T.Scene(),vfx=new PixelVFX(scene,{loader:{loadAsync:async()=>new T.Texture()},fetcher:async()=>({ok:true,json:async()=>manifest})});
assert.equal(vfx.play('hit-spark',0,0),false);await vfx.ready;
assert.equal(vfx.stats().loaded,24);
vfx.play('hit-spark',0,0);vfx.update(.09);vfx.play('hit-spark',1,0);
assert.notEqual(vfx.active[0].map.offset.x,vfx.active[1].map.offset.x);
vfx.update(2);assert.equal(scene.children.length,0);
for(let i=0;i<100;i++)vfx.impact('q',0,0);assert.equal(vfx.active.length,64);vfx.clear();assert.equal(scene.children.length,0);
const broken=new PixelVFX(scene,{fetcher:async()=>{throw Error('offline')}});await broken.ready;assert.equal(broken.stats().failed,1);assert.equal(broken.play('hit-spark',0,0),false);
console.log('PASS: sheet dimensions, exact frame timing, UV rows, independent playback, expiry, cap, reset, offline fallback');
vfx.play('ice-wall',0,0,{duration:5,planeAngle:Math.PI/2,holdFrame:10});vfx.update(3);assert.equal(vfx.active.length,1);assert(vfx.active[0].sprite.isMesh);assert.equal(vfx.active[0].map.offset.x,frameUV(manifest['ice-wall'],10).x);vfx.clear();
let owner={x:2,z:3,y:1};vfx.play('magic-missile',0,0,{duration:10,loop:true,follow:()=>owner});vfx.update(2);assert.equal(vfx.active[0].sprite.position.x,2);owner=null;vfx.update(.1);assert.equal(vfx.active.length,0);
console.log('PASS: wall holds frame on oriented flat plane; projectile tracks owner and expires on removal');
