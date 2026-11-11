import test from 'node:test';
import assert from 'node:assert/strict';
import {EFFECTS,FIELDS,DEFAULTS,defaultPreset,validatePreset,applyPreset,EffectStore,spellKey} from './dist/elemental-presets.mjs';
import {settings} from './dist/vendor/elemental/src/config/settings.js';

test('all six original effects expose valid settings and round-trip their defaults',()=>{
 assert.equal(Object.keys(EFFECTS).length,6);
 for(const effect of Object.keys(EFFECTS)){
  const p=defaultPreset(effect);assert.deepEqual(validatePreset(JSON.parse(JSON.stringify(p))),p);
  for(const field of FIELDS[effect])assert.notEqual(DEFAULTS[effect][field.key],undefined);
 }
});
test('preset validation constrains imported values and rejects unknown types',()=>{
 const p=defaultPreset('ice');p.values.height=1e20;p.values.spikeCount=-3;p.values.colorIce='url(javascript:evil)';p.values.speed=Infinity;p.values.unknown=100;p.distance=-10;p.global.particleCount=1e7;
 const v=validatePreset(p);assert.equal(v.values.height,7);assert.equal(v.values.spikeCount,12);assert.equal(v.values.colorIce,DEFAULTS.ice.colorIce);assert.equal(v.values.speed,DEFAULTS.ice.speed);assert.equal(v.distance,2);assert.equal(v.global.particleCount,2);assert.equal(v.values.unknown,undefined);
 for(const effect of ['__proto__','constructor','not-an-effect'])assert.throws(()=>validatePreset({version:1,effect}));
 assert.throws(()=>validatePreset({version:2,effect:'ice'}));assert.throws(()=>spellKey('../q'));
});
test('saved effects and drafts stay separate for spells, hands and charge states',()=>{
 const data=new Map(),storage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};const store=new EffectStore(storage);
 const a=spellKey('i',{hand:'left'}),b=spellKey('i',{hand:'right'}),c=spellKey('i',{hand:'left',charged:true});assert.equal(new Set([a,b,c]).size,3);
 store.write(a,defaultPreset('ice'));store.write(a,defaultPreset('meteor'),true);store.write(b,defaultPreset('beam'));
 assert.equal(store.read(a).effect,'ice');assert.equal(store.read(a,true).effect,'meteor');assert.equal(store.read(b).effect,'beam');assert.equal(store.read(c),null);assert.equal(store.read('qqw'),null);
 assert.equal(spellKey('qqw',{hand:'left'}),spellKey('qqw',{hand:'right'}));
 const failing=new EffectStore({setItem(){throw new Error('quota');}});assert.throws(()=>failing.write(a,defaultPreset()),/quota/);
});
test('changing effects resets upstream state without retaining another spells palette',()=>{
 const original=settings.ice;const custom=defaultPreset('ice');custom.values.colorIce='#ff0000';custom.values.height=5;applyPreset(custom);assert.equal(settings.ice,original);assert.equal(settings.ice.height,5);assert.equal(settings.ice.colorIce,'#ff0000');applyPreset(defaultPreset('thunder'));assert.equal(settings.ice.height,DEFAULTS.ice.height);assert.equal(settings.ice.colorIce,DEFAULTS.ice.colorIce);
});
