import * as T from './three.module.js';
// Euler poses are authored in radians on the same 3D skeleton as the walk.
export function actionClips(names){
 const neutral={};
 const stance={LeftUpLeg:[-.18,0,-.15],RightUpLeg:[.18,0,.15],LeftLeg:[.15,0,0],RightLeg:[.22,0,0]};
 const clip=(name,times,poses)=>new T.AnimationClip(name,times.at(-1),names.map(bone=>{
  const values=poses.flatMap(p=>new T.Quaternion().setFromEuler(new T.Euler(...(p[bone]||[0,0,0]),'XYZ')).toArray());
  return new T.QuaternionKeyframeTrack(bone+'.quaternion',times,values);
 }));
 return [
 clip('베기',[0,.22,.48,.60,.78,1.05,1.4],[neutral,
  {...stance,Spine:[0,-.35,0],RightArm:[-2.3,-.5,-.45],RightForeArm:[-.8,0,0],LeftArm:[-.4,0,-.4]},
  {...stance,Spine:[.05,-.55,-.1],RightArm:[-2.6,-.6,-.5],RightForeArm:[-1,0,0],LeftArm:[-.5,0,-.5]},
  {...stance,Spine:[.12,.7,.12],RightArm:[-1.3,.3,1.2],RightForeArm:[-.1,0,0],LeftArm:[-.5,0,-.6]},
  {...stance,Spine:[.15,.9,.15],RightArm:[-.6,.5,1.25],RightForeArm:[-.2,0,0]},
  {...stance,RightArm:[-.3,0,.3]},neutral]),
 clip('주먹 타격',[0,.18,.34,.43,.55,.8,1.15],[neutral,
  {...stance,Spine:[0,-.4,0],RightArm:[-.65,0,.2],RightForeArm:[-1.5,0,0],LeftArm:[-.8,0,-.25],LeftForeArm:[-1.4,0,0]},
  {...stance,Spine:[0,-.5,0],RightArm:[-.5,0,.3],RightForeArm:[-1.7,0,0],LeftArm:[-.8,0,-.25],LeftForeArm:[-1.4,0,0]},
  {...stance,Spine:[.16,.5,0],RightArm:[-1.57,0,.05],RightForeArm:[-.02,0,0],LeftArm:[-.8,0,-.25],LeftForeArm:[-1.4,0,0]},
  {...stance,Spine:[.12,.4,0],RightArm:[-1.5,0,.05],RightForeArm:[-.1,0,0]},
  {...stance,RightArm:[-.6,0,0],RightForeArm:[-1,0,0]},neutral]),
 clip('방어',[0,.22,.45,.65,1.2,1.5,1.8],[neutral,
  {...stance,Spine:[.1,0,0],LeftArm:[-.9,0,-.35],RightArm:[-.9,0,.35],LeftForeArm:[-1.6,0,0],RightForeArm:[-1.6,0,0]},
  {...stance,Spine:[.15,0,0],LeftArm:[-1,0,-.3],RightArm:[-1,0,.3],LeftForeArm:[-1.5,0,0],RightForeArm:[-1.5,0,0]},
  {...stance,Spine:[-.12,0,0],Head:[.15,0,0],LeftArm:[-.8,0,-.3],RightArm:[-.8,0,.3],LeftForeArm:[-1.7,0,0],RightForeArm:[-1.7,0,0]},
  {...stance,Spine:[.1,0,0],LeftArm:[-.9,0,-.3],RightArm:[-.9,0,.3],LeftForeArm:[-1.6,0,0],RightForeArm:[-1.6,0,0]},
  {...stance,LeftArm:[-.4,0,-.2],RightArm:[-.4,0,.2]},neutral]),
 clip('마법 시전',[0,.3,.7,1.0,1.12,1.3,1.65,2],[neutral,
  {...stance,Spine:[-.08,0,0],LeftArm:[-.7,0,-.5],RightArm:[-.7,0,.5],LeftForeArm:[-1.1,0,0],RightForeArm:[-1.1,0,0]},
  {...stance,Spine:[-.12,0,0],Head:[-.1,0,0],LeftArm:[-1.2,0,-.4],RightArm:[-1.2,0,.4],LeftForeArm:[-1.2,0,0],RightForeArm:[-1.2,0,0]},
  {...stance,Spine:[-.15,0,0],LeftArm:[-1.25,0,-.35],RightArm:[-1.25,0,.35],LeftForeArm:[-1.3,0,0],RightForeArm:[-1.3,0,0]},
  {...stance,Spine:[.2,0,0],LeftArm:[-1.55,0,-.12],RightArm:[-1.55,0,.12],LeftForeArm:[-.05,0,0],RightForeArm:[-.05,0,0]},
  {...stance,Spine:[.12,0,0],LeftArm:[-1.5,0,-.15],RightArm:[-1.5,0,.15],LeftForeArm:[-.1,0,0],RightForeArm:[-.1,0,0]},
  {...stance,LeftArm:[-.4,0,-.25],RightArm:[-.4,0,.25]},neutral])
 ];
}
