import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from './dist/three.module.js';
import {createTownCamera,positionTownCamera} from './dist/town-camera.mjs';
import {BUILDINGS,CARS,ENCOUNTERS,STREET_PROPS,TREES,townCollision} from './dist/town-layout.mjs';
import {arenaCollision} from './dist/arena-rules.mjs';
import {movementDirection} from './dist/keyboard-movement.mjs';
import {cursorAim} from './dist/cursor-aim.mjs';

test('quarter-view projection remains parallel, equal-sized and screen-aligned at all distances',()=>{
 const camera=createTownCamera();positionTownCamera(camera,{aspect:16/9,span:150});assert(camera.isOrthographicCamera);
 const screen=(x,y,z)=>{const p=new T.Vector3(x,y,z).project(camera);return new T.Vector2(p.x*16/9,p.y);};
 const step=(x,z)=>screen(x+10,0,z).sub(screen(x,0,z));
 assert(step(-50,-50).distanceTo(step(50,50))<1e-12);
 assert(Math.abs(Math.abs(step(0,0).y/step(0,0).x)-1/Math.sqrt(3))<1e-12);
 for(const [key,axis,sign] of [['KeyW','y',1],['KeyD','x',1]]){const d=movementDirection(new Set([key]));const v=screen(d.x,0,d.z).sub(screen(0,0,0));assert(v[axis]*sign>0);assert(Math.abs(v[axis==='x'?'y':'x'])<1e-12);}
 const orientation=camera.quaternion.clone();positionTownCamera(camera,{x:45,z:-20,aspect:.6,span:38});assert(orientation.angleTo(camera.quaternion)<1e-7);
});
test('all four encounter areas are reachable on foot and their combat floors are spacious',()=>{
 assert.equal(arenaCollision,townCollision);
 const visited=new Set(['0,0']),queue=[[0,0]];
 for(let i=0;i<queue.length;i++){const [x,z]=queue[i];for(const [dx,dz] of[[1,0],[-1,0],[0,1],[0,-1]]){const a=x+dx,b=z+dz,key=`${a},${b}`;if(!visited.has(key)&&!townCollision(a,b,.55)){visited.add(key);queue.push([a,b]);}}}
 for(const p of ENCOUNTERS)assert(visited.has(`${p.x},${p.z}`));
 for(const [x,z,r] of[[-23,25,5],[-33,-21,7],[20,34,4],[33,-24,5]])for(let dx=-r;dx<=r;dx++)for(let dz=-r;dz<=r;dz++)assert(!townCollision(x+dx,z+dz,.45),`Blocked combat floor ${x+dx},${z+dz}`);
 for(const b of BUILDINGS)assert(townCollision(b.x,b.z));
 for(const n of[-65,65]){assert(townCollision(n,0));assert(townCollision(0,n));}
 assert(visited.size>10500,`${visited.size} square metres reachable`);
});
test('parked vehicles do not intersect buildings',()=>{
 for(const c of CARS)for(const b of BUILDINGS)assert(!(Math.abs(c.x-b.x)<(b.w+(c.w||4.5))/2&&Math.abs(c.z-b.z)<(b.h+(c.h||2.1))/2),`Vehicle ${c.x},${c.z} inside ${b.id}`);
});
test('orthographic cursor targeting intersects the requested flight plane',()=>{
 const camera=createTownCamera();
 for(const aspect of[.6,1,16/9])for(const x of[-45,0,45]){
  positionTownCamera(camera,{x,z:18,aspect,span:38});
  for(const height of[0,1,1.42])for(const pointer of[new T.Vector2(.3,.2),new T.Vector2(-.4,-.3)]){
   const p=cursorAim(pointer,camera,height);p.y=height;const projected=p.project(camera);assert(Math.hypot(projected.x-pointer.x,projected.y-pointer.y)<1e-10);
  }
 }
});

test('street furniture blocks movement without sharing space with trees',()=>{
 for(const p of STREET_PROPS){assert(townCollision(p.x,p.z));for(const t of TREES)assert(!(Math.abs(t.x-p.x)<p.w/2+.7&&Math.abs(t.z-p.z)<p.h/2+.7),`${p.kind} overlaps tree`);}
});
test('overview can fit the entire square in a narrow viewport without changing angle',()=>{
 const c=createTownCamera();positionTownCamera(c,{aspect:480/1080,span:120,minWidth:182.4});
 for(const x of[-60,60])for(const z of[-60,60]){const p=new T.Vector3(x,0,z).project(c);assert(Math.abs(p.x)<1&&Math.abs(p.y)<1);}
});
