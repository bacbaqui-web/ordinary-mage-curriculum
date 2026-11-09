// Screen-relative movement for the arena camera (offset 12, 17, 15).
export const MOVEMENT_KEYS=new Set(['KeyW','KeyA','KeyS','KeyD']);
export function movementDirection(keys){
 const horizontal=Number(keys.has('KeyD'))-Number(keys.has('KeyA'));
 const vertical=Number(keys.has('KeyS'))-Number(keys.has('KeyW'));
 const length=Math.hypot(horizontal,vertical);
 if(!length)return {x:0,z:0};
 const cameraLength=Math.hypot(12,15);
 return {x:(horizontal*15+vertical*12)/(length*cameraLength),z:(vertical*15-horizontal*12)/(length*cameraLength)};
}
