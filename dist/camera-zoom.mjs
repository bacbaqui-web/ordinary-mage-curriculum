// Normalize mouse wheels and trackpads without allowing a single large event to jump across the map.
export function wheelZoomSpan(span,{deltaY,deltaMode=0},pageHeight=900,{min=14,max=60}={}){
 if(!Number.isFinite(deltaY)||deltaY===0)return span;
 const pixels=deltaY*(deltaMode===1?16:deltaMode===2?pageHeight:1);
 return Math.max(min,Math.min(max,span*Math.exp(Math.max(-240,Math.min(240,pixels))*.0015)));
}
