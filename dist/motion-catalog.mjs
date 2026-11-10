export const BASIC_ATTACKS=['좌클릭 기본 공격','우클릭 기본 공격'];
export const ACTION_ORDER=['기본 걷기',...BASIC_ATTACKS,'1륜 충전','1륜 발사','2륜 충전','2륜 발사','3륜 충전','3륜 발사'];
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
