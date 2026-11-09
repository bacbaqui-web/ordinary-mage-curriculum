import assert from 'node:assert/strict';
import {ensureBasicAttacks,actionGroups} from './dist/motion-catalog.mjs';
const project={actions:[{name:'베기',keys:[]},{name:'1륜 발사',keys:[{pose:{Head:[0,1,0]}}]}]},old=structuredClone(project);
assert.equal(ensureBasicAttacks(project),true);assert.equal(ensureBasicAttacks(project),false);
assert.deepEqual(project.actions.slice(0,2),old.actions);
assert.deepEqual(actionGroups(project.actions)[0].entries.map(e=>e.action.name),['좌클릭 기본 공격','우클릭 기본 공격','1륜 발사']);
assert.equal(actionGroups(project.actions).at(-1).label,'기존 동작');
project.actions[2].keys[0].pose.Head[1]=2;assert.equal(project.actions[3].keys[0].pose.Head[1],1);
console.log('PASS: action ordering, original preservation, separate left/right clips and idempotent seeding');
