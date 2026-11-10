import assert from 'node:assert/strict';
import {MONSTERS,createMonster,tickMonster,cancelMonsterAttack} from './dist/monsters.mjs';
import * as T from './dist/three.module.js';
for(let type=0;type<3;type++){
 const model=createMonster(type);assert(model.g.userData.monsterParts.length>12);assert.equal(model.g.scale.x,.5);assert.equal(model.g.scale.y,.5);assert.equal(model.g.scale.z,.5);
 const m={...model,type,id:type+1,x:0,z:0,homeX:0,homeZ:0,dir:new T.Vector3(),cool:0,motion:{active:false}},target={x:0,z:type===1?1.5:3};let hits=0;
 const api={move:(a,x,z)=>{a.x+=x;a.z+=z;},hit:()=>hits++,visible:()=>true,clearPath:()=>true};
 tickMonster(m,target,.02,api);assert.equal(m.attackPhase,'windup');assert.equal(hits,0);
 for(let i=0;i<100;i++){tickMonster(m,target,.02,api);if(m.attackPhase==='recover')break;}
 assert.equal(m.attackPhase,'recover');assert.equal(hits,1);const pos=m.z;tickMonster(m,target,.1,api);assert.equal(m.z,pos);
 m.attackPhase='attack';cancelMonsterAttack(m);assert.equal(m.attackPhase,'recover');
 // Walls must block damage even at point-blank range.
 m.attackPhase='attack';m.attackElapsed=MONSTERS[type].duration*.8;m.didHit=false;m.x=target.x;m.z=target.z;m.attackDX=0;m.attackDZ=1;hits=0;
 tickMonster(m,target,.02,{...api,move:()=>{},clearPath:()=>false});assert.equal(hits,0);
}
console.log('PASS: three rigs, telegraphs, single hits, recovery, interruption and wall occlusion');
