import {MOVEMENT_KEYS,movementDirection} from './keyboard-movement.mjs';
export function mouseRecipe(buttons,ranks){
 const base=ranks.q?'q':['w','e'].find(k=>ranks[k]);
 if(!base)return [];
 return [base,...(buttons&1&&ranks.w&&base!=='w'?['w']:[]),...(buttons&2&&ranks.e&&base!=='e'?['e']:[])];
}
export function bindDuelControls(canvas,target,{enabled,begin,release,cancel,walk}){
 const keys=new Set();let buttons=0,spent=false;
 const reset=()=>{keys.clear();buttons=0;spent=false;walk({x:0,z:0});cancel();};
 const down=e=>{if(![0,2].includes(e.button)||!enabled())return;e.preventDefault();const bit=e.button===0?1:2;if(buttons&bit||spent)return;const extending=buttons!==0;buttons|=bit;begin(buttons,e,extending);};
 // First release casts once; the remaining held button must be released before another cast.
 const up=e=>{if(![0,2].includes(e.button))return;const bit=e.button===0?1:2;if(!(buttons&bit))return;buttons&=~bit;if(!spent&&enabled())release(e);spent=!!buttons;};
 const keydown=e=>{if(!MOVEMENT_KEYS.has(e.code)||!enabled()||e.target.closest?.('input,textarea,select,[contenteditable=true]'))return;e.preventDefault();keys.add(e.code);walk(movementDirection(keys));};
 const keyup=e=>{if(!MOVEMENT_KEYS.has(e.code))return;keys.delete(e.code);walk(movementDirection(keys));};
 canvas.addEventListener('mousedown',down);canvas.addEventListener('contextmenu',e=>e.preventDefault());target.addEventListener('mouseup',up);target.addEventListener('keydown',keydown);target.addEventListener('keyup',keyup);target.addEventListener('blur',reset);canvas.addEventListener('pointercancel',reset);
 return {reset};
}
