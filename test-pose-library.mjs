import assert from 'node:assert/strict';
import {uniqueMotions,mergeMotions} from './dist/pose-library.mjs';
const old={name:'기본 걷기',updatedAt:1},latest={name:'기본 걷기',updatedAt:3},middle={name:'기본 걷기',updatedAt:2},copy={name:'기본 걷기 복사'};
assert.deepEqual(uniqueMotions([old,latest,middle,copy]),[latest,copy]);
assert.deepEqual(uniqueMotions([{name:'베기',v:1},{name:'베기',v:2}]),[{name:'베기',v:2}]);
const renamed={name:'느린 걸음',binding:'기본 걷기'};
assert.deepEqual(mergeMotions([latest,copy],[renamed]),[renamed,copy]);
assert.deepEqual(mergeMotions(mergeMotions([old],[latest]),[latest]),[latest]);
console.log('PASS: duplicate cleanup, newest saved pose, renamed binding, repeated import, custom copies preserved');
