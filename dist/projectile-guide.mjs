import {Vector3} from './three.module.js';
import {ICE_BASIC} from './ice-basic.mjs?v=mist-ring-1';
import {hasIceRecipe,iceSpec} from './ice-spec.mjs?v=shift-trajectory-1';
import {hasFireRecipe,fireSpec} from './fire-spec.mjs';
import {compileSpell,spellReach} from './live-spells.mjs?v=integer-damage-1';
// Only traveling shots use an airborne lane. Installed areas keep ground markers.
export function projectileGuideSpec(sequence,hand='left'){
 if(sequence==='i')return hand==='left'?{range:ICE_BASIC.left.range,width:.13}:null;
 if(hasIceRecipe(sequence)){const s=iceSpec(sequence);return ['i','w'].includes(s.op)&&!(sequence==='ii'&&hand==='right')?{range:s.range,width:s.op==='i'?.16:.43}:null;}
 if(hasFireRecipe(sequence)){const s=fireSpec(sequence);return s.op==='w'?{range:s.range,width:s.steam?.6:s.orbRadius||.5}:null;}
 let n=compileSpell(sequence,1),range=spellReach(sequence);
 while(['q','i','d'].includes(n.op)){if(n.op==='q')range*=1.2;n=n.inner;}
 if(['e','t'].includes(n.op)&&n.inner?.op==='w')n={...n.inner,deliver:true,inner:{...n,inner:n.inner.inner}};
 if(n.op!=='w'||(!n.deliver&&['e','t'].includes(n.inner?.op)))return null;
 return {range,width:n.inner?.op==='w'?.25:n.inner?.op==='q'?.72:.4};
}
export function projectileGuidePoints(origin,direction,spec,blocked=()=>false){
 const dir=new Vector3(direction.x,0,direction.z).normalize(),side=new Vector3(-dir.z,0,dir.x).multiplyScalar(spec.width);
 let range=spec.range;
 for(let d=0;d<=spec.range;d+=.06){const p=origin.clone().addScaledVector(dir,d);if(blocked(p,spec.width)){range=Math.max(0,d-.06);break;}}
 const end=origin.clone().addScaledVector(dir,range);
 return [origin.clone(),end.clone(),end.clone().add(side),origin.clone().add(side),origin.clone().sub(side),end.clone().sub(side),end.clone()];
}
