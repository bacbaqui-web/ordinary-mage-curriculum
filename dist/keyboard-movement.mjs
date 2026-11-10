// Screen-relative movement for the arena camera (equal X/Z offsets, 45 degree azimuth).
export const MOVEMENT_KEYS=new Set(['KeyW','KeyA','KeyS','KeyD']);
export function movementDirection(keys){
 const horizontal=Number(keys.has('KeyD'))-Number(keys.has('KeyA'));
 const vertical=Number(keys.has('KeyS'))-Number(keys.has('KeyW'));
 const length=Math.hypot(horizontal,vertical);
 if(!length)return {x:0,z:0};
 const cameraLength=Math.SQRT2;
 return {x:(horizontal+vertical)/(length*cameraLength),z:(vertical-horizontal)/(length*cameraLength)};
}
