import {damageNumber} from './damage-number.mjs?v=integer-damage-1';
import {Vector3} from './three.module.js';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export class HealthTrail{
 constructor(hp,max=100){this.max=max;this.reset(hp);}
 reset(hp){this.hp=this.trail=this.from=clamp(hp,0,this.max);this.start=Infinity;}
 update(hp,time){
  this.tick(time);hp=clamp(hp,0,this.max);const damage=Math.max(0,this.hp-hp);
  if(damage){this.from=this.trail;this.start=time+1;this.hp=hp;}
  else if(hp>this.hp)this.reset(hp);
  return damage;
 }
 tick(time){if(time>=this.start){const t=clamp((time-this.start)/.45,0,1),ease=t*t*(3-2*t);this.trail=this.from+(this.hp-this.from)*ease;}return this.trail;}
}
export class HealthHUD{
 constructor(root,{visible=()=>true}={}){this.root=root;this.visible=visible;this.entries=new Map();this.numbers=[];this.time=0;this.serial=0;}
 track(actor,fill=null,label='체력'){
  let marker=null;
  if(!fill){marker=document.createElement('div');marker.className='monster-health';marker.innerHTML='<div class="bar"><i></i></div>';this.root.append(marker);fill=marker.querySelector('i');}
  const bar=fill.parentElement,trail=document.createElement('i');trail.className='hp-trail';fill.classList.add('hp-current');bar.prepend(trail);bar.setAttribute('role','progressbar');bar.setAttribute('aria-label',label);bar.setAttribute('aria-valuemin','0');
  this.entries.set(actor,{marker,bar,fill,trail,state:new HealthTrail(actor.hp,actor.maxHp||100)});
 }
 observe(actor){
  const entry=this.entries.get(actor);if(!entry)return;
  const damage=entry.state.update(actor.hp,this.time);
  if(damage&&this.visible(actor)){
   const node=document.createElement('span');node.className='damage-number';node.textContent=damageNumber(damage);node.setAttribute('aria-label','피해 '+node.textContent);this.root.append(node);
   this.numbers.push({node,x:actor.x,z:actor.z,y:actor.monster?1.9:3.2,born:this.time,offset:((this.serial++%3)-1)*15});
   if(this.numbers.length>80)this.numbers.shift().node.remove();
  }
 }
 update(dt,camera,width,height){
  this.time+=dt;
  const project=(x,y,z)=>{const p=new Vector3(x,y,z).project(camera);return {x:(p.x+1)*width/2,y:(1-p.y)*height/2,visible:p.z>=-1&&p.z<=1&&Math.abs(p.x)<1.1&&Math.abs(p.y)<1.1};};
  for(const [actor,e] of this.entries){
   this.observe(actor);e.state.tick(this.time);e.fill.style.width=e.state.hp/e.state.max*100+'%';e.trail.style.width=e.state.trail/e.state.max*100+'%';e.bar.setAttribute('aria-valuemax',String(e.state.max));e.bar.setAttribute('aria-valuenow',String(e.state.hp));
   if(e.marker){const p=project(actor.x,1.5,actor.z);e.marker.style.display=p.visible&&this.visible(actor)?'':'none';e.marker.style.left=p.x+'px';e.marker.style.top=p.y+'px';if(actor.dead&&e.state.trail<=.001){e.marker.remove();this.entries.delete(actor);}}
  }
  for(let i=this.numbers.length-1;i>=0;i--){const n=this.numbers[i],age=this.time-n.born;if(age>=1.2){n.node.remove();this.numbers.splice(i,1);continue;}const p=project(n.x,n.y,n.z);n.node.style.display=p.visible?'':'none';n.node.style.left=(p.x+n.offset)+'px';n.node.style.top=(p.y-age*40)+'px';n.node.style.opacity=String(Math.min(1,(1.2-age)/.35));}
 }
 reset(){for(const e of this.entries.values()){e.marker?.remove();e.trail.remove();}for(const n of this.numbers)n.node.remove();this.entries.clear();this.numbers=[];this.time=0;}
}
