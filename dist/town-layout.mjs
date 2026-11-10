// Metres, one shared X/Z grid. Camera is at +X,+Z: NW top, SW left, SE bottom, NE right.
export const TOWN_HALF=60;
export const DISTRICTS=[
 {id:'mart',name:'식자재마트',x:-33,z:33,color:0x8a858c},
 {id:'factory',name:'공장',x:-33,z:-33,color:0xaaa4a7},
 {id:'park',name:'중앙공원',x:33,z:33,color:0x809b68},
 {id:'office',name:'면사무소',x:33,z:-33,color:0xbeb3ad}
];
export const BUILDINGS=[
 {id:'mart',x:-47,z:32,w:18,h:42,height:7.8,color:0xe0d9bd,front:Math.PI/2},
 {id:'factory',x:-33,z:-48,w:44,h:18,height:10,color:0x92a3b1,front:0},
 {id:'office',x:33,z:-48,w:40,h:17,height:9.5,color:0xe8dfc9,front:0}
];
export const CARS=[
 {x:-32,z:18,color:0xe7e8e2},{x:-32,z:44,color:0x557c9b},{x:-16,z:49,color:0xe9e5dc},
 {x:-14,z:-31.5,color:0xe1e6df},{x:-14,z:-22.5,color:0x506e8c},
 {x:21,z:-30.5,color:0xe7e6de},{x:42,z:-18.5,color:0x637f9d},
 {x:-45,z:-31,w:2.8,h:6.8,color:0xe6e5dc,truck:true}
];
export const TREES=[];
for(let n=13;n<57;n+=8){TREES.push({x:n,z:56},{x:56,z:n});}
for(const [x,z] of [[15,15],[23,15],[43,15],[51,15],[15,25],[15,43],[23,51],[43,51],[-8,-15],[-8,-30],[-8,18],[-8,38],[15,-8],[35,-8],[52,-8]])TREES.push({x,z});
for(const side of[-1,1])for(const n of[-48,-21,21,48]){
 for(const t of[{x:side*8,z:n},{x:n,z:side*8}])if(!TREES.some(a=>Math.hypot(a.x-t.x,a.z-t.z)<5))TREES.push(t);
}
export const STREET_PROPS=[
 ...[[ -6.1,10.2,0],[6.1,-10.2,Math.PI],[10.2,6.1,Math.PI/2],[-10.2,-6.1,-Math.PI/2]].map(([x,z,front])=>({kind:'signal',x,z,front,w:.35,h:.35})),
 {kind:'shelter',x:-7.8,z:-47,w:1.65,h:5.8},
 {kind:'notice',x:51,z:-35,w:2.8,h:.6},
 {kind:'recycle',x:-56,z:9,w:3.6,h:1.4},
 {kind:'recycle',x:55,z:-56,w:3.6,h:1.4},
 {kind:'bin',x:52,z:53,w:.7,h:.7},
 {kind:'bin',x:14,z:53,w:.7,h:.7}
];
// Keep canopies and tree trunks clear of the bus shelter and service furniture.
for(let i=TREES.length-1;i>=0;i--)if(STREET_PROPS.some(p=>Math.abs(TREES[i].x-p.x)<p.w/2+1.5&&Math.abs(TREES[i].z-p.z)<p.h/2+1.5))TREES.splice(i,1);
export const BENCHES=[{x:24,z:22},{x:42,z:22},{x:24,z:44},{x:42,z:44}];
export const LAMP_POSITIONS=[[-6,12],[-6,47],[-6,-21],[12,-6],[48,-6],[6,46]];
export const OBSTACLES=[
 ...BUILDINGS.map(b=>({...b,kind:'building'})),
 ...CARS.map(c=>({x:c.x,z:c.z,w:c.w||4.5,h:c.h||2.1,kind:'vehicle'})),
 {x:33,z:33,w:7.6,h:7.6,kind:'pavilion'},
 ...BENCHES.map(b=>({...b,w:3,h:.8,kind:'bench'})),
 ...TREES.map(t=>({...t,w:.65,h:.65,kind:'tree'})),
 ...STREET_PROPS.map(p=>({...p})),
 ...LAMP_POSITIONS.map(([x,z])=>({x,z,w:.2,h:.2,kind:'lamp'})),
 {x:-52,z:-34,w:4,h:3,kind:'cargo'},
 {x:-52,z:8,w:3,h:2,kind:'cargo'},
 ...[-1,1].flatMap(s=>[{x:s*60,z:0,w:.5,h:120,kind:'boundary'},{x:0,z:s*60,w:120,h:.5,kind:'boundary'}])
];
export const ENCOUNTERS=[{x:-23,z:28},{x:-24,z:-22},{x:25,z:17},{x:33,z:-28}];
export function townCollision(x,z,r=.45){return !Number.isFinite(x)||!Number.isFinite(z)||Math.abs(x)+r>=59.75||Math.abs(z)+r>=59.75||OBSTACLES.some(o=>Math.abs(x-o.x)<o.w/2+r&&Math.abs(z-o.z)<o.h/2+r);}
