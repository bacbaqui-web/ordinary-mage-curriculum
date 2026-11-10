import assert from 'node:assert/strict';
import * as T from './dist/three.module.js';
import {runeRing,castFlash,CastingFeedback} from './dist/casting-feedback.mjs';
import {ImpactFeedback} from './dist/impact-feedback.mjs';
import {normalize,DEFAULTS} from './dist/impact-settings.mjs';
const scene=new T.Scene(),ring=runeRing(),flash=castFlash();scene.add(ring,flash);ring.scale.setScalar(.2);
const casting=new CastingFeedback(scene),charge=casting.actor({});
const f=new ImpactFeedback(scene,{watch:false,settings:{...DEFAULTS,runeSize:2,runeBrightness:.5,castGlow:0,castFlash:2,chargeParticles:.25}});
const opacity=ring.children[0].material.opacity,intensity=flash.children[3].intensity;
for(let i=0;i<3;i++){
 f.draw();assert.equal(ring.scale.x,.4);assert.equal(ring.children[0].material.opacity,opacity*.5);assert.equal(flash.children[3].intensity,intensity*2);assert.equal(charge.aura.visible,false);assert.equal(charge.dots.filter(p=>p.visible).length,12);
 f.restore();assert.equal(ring.scale.x,.2);assert.equal(ring.children[0].material.opacity,opacity);assert.equal(flash.children[3].intensity,intensity);assert.equal(charge.aura.visible,true);assert.equal(charge.dots.filter(p=>p.visible).length,48);
}
assert.equal(normalize({anticipation:100}).runeSize,1,'old saved settings keep existing rune appearance');
console.log('PASS: actual rune scale/brightness, aura suppression, flash light, charge particle count, restoration without accumulation and old settings');
