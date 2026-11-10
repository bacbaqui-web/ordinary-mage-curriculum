import {actorShapes} from './combat-hit.mjs?v=movement-settings-1';
import {meshOutline} from './screen-hit.mjs?v=screenhit10';
export class HitboxView{
 constructor(){this.enabled=false;this.canvas=document.createElement('canvas');this.canvas.style.cssText='position:fixed;inset:0;width:100%;height:100%;pointer-events:none';document.querySelector('#arena').after(this.canvas);this.ctx=this.canvas.getContext('2d');}
 clear(){this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height);}
 update(actors,shots,camera){this.canvas.hidden=!this.enabled;if(!this.enabled)return;const w=innerWidth,h=innerHeight;if(this.canvas.width!==w||this.canvas.height!==h){this.canvas.width=w;this.canvas.height=h;}this.clear();const draw=(p,color)=>{if(!p.length)return;const c=this.ctx;c.beginPath();p.forEach((v,i)=>c[i?'lineTo':'moveTo']((v.x+1)*w/2,(1-v.y)*h/2));c.closePath();c.strokeStyle=color;c.lineWidth=2;c.stroke();};for(const a of actors)if(!a.dead&&a.hp>0&&a.g?.visible!==false)for(const p of actorShapes(a,camera))draw(p,a.hitFlash>0?'#ffef54':'#71ff7c');for(const e of shots)if(['shot','projectile','punch'].includes(e.type)&&e.life>0&&e.mesh?.geometry)draw(meshOutline(e.mesh,camera),'#4cddff');}
}
