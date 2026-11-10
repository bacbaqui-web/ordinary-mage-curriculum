export const BASIC_ATTACKS=['좌클릭 기본 공격','우클릭 기본 공격'];
export const firstRingClip=(hand,mode)=>`1륜 ${hand==='right'?'우클릭':'좌클릭'} ${mode==='hold'?'충전':'발사'}`;
export const FIRST_RING_CLIPS=['hold','release'].flatMap(mode=>['left','right'].map(hand=>firstRingClip(hand,mode)));
export const ACTION_ORDER=['대기','달리기','걷기','이동기',...FIRST_RING_CLIPS,'2륜 충전','2륜 발사','3륜 충전','3륜 발사'];
export function ensureBasicAttacks(project){
 const source=project.actions.find(a=>(a.binding||a.name)==='1륜 발사')||project.actions.find(a=>(a.binding||a.name)==='마법 시전');
 if(!source)return false;let changed=false;
 for(const name of BASIC_ATTACKS)if(!project.actions.some(a=>(a.binding||a.name)===name)){
  const action=structuredClone(source);action.name=action.binding=name;delete action.updatedAt;project.actions.push(action);changed=true;
 }
 return changed;
}
export function actionGroups(actions){
 const entries=actions.map((a,index)=>({action:a,index,key:a.binding||a.name}));
 return [{label:'게임 동작',entries:entries.filter(e=>ACTION_ORDER.includes(e.key)).sort((a,b)=>ACTION_ORDER.indexOf(a.key)-ACTION_ORDER.indexOf(b.key))}].filter(g=>g.entries.length);
}

export function ensureIdle(project){
 if(project.actions.some(a=>(a.binding||a.name)==='대기'))return false;
 const walk=project.actions.find(a=>['달리기','기본 걷기'].includes(a.binding||a.name));
 if(!walk?.keys.length)return false;
 const base=structuredClone(walk.keys[0].pose);
 // A walking key may have one leg raised. Plant both feet for the new idle only.
 const floor=Math.min(base.LeftFoot[1],base.RightFoot[1]);
 for(const side of ['Left','Right']){
  const hip=base[side+'UpLeg'],knee=base[side+'Leg'],foot=base[side+'Foot'];
  foot[0]=hip[0];foot[1]=floor;foot[2]=hip[2]+.06;
  knee[0]=hip[0];knee[1]=(hip[1]+floor)/2;knee[2]=hip[2];
 }
 const breath=structuredClone(base);
 for(const n of ['Spine','Neck','Head','LeftArm','RightArm','LeftForeArm','RightForeArm','LeftHand','RightHand'])if(breath[n])breath[n][1]+=.012;
 project.actions.push({name:'대기',binding:'대기',frames:25,fps:12,keys:[{frame:0,ease:'smooth',pose:base},{frame:12,ease:'smooth',pose:breath},{frame:24,ease:'smooth',pose:structuredClone(base)}]});return true;
}

export function ensureFirstRingClips(project){
 let changed=false;
 const find=name=>project.actions.filter(a=>(a.binding||a.name)===name).sort((a,b)=>(b.updatedAt||0)-(a.updatedAt||0))[0];
 for(const hand of ['left','right'])for(const mode of ['hold','release']){
  const name=firstRingClip(hand,mode);if(find(name))continue;
  const basic=find(hand==='right'?'우클릭 기본 공격':'좌클릭 기본 공격');
  const source=mode==='hold'?(basic||find('1륜 충전')||find('1륜 발사')):(find('1륜 발사')||basic||find('마법 시전'));
  if(!source)continue;const action=structuredClone(source);action.name=action.binding=name;project.actions.push(action);changed=true;
 }
 return changed;
}

// Preserve the old authored running cycle; create walking only when absent.
export function ensureLocomotion(project){
 let changed=false;
 const find=name=>project.actions.filter(a=>(a.binding||a.name)===name).sort((a,b)=>(b.updatedAt||0)-(a.updatedAt||0))[0];
 if(!find('달리기'))for(const a of project.actions)if((a.binding||a.name)==='기본 걷기'){a.name=a.binding='달리기';changed=true;}
 const run=find('달리기');if(!run?.keys?.length||find('걷기'))return changed;
 const walk=structuredClone(run);walk.name=walk.binding='걷기';delete walk.updatedAt;delete walk.footLocks;
 const duration=Math.max(1,run.frames-1);walk.frames=Math.max(run.frames,Math.round(duration*1.4)+1);
 const joints=Object.keys(run.keys[0].pose),mean=Object.fromEntries(joints.map(n=>[n,[0,1,2].map(axis=>run.keys.reduce((sum,k)=>sum+k.pose[n][axis],0)/run.keys.length)]));
 for(const side of ['Left','Right'])for(const part of ['Foot','Toe']){const n=side+part;if(mean[n])mean[n][1]=Math.min(...run.keys.map(k=>k.pose[n][1]));}
 for(const k of walk.keys){k.frame=Math.round(k.frame/duration*(walk.frames-1));for(const n of joints)k.pose[n]=k.pose[n].map((v,axis)=>mean[n][axis]+(v-mean[n][axis])*.45);}
 walk.loop=true;project.actions.push(walk);return true;
}

export function ensureMobility(project){
 if(project.actions.some(a=>(a.binding||a.name)==='이동기'))return false;
 const source=project.actions.filter(a=>(a.binding||a.name)==='달리기').sort((a,b)=>(b.updatedAt||0)-(a.updatedAt||0))[0];if(!source)return false;
 const action=structuredClone(source);action.name=action.binding='이동기';action.loop=true;delete action.updatedAt;delete action.footLocks;project.actions.push(action);return true;
}
