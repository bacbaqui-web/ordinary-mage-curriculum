export function attackCooldown(actor,hand,isIce=false){
 const remaining=Math.max(0,actor.cool||0,isIce?(actor[hand==='left'?'iceLeftCool':'iceRightCool']||0):0);
 const total=isIce?(hand==='left'?.8:2.4):(actor.coolMax||.38);
 return {remaining,ready:remaining<=0,progress:Math.max(0,Math.min(1,1-remaining/total))};
}
