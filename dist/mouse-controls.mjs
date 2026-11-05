// Mouse events report every button transition, including a second held button.
export function bindMouseControls(canvas,releaseTarget,{move,begin,release,cancel}){
 const down=e=>{if(e.button===0){e.preventDefault();begin(e);}else if(e.button===2)move(e);};
 const motion=e=>{if(e.buttons&2)move(e);};
 const up=e=>{if(e.button===0)release(e);};
 const context=e=>e.preventDefault();
 canvas.addEventListener('mousedown',down);canvas.addEventListener('mousemove',motion);
 releaseTarget.addEventListener('mouseup',up);canvas.addEventListener('contextmenu',context);
 canvas.addEventListener('pointercancel',cancel);
 return()=>{canvas.removeEventListener('mousedown',down);canvas.removeEventListener('mousemove',motion);releaseTarget.removeEventListener('mouseup',up);canvas.removeEventListener('contextmenu',context);canvas.removeEventListener('pointercancel',cancel);};
}
