import assert from 'node:assert/strict';
import * as T from './dist/three.module.js';
import {VisionShade} from './dist/vision-shade.mjs';
const shade=new VisionShade(new T.Scene(),{width:100,height:92}),viewer={x:0,z:0},walls={obstacles:[{x:3,z:0,w:1,h:4}]};
const sample=(x,z)=>shade.current[Math.floor((z+23)/46*92)*100+Math.floor((x+25)/50*100)];
shade.update(.1,viewer,walls);assert.equal(sample(7,0),1);assert.equal(sample(-7,0),0);shade.update(.1,viewer,{});assert.ok(sample(7,0)>0&&sample(7,0)<1);for(let i=0;i<20;i++)shade.update(.1,viewer,{});assert.ok(sample(7,0)<.001);shade.dispose();console.log('PASS shadow behind obstacles, clear foreground, smooth reveal and cleanup');
