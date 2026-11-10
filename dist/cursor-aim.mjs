import {Plane,Vector3,Raycaster} from './three.module.js';
import {hasFireRecipe,fireSpec} from './fire-spec.mjs?v=bolt17';
import {hasIceRecipe} from './ice-spec.mjs?v=ice-charge-2';
export function spellAimHeight(sequence){
 if(sequence==='i'||hasIceRecipe(sequence)&&['i','w'].includes(sequence.at(-1)))return 1.42;
 if(hasIceRecipe(sequence))return ['q','p','s','h'].includes(sequence.at(-1))?1:0;
 if(hasFireRecipe(sequence)){const spec=fireSpec(sequence);return ['l','e','t','g'].includes(spec.op)?0:1;}
 const operations=sequence.length===1?sequence:sequence.slice(1),delivery=[...operations].reverse().find(op=>!['q','i','d'].includes(op));
 return delivery==='w'?1:0;
}
const ray=new Raycaster(),plane=new Plane(new Vector3(0,1,0));
export function cursorAim(pointer,camera,height=0){plane.constant=-height;ray.setFromCamera(pointer,camera);const p=ray.ray.intersectPlane(plane,new Vector3());if(p)p.y=0;return p;}
