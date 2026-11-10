export function pointsInBox(points,a,b){
 const left=Math.min(a.x,b.x),right=Math.max(a.x,b.x),top=Math.min(a.y,b.y),bottom=Math.max(a.y,b.y);
 return Object.entries(points).filter(([n,p])=>n!=='Neck'&&p.x>=left&&p.x<=right&&p.y>=top&&p.y<=bottom).map(([n])=>n);
}
// Repeated constrained moves approach multiple targets without stretching bones.
// Keep the closest valid result if competing targets cannot all be reached.
export function fitSelected(base,targets,move,point){
 const entries=Object.entries(targets),score=p=>entries.reduce((sum,[n,t])=>sum+point(p,n).reduce((s,v,i)=>s+(v-t[i])**2,0),0);
 let p=structuredClone(base),best=p,bestScore=score(p);
 for(let pass=0;pass<12;pass++){
  for(const [n,t] of entries)p=move(p,n,t);
  const error=score(p);if(error<bestScore){best=structuredClone(p);bestScore=error;}
  if(error<1e-10)break;
 }
 return best;
}
