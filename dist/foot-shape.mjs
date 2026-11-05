// Rounded shoe volume, wide enough to surround the lower leg at the heel.
export function footFaces(foot){
 const rings=[[-.065,0,0],[-.035,.105,.055],[.025,.125,.07],[.16,.12,.06],[.25,.09,.045],[.29,0,0]],count=10;
 const c=Math.cos(foot.angle),s=Math.sin(foot.angle);
 const vertices=rings.map(([z,rx,ry])=>Array.from({length:count},(_,i)=>{
  const a=i/count*Math.PI*2,x=Math.cos(a)*rx,y=Math.sin(a)*ry;
  return [foot.heel[0]+x,foot.heel[1]+y*c+z*s,foot.heel[2]-y*s+z*c];
 }));
 const faces=[];
 for(let r=0;r<rings.length-1;r++)for(let i=0;i<count;i++){
  const j=(i+1)%count;faces.push({vertices:[vertices[r][i],vertices[r][j],vertices[r+1][j],vertices[r+1][i]],shade:.75+.25*Math.max(0,Math.sin((i+.5)/count*Math.PI*2))});
 }
 return faces;
}
