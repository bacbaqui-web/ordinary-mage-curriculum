import assert from 'node:assert/strict';
import {BagSwing} from './dist/bag-swing.mjs';
const s=new BagSwing();let max=0;
for(let i=0;i<240;i++){const r=s.update([0,0,i*4.4/120],0,1/120);max=Math.max(max,...r.angle.map(Math.abs));}
assert.ok(max>.04,'running swings the bag');const moving=[...s.angle];
s.update([0,0,239*4.4/120],0,1/120);assert.ok(s.angle.some((x,i)=>Math.abs(x-moving[i])>1e-5),'stopping leaves momentum');
for(let i=0;i<900;i++)s.update([0,0,239*4.4/120],0,1/120);
assert.ok(s.angle.every(x=>Math.abs(x)<1e-5));assert.ok(s.bounce<1e-5);
s.update([100,0,100],0,1/120);assert.ok(s.angle.every(Number.isFinite),'teleport resets safely');
const paused=[...s.angle];s.update([100,0,100],0,0);assert.deepEqual(s.angle,paused);
console.log('PASS: running swing, stop inertia, settling, teleport reset and pause');
