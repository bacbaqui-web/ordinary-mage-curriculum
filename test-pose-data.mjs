import assert from 'node:assert/strict';
import {JOINTS,samplePose,validateProject} from './dist/pose-data.mjs';
const pose=v=>Object.fromEntries(JOINTS.map(n=>[n,[v,1,0]]));
const a={name:'test',frames:12,fps:12,keys:[{frame:0,ease:'hold',pose:pose(0)},{frame:2,ease:'hold',pose:pose(2)},{frame:6,ease:'smooth',pose:pose(2)},{frame:10,ease:'linear',pose:pose(0)}]};
assert.ok(samplePose(a,1.99).LeftHand[0]>1.99);assert.equal(samplePose(a,1).LeftHand[0],1);assert.equal(samplePose(a,2).LeftHand[0],2);assert.equal(samplePose(a,5.99).LeftHand[0],2);assert.equal(samplePose(a,8).LeftHand[0],1);assert.equal(samplePose(a,11).LeftHand[0],0);
const p={version:1,actions:[a]};for(const k of a.keys)k.ease='smooth';assert.deepEqual(validateProject(JSON.parse(JSON.stringify(p))),p);const bad=structuredClone(p);bad.actions[0].keys[0].pose.Head[0]=Infinity;assert.throws(()=>validateProject(bad));const duplicate=structuredClone(p);duplicate.actions[0].keys.push(duplicate.actions[0].keys[0]);assert.throws(()=>validateProject(duplicate));console.log('PASS: always smooth interpolation, final pose hold, smooth recovery, JSON roundtrip and invalid coordinate/key rejection');
