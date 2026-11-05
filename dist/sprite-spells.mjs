import {impactAsset} from './effect-map.mjs?v=zones1';
// Animated flat sprites only. Collision geometry is owned by the game.
export class SpriteSpells {
 constructor(pixel){this.pixel=pixel;}
 burst(spec,dir,caster,blocked){for(let d=.5;d<=spec.range;d+=.65){const x=caster.x+dir.x*d,z=caster.z+dir.z*d;if(blocked(x,z,.03))break;this.pixel.impact(spec.kind,x,z,.65);}}
 bolt(x,z,spec){this.pixel.play('lightning-strike',x,z,{width:Math.min(4,spec.height*.75)});}
 fall(x,z,spec,color){this.pixel.play(impactAsset(spec.kind),x,z,{width:1.1,color,duration:.28,follow:age=>({x,z,y:.2+spec.height*(1-age/.28)})});}
 pulse(x,z,r,color,life){this.pixel.play('magic-circle',x,z,{width:r*2,color,duration:life});}
 force(spec,dir,caster){this.pixel.play(spec.force<0?'void-implosion':'wind-gust',caster.x+dir.x*1.2,caster.z+dir.z*1.2,{width:2.6,y:.35});}
 ward(){}
 shatter(x,z,width){this.pixel.play('shield-shatter',x,z,{width,y:1.2,center:[.5,.5]});}
 particle(){}
 clear(){}
 update(){}
 stats(){return {particles:0,effects:this.pixel.active.length,style:'pvfx-2d'};}
}
