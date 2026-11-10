import * as T from './three.module.js';
export function createTownCamera(){const c=new T.OrthographicCamera(-30,30,30,-30,.1,600);c.userData.town=true;return c;}
// Equal XYZ camera offset => 45° azimuth, 35.264° elevation; no vanishing point.
export function positionTownCamera(c,{x=0,z=0,aspect=1,span=38,minWidth=span}={}){
 c.aspect=aspect;const vertical=Math.max(span,minWidth/aspect);c.left=-vertical*aspect/2;c.right=vertical*aspect/2;c.top=vertical/2;c.bottom=-vertical/2;
 c.position.set(x+180,180,z+180);c.lookAt(x,0,z);c.updateProjectionMatrix();c.updateMatrixWorld(true);
}
