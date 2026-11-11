import * as T from './vendor/elemental/three/build/three.module.js';
import {OrbitControls} from './vendor/elemental/three/examples/jsm/controls/OrbitControls.js';
import {RoomEnvironment} from './vendor/elemental/three/examples/jsm/environments/RoomEnvironment.js';
import {AbilityManager} from './vendor/elemental/src/abilities/AbilityManager.js';
import {ParticleEngine} from './vendor/elemental/src/particles/ParticleEngine.js';
import {LightPool} from './vendor/elemental/src/effects/LightPool.js';
import {DecalSystem} from './vendor/elemental/src/effects/GroundDecals.js';
import {FissureSystem} from './vendor/elemental/src/effects/GroundFissures.js';
import {BurstSystem} from './vendor/elemental/src/effects/BurstSphere.js';
import {ScreenFlash} from './vendor/elemental/src/effects/ScreenFlash.js';
import {PostProcessing} from './vendor/elemental/src/postprocessing/PostProcessing.js';
import {settings} from './vendor/elemental/src/config/settings.js';
import {frame} from './vendor/elemental/src/core/FrameUniforms.js';
import {applyPreset} from './elemental-presets.mjs';

// Each editor lives in its own iframe: upstream settings and shader uniforms are singletons.
export class ElementalStage {
 constructor(canvas){
  this.canvas=canvas;this.elapsed=0;this.paused=false;this.speed=1;this.repeat=true;this.wait=0;
  this.gl=new T.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
  this.gl.setPixelRatio(Math.min(devicePixelRatio||1,1.5));this.gl.setSize(600,400,false);
  this.gl.outputColorSpace=T.SRGBColorSpace;this.gl.toneMapping=T.ACESFilmicToneMapping;
  this.scene=new T.Scene();this.scene.background=new T.Color('#17242e');
  this.camera=new T.PerspectiveCamera(42,1.5,.1,150);this.camera.layers.enable(1);
  this.controls=new OrbitControls(this.camera,canvas);this.controls.target.set(0,1,0);this.controls.minDistance=5;this.controls.maxDistance=65;this.controls.maxPolarAngle=Math.PI*.48;this.home();
  this.scene.add(new T.HemisphereLight(0xc9e8ff,0x455347,2));
  const sun=new T.DirectionalLight(0xfff0db,3.2);sun.position.set(5,12,8);this.scene.add(sun);
  const room=new RoomEnvironment(),pmrem=new T.PMREMGenerator(this.gl);this.environmentMap=pmrem.fromScene(room,.04);room.dispose();pmrem.dispose();this.scene.environment=this.environmentMap.texture;
  const floor=new T.Mesh(new T.PlaneGeometry(80,80),new T.MeshStandardMaterial({color:0x192730,roughness:.88}));floor.rotation.x=-Math.PI/2;floor.position.y=-.035;this.scene.add(floor);
  // A simple scale reference, not a replacement for the game's character or animation system.
  this.marker=new T.Group();const body=new T.Mesh(new T.CapsuleGeometry(.25,1.1,4,8),new T.MeshStandardMaterial({color:0x93a9b6,roughness:.75}));body.position.y=.8;this.marker.add(body);this.scene.add(this.marker);
  const environment={registerShadowCasterWithPatch(material,patch){material.onBeforeCompile=patch;material.customProgramCacheKey=()=>patch.toString();}};
  this.particles=new ParticleEngine(this.scene);this.lights=new LightPool(this.scene);this.decals=new DecalSystem(this.scene);this.fissures=new FissureSystem(this.scene);this.bursts=new BurstSystem(this.scene);this.flash=new ScreenFlash();
  this.abilities=new AbilityManager({scene:this.scene,camera:this.camera,environment,particles:this.particles,lights:this.lights,decals:this.decals,fissures:this.fissures,bursts:this.bursts,flash:this.flash,shake:{add(){},rumble(){}}});
  this.post=new PostProcessing({gl:this.gl},this.scene,this.camera);
  this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(canvas.parentElement);this.resize();
  this.last=performance.now();this.tick=this.tick.bind(this);this.raf=requestAnimationFrame(this.tick);
 }
 home(){this.camera.position.set(14,13,19);this.controls.target.set(0,1,0);this.controls.update();}
 resize(){const r=this.canvas.parentElement.getBoundingClientRect(),w=Math.max(2,Math.floor(r.width)),h=Math.max(2,Math.floor(r.height));this.gl.setSize(w,h,false);this.camera.aspect=w/h;this.camera.updateProjectionMatrix();this.post?.setSize(w,h,this.gl.getPixelRatio());}
 setPreset(p,{restart=false}={}){const previous=this.preset?.effect;this.preset=applyPreset(p);if(restart||previous!==p.effect)this.cast();}
 clear(){this.abilities.clear();this.particles.reset();this.decals.clear();this.fissures.clear();this.bursts.clear();this.lights.reset();this.flash.reset();this.elapsed=0;this.wait=0;frame.uTime.value=0;}
 cast(){if(!this.preset)return;this.clear();const distance=this.preset.distance;this.marker.position.set(-distance/2,0,0);this.abilities.cast(new T.Vector3(-distance/2,0,0),new T.Vector3(1,0,0),distance,this.preset.effect);}
 update(dt){this.elapsed+=dt;frame.uTime.value=this.elapsed;frame.uDelta.value=dt;frame.uShaderIntensity.value=settings.global.shaderIntensity;frame.uGlobalGlow.value=settings.global.glow;
  this.abilities.update(dt);this.particles.flush();this.decals.update(dt);this.fissures.update(dt);this.bursts.update(dt);this.lights.update(dt);this.flash.update(dt);
 }
 freeze(){this.cast();const ability=this.abilities.active[0];for(let i=0;i<2000&&ability?.phase==='travel';i++)this.update(1/60);const hold=Math.min(.35,(ability?.impactDuration||1)*.4);for(let i=0;i<Math.ceil(hold*60);i++)this.update(1/60);this.paused=true;this.render();}
 step(){this.paused=true;if(!this.abilities.active.length)this.cast();this.update(1/60);this.render();}
 render(){this.gl.toneMappingExposure=settings.post.exposure;this.post.sync(this.elapsed,this.flash);this.post.render();}
 tick(now){if(this.disposed)return;this.raf=requestAnimationFrame(this.tick);const dt=Math.max(0,Math.min(.04,(now-this.last)/1000));this.last=now;if(document.hidden)return;
  try{this.update(this.paused?0:dt*this.speed);if(!this.paused&&!this.abilities.active.length&&this.repeat){this.wait+=dt;if(this.wait>1.5)this.cast();}this.render();this.onFrame?.();}
  catch(error){this.paused=true;cancelAnimationFrame(this.raf);this.onError?.(error);}
 }
 dispose(){if(this.disposed)return;this.disposed=true;cancelAnimationFrame(this.raf);this.resizeObserver.disconnect();this.controls.dispose();this.abilities.dispose();this.particles.dispose();this.decals.dispose();this.fissures.dispose();this.bursts.dispose();this.lights.dispose();for(const pass of this.post.composer.passes)pass.dispose?.();this.post.dispose();this.scene.traverse(o=>{o.geometry?.dispose();for(const m of o.material?Array.isArray(o.material)?o.material:[o.material]:[])m.dispose();});this.environmentMap.dispose();this.gl.dispose();this.gl.forceContextLoss();}
}
