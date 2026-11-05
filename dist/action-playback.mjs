// Two anticipation frames, four frames at the final pose, then four frames of recovery.
const samples={'베기':[.22,.48,.78],'주먹 타격':[.18,.34,.43],'방어':[.22,.45,.65],'마법 시전':[.3,1,1.12]};
export class ActionPlayback{
 constructor(puppet){this.puppet=puppet;this.active=false;this.queued=null;this.frame=0;}
 request(index){if(this.active&&this.frame<6){this.queued=index;return;}this.start(index);}
 start(index){const p=this.puppet,name=p.clips[index]?.name;if(!samples[name])return;this.index=index;this.name=name;this.frame=0;this.queued=null;this.active=true;p.select(index);
  this.poses=samples[name].map(time=>{p.mixer.setTime(time);return Object.fromEntries(Object.entries(p.bones).map(([n,b])=>[n,b.quaternion.clone()]));});
  this.neutral=Object.fromEntries(Object.keys(p.bones).map(n=>[n,this.poses[0][n].clone().identity()]));this.apply();
 }
 update(dt,fps=12,speed=1){if(!this.active)return;this.frame+=dt*(fps||12)*speed;if(this.frame>=6&&this.queued!==null){const next=this.queued,overshoot=this.frame-6;this.start(next);this.frame=overshoot;}
  if(this.frame>=10){this.frame=10;this.active=false;}this.apply();
 }
 seek(frame){this.frame=Math.max(0,Math.min(10,frame));this.apply();}
 apply(){this.puppet.editorActionTime=this.active?this.frame/12:undefined;if(!this.poses)return;const phase=this.frame<1?0:this.frame<2?1:2;let blend=Math.max(0,Math.min(1,(this.frame-6)/4));blend=blend*blend*(3-2*blend);
  for(const [n,b] of Object.entries(this.puppet.bones)){b.quaternion.copy(this.poses[phase][n]);if(blend)b.quaternion.slerp(this.neutral[n],blend);}this.puppet.source.updateMatrixWorld(true);
 }
 get status(){return this.frame<2?'예비동작 '+(Math.floor(this.frame)+1)+'프레임':this.frame<6?'최종 자세 유지 '+(Math.floor(this.frame)-1)+'/4':this.frame<10?'대기 자세로 복귀':'대기 자세';}
}
