import * as T from './three.module.js';
import {buildTownMap,lightTown} from './town-map.mjs';
import {createTownCamera,positionTownCamera} from './town-camera.mjs';
import {DISTRICTS} from './town-layout.mjs';
const canvas=document.querySelector('canvas'),renderer=new T.WebGLRenderer({canvas,antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.outputColorSpace=T.SRGBColorSpace;
const scene=new T.Scene();lightTown(scene);const map=await buildTownMap(scene),camera=createTownCamera();
let focus={x:0,z:0},span=140,drag=null;
function draw(){positionTownCamera(camera,{...focus,aspect:innerWidth/innerHeight,span,minWidth:span*1.52});renderer.render(scene,camera);}
function resize(){renderer.setSize(innerWidth,innerHeight);draw();}window.addEventListener('resize',resize);
for(const button of document.querySelectorAll('[data-view]'))button.onclick=()=>{const street=button.dataset.view==='street',d=street?{x:0,z:0}:DISTRICTS.find(d=>d.id===button.dataset.view);focus=d?{x:d.x,z:d.z}:{x:0,z:0};span=street?42:d?64:140;for(const b of document.querySelectorAll('[data-view]'))b.setAttribute('aria-pressed',String(b===button));draw();};
canvas.onpointerdown=e=>{drag={x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);};canvas.onpointerup=canvas.onpointercancel=()=>{drag=null;};canvas.onpointermove=e=>{if(!drag)return;const scale=(camera.top-camera.bottom)/innerHeight,dx=(e.clientX-drag.x)*scale,dy=(e.clientY-drag.y)*scale;focus.x=Math.max(-90,Math.min(90,focus.x-dx/Math.SQRT2+dy*Math.sqrt(1.5)));focus.z=Math.max(-90,Math.min(90,focus.z+dx/Math.SQRT2+dy*Math.sqrt(1.5)));drag={x:e.clientX,y:e.clientY};draw();};
canvas.addEventListener('wheel',e=>{e.preventDefault();span=Math.max(24,Math.min(220,span*Math.exp(e.deltaY*.001)));draw();},{passive:false});
resize();window.townDebug=()=>({camera:camera.type,position:camera.position.toArray(),quaternion:camera.quaternion.toArray(),batches:map.userData.staticBatches,kenney:map.userData.kenney,drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,focus,span});
