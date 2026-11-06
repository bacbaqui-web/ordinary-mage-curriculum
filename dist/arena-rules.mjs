// Shared arena collision data: AI rendering and online simulation use the same walls.
export const OBSTACLES=[{x:-4,z:-2,w:3,h:1.1},{x:4,z:2,w:3,h:1.1},{x:1,z:-6,w:1.8,h:1.8},{x:-1,z:6,w:1.8,h:1.8},{x:-13,z:-9,w:4,h:2},{x:12,z:10,w:4,h:2},{x:13,z:-9,w:2,h:4},{x:-12,z:12,w:2,h:4}];
export function arenaCollision(x,z,r=.45){return Math.abs(x)>23.6||Math.abs(z)>21.6||OBSTACLES.some(o=>Math.abs(x-o.x)<o.w/2+r&&Math.abs(z-o.z)<o.h/2+r);}
