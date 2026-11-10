import assert from 'node:assert/strict';
import {ensureLocomotion,actionGroups} from './dist/motion-catalog.mjs';
import {demoMotion} from './dist/motion-puppet.mjs';
const pose=n=>({Hips:[0,1,0],LeftFoot:[-.2,.12+n,n],RightFoot:[.2,.12, -n],LeftLeg:[-.2,.5,n],RightLeg:[.2,.5,-n]});
const run={name:'기본 걷기',binding:'기본 걷기',frames:13,fps:12,keys:[{frame:0,pose:pose(0)},{frame:6,pose:pose(.3)},{frame:12,pose:pose(0)}]},original=structuredClone(run),p={actions:[run]};
assert.equal(ensureLocomotion(p),true);assert.equal(run.name,'달리기');assert.deepEqual(run.keys,original.keys);const walk=p.actions.find(a=>a.name==='걷기');assert.ok(walk.frames>run.frames);assert.ok(walk.keys[1].pose.LeftFoot[2]<run.keys[1].pose.LeftFoot[2]);assert.equal(walk.keys[0].pose.LeftFoot[1],.12);walk.keys[1].pose.LeftFoot[2]=.73;assert.equal(ensureLocomotion(p),false);assert.equal(walk.keys[1].pose.LeftFoot[2],.73);assert.deepEqual(actionGroups(p.actions)[0].entries.map(e=>e.key),['달리기','걷기']);assert.ok(demoMotion().clips.some(c=>c.name==='걷기'));assert.equal(demoMotion().clips[0].name,'달리기');console.log('PASS: old run keys preserved; independent grounded walking cycle, editor order and idempotent migration');
