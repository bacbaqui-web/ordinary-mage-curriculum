import * as T from './three.module.js';
import {MotionPuppet} from './motion-puppet.mjs?v=icepose4';
export function createWizard(scene,color,trim){
 const g=new T.Group(),body=new T.Group();body.position.y=1;g.add(body);
 const palette=[],joints={},parts=[];
 const material=c=>{const m=new T.MeshBasicMaterial({color:c,side:T.DoubleSide});palette.push({material:m,color:m.color.clone()});return m;};
 function box(parent,w,h,d,x,y,z,m){
  const anchor=new T.Object3D();anchor.position.set(x,y,z);parent.add(anchor);
  const flat=new T.Mesh(new T.PlaneGeometry(1,1),m);g.add(flat);
  parts.push({anchor,flat,w,h,face:parent===joints.head&&d<.03});return anchor;
 }

 const headMat=material(0xffce65),torsoMat=material(0x57bdd3),leftArmMat=material(0xf28d61),rightArmMat=material(0xbf8de2),leftLegMat=material(0x83bd69),rightLegMat=material(0x668fe2);
 box(body,.56,.65,.32,0,.25,0,torsoMat);
 const head=new T.Group();head.position.y=.78;body.add(head);joints.head=head;
 box(head,.45,.45,.4,0,0,0,headMat);
 const dark=material(0x263340);box(head,.07,.065,.025,-.11,.04,.211,dark);box(head,.07,.065,.025,.11,.04,.211,dark);
 function limb(name,x,y,upper,lower,width,m){const joint=new T.Group();joint.position.set(x,y,0);body.add(joint);joints[name]=joint;box(joint,width,upper,width,0,-upper/2,0,m);const bend=new T.Group();bend.position.y=-upper;joint.add(bend);joints[name+'Bend']=bend;box(bend,width*.9,lower,width*.9,0,-lower/2,0,m);return bend;}
 limb('leftArm',-.4,.53,.32,.3,.19,leftArmMat);limb('rightArm',.4,.53,.32,.3,.19,rightArmMat);
 const leftFoot=limb('leftLeg',-.17,-.08,.39,.39,.23,leftLegMat),rightFoot=limb('rightLeg',.17,-.08,.39,.39,.23,rightLegMat);
 box(leftFoot,.25,.13,.39,0,-.39,.08,leftLegMat);box(rightFoot,.25,.13,.39,0,-.39,.08,rightLegMat);
 const selection=new T.Mesh(new T.RingGeometry(.59,.65,40),new T.MeshBasicMaterial({color:trim,side:T.DoubleSide}));selection.rotation.x=-Math.PI/2;selection.position.y=.025;g.add(selection);
 g.userData={parts,body,arm:joints.rightArm,joints,palette,phase:0,stride:0,castTime:0};const puppet=new MotionPuppet(g);g.userData.puppet=puppet;puppet.visual.traverse(o=>{if(o.material)palette.push({material:o.material,color:o.material.color.clone()});});for(const p of parts)p.flat.visible=false;scene.add(g);return g;
}
export function animateWizard(g,dt,{speed=0,charging=false,chargeStage=1,cast=0,rolling=false,rollProgress=0,travelX=0,travelZ=1}={}){
 const u=g.userData,j=u.joints;if(!j)return;
 if(charging&&u.puppet.magic.mode!=='hold')u.puppet.magic.press();
 u.puppet.magic.update(dt,chargeStage);
 u.puppet.update(dt,{speed:speed>0?speed/4.4:0,charging,cast});if(speed<.05&&!charging&&!cast){u.puppet.time=0;u.puppet.update(0,{speed:0});}
 u.stride+=(Math.min(1,speed/4.4)-u.stride)*(1-Math.exp(-dt*14));u.phase+=dt*speed*2.5;
 const swing=Math.sin(u.phase)*.65*u.stride;
 for(const p of Object.values(j))p.rotation.set(0,0,0);
 // Signed travel projected onto the character's facing supports walking backwards and sideways.
 j.leftLeg.rotation.x=swing*travelZ;j.rightLeg.rotation.x=-swing*travelZ;
 j.leftLeg.rotation.z=-swing*travelX;j.rightLeg.rotation.z=swing*travelX;
 j.leftLegBend.rotation.x=Math.max(0,-Math.sin(u.phase))*.65*u.stride;
 j.rightLegBend.rotation.x=Math.max(0,Math.sin(u.phase))*.65*u.stride;
 j.leftArm.rotation.x=-swing*.7;j.rightArm.rotation.x=swing*.7;
 j.leftArmBend.rotation.x=j.rightArmBend.rotation.x=-.12;
 u.body.position.y=1+Math.abs(Math.sin(u.phase))*.035*u.stride;
 if(charging||cast>0){j.rightArm.rotation.x=-1.15-cast*.4;j.rightArmBend.rotation.x=charging?-.65:-.1;j.leftArm.rotation.x=-.65;j.leftArm.rotation.z=-.25;}
 if(rolling){j.leftLeg.rotation.x=j.rightLeg.rotation.x=-1;j.leftLegBend.rotation.x=j.rightLegBend.rotation.x=1.6;j.leftArm.rotation.x=j.rightArm.rotation.x=-1.8;u.body.position.y=.85+Math.sin(Math.PI*rollProgress)*.18;}
}

// Transfer the hidden 3D joint pose onto camera-facing 2D pieces.
export function projectWizard(g,camera){
 const puppet=g.userData.puppet;
 puppet.group.rotation.copy(g.userData.body.rotation);
 puppet.render(camera);
}
