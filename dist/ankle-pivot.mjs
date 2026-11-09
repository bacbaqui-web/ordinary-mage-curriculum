// Move a legacy ankle toward its knee without changing any other authored joint.
export function raisedAnkle(ankle,knee,lift){
 const d=knee.map((v,i)=>v-ankle[i]),length=Math.hypot(...d),amount=Math.min(lift,length*.45);
 return ankle.map((v,i)=>v+(length?d[i]/length*amount:0));
}
export function migrateAnklePivot(project,lift,back=0){
 if((!lift&&!back)||!project.rigVersion||project.rigVersion>=6)return false;
 const delta=project.rigVersion===5?lift+.03:project.rigVersion===4?lift-.05:project.rigVersion===3?lift-.075:lift;
 for(const action of project.actions)for(const key of action.keys){
  if(project.rigVersion===1)for(const p of Object.values(key.pose))p[0]*=-1;
  for(const side of ['Left','Right']){
   const foot=raisedAnkle(key.pose[side+'Foot'],key.pose[side+'Leg'],delta);
   foot[2]-=back;key.pose[side+'Foot']=foot;
  }
 }
 project.rigVersion=6;return true;
}
