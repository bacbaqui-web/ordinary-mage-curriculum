import {settings} from './vendor/elemental/src/config/settings.js';

export const EFFECTS={ice:'얼음 가시',thunder:'번개',meteor:'운석',beam:'광선',snare:'전기 장판',glacier:'원형 얼음벽'};
export const DEFAULTS=structuredClone(settings);
const n=(key,label,min,max,step=.01)=>({key,label,min,max,step,type:'number'});
const c=(key,label)=>({key,label,type:'color'});
export const SHARED=[n('glow','전체 발광',0,3),n('particleCount','입자 수 배율',0,2),n('particleSize','입자 크기 배율',.1,3),n('particleLifetime','입자 수명 배율',.1,3),n('emissionRate','입자 생성량',0,2)];
export const POST=[n('bloomStrength','빛 번짐',0,2.5),n('exposure','화면 밝기',.1,2),n('distortion','열기 왜곡',0,2)];
const common=[n('speed','전달 속도',1,160,.5),n('lifetime','유지 시간',.1,8,.05)];
export const FIELDS={
 ice:[...common,n('width','끝부분 폭',.1,6),n('height','가시 높이',.1,7),n('heightNear','시작 높이',.1,3),n('spikeCount','가시 수',12,288,1),n('radius','가시 굵기',.05,1.2),n('lean','가시 기울기',0,1.5),n('bend','가시 휨',0,1.5),n('facets','결정의 면 수',3,10,1),n('riseTime','솟는 시간',.05,1),n('scatter','흩어짐',0,1.5),c('colorIce','얼음 색'),c('colorDeep','깊은 부분 색'),c('colorRim','가장자리 색'),c('colorCore','중심 색'),n('opacity','불투명도',.1,1),n('glow','발광',0,4),n('mistRate','안개 생성량',0,400,1),n('mistSize','안개 크기',.1,3)],
 thunder:[...common,n('strands','번개 줄기 수',1,24,1),n('width','번개 굵기',.005,.15,.001),n('spread','끝부분 퍼짐',0,3),n('jitter','꺾임 크기',0,1.5),n('jitterScale','꺾임 빈도',.1,3),n('twist','줄기 꼬임',0,3),n('restrike','초당 번쩍임',1,40,1),n('handHeight','시작 높이',.1,3),n('endHeight','도착 높이',0,4),n('fadeTime','사라지는 시간',.05,2),c('colorCore','중심 색'),c('colorInner','안쪽 색'),c('colorOuter','바깥 색'),c('colorHalo','빛 번짐 색'),n('glow','발광',0,5)],
 meteor:[...common,n('radius','운석 크기',.1,2.5),n('arc','궤적 높이',0,8),n('spin','회전 속도',0,10),n('cuts','균열 면 수',1,16,1),n('craters','표면 구덩이 수',0,12,1),n('crackWidth','균열 폭',.005,.15,.001),n('crackGlow','균열 발광',0,5),n('lumpiness','표면 굴곡',0,.6),c('colorRock','암석 색'),c('colorChar','탄 부분 색'),c('colorCrack','균열 색'),c('colorHot','가장 뜨거운 색'),c('colorFlameMid','불꽃 색'),n('glow','발광',0,4)],
 beam:[...common,n('charge','모으는 시간',.05,2),n('radius','광선 반지름',.05,2.5),n('coreWidth','중심 굵기',.05,1.5),n('handHeight','시작 높이',.1,3),n('endHeight','도착 높이',0,4),n('fadeTime','사라지는 시간',.05,2),c('colorCore','중심 색'),c('colorOuter','겉면 색'),c('colorHalo','빛 번짐 색'),c('colorCoil','감기는 선 색'),n('glow','발광',0,5)],
 snare:[...common,n('zoneRadius','장판 반지름',.5,7),n('height','기둥 높이',.5,10),n('columnTwist','기둥 꼬임',0,3),n('columnSpin','기둥 회전',0,4),n('tendrils','바닥 줄기 수',1,24,1),n('rimArcs','테두리 번개 수',1,20,1),n('tendrilWander','바닥 줄기 휨',0,3),n('columnSpread','기둥 퍼짐',.05,2),c('colorCore','중심 색'),c('colorInner','안쪽 색'),c('colorOuter','바깥 색'),c('colorHalo','빛 번짐 색'),n('glow','발광',0,5)],
 glacier:[...common,n('zoneRadius','얼음벽 반지름',.5,7),n('ringHeight','벽 높이',.2,6),n('skirtHeight','주변 파편 높이',.1,4),n('spikeCount','결정 수',12,320,1),n('ringLean','벽 기울기',0,1.5),n('fan','결정 퍼짐',0,2),n('radius','결정 굵기',.05,1.2),n('coreShare','중앙 결정 비율',0,.5),n('coreHeight','중앙 결정 높이',.2,8),n('snowRate','눈 입자 생성량',0,300,1),n('mistRate','안개 생성량',0,400,1),c('colorGlass','얼음 색'),c('colorPrismA','굴절 색'),c('colorEdge','가장자리 색'),c('colorCore','중심 색')]
};
// Keep controls tied to real upstream settings; a renamed upstream field must fail validation.
for(const [effect,fields] of Object.entries(FIELDS))for(const field of fields)if(!(field.key in DEFAULTS[effect]))throw Error(`Unknown effect setting: ${effect}.${field.key}`);
export function spellKey(seq,{hand='left',charged=false}={}){
 if(!/^[qildpetwgsh]{1,3}$/.test(seq))throw Error('마법 조합이 올바르지 않습니다. 마법설계에서 다시 열어 주세요.');
 return seq+(seq.length===1||seq==='ii'?`:${hand==='right'?'right':'left'}${seq.length===1&&charged?':charged':''}`:'');
}
export function defaultPreset(effect='ice'){
 if(!Object.hasOwn(EFFECTS,effect))effect='ice';
 return {version:1,effect,distance:10,values:Object.fromEntries(FIELDS[effect].map(f=>[f.key,DEFAULTS[effect][f.key]])),global:Object.fromEntries(SHARED.map(f=>[f.key,DEFAULTS.global[f.key]])),post:Object.fromEntries(POST.map(f=>[f.key,DEFAULTS.post[f.key]]))};
}
function values(input,fields,defaults){
 const output={...defaults};if(!input||typeof input!=='object')return output;
 for(const f of fields){const v=input[f.key];if(f.type==='color'){if(typeof v==='string'&&/^#[0-9a-f]{6}$/i.test(v))output[f.key]=v;}else if(typeof v==='number'&&Number.isFinite(v))output[f.key]=Math.min(f.max,Math.max(f.min,f.step===1?Math.round(v):v));}
 return output;
}
export function validatePreset(input){
 if(!input||input.version!==1||!Object.hasOwn(EFFECTS,input.effect))throw Error('이 효과 파일을 읽을 수 없습니다. 이 편집기에서 내보낸 JSON 파일을 선택해 주세요.');
 const result=defaultPreset(input.effect);
 result.values=values(input.values,FIELDS[result.effect],result.values);
 result.global=values(input.global,SHARED,result.global);result.post=values(input.post,POST,result.post);
 if(typeof input.distance==='number'&&Number.isFinite(input.distance))result.distance=Math.min(26,Math.max(2,input.distance));
 return result;
}
export function applyPreset(preset){
 const p=validatePreset(preset);
 for(const effect of Object.keys(EFFECTS))Object.assign(settings[effect],DEFAULTS[effect]);
 Object.assign(settings[p.effect],p.values);Object.assign(settings.global,DEFAULTS.global,p.global);Object.assign(settings.post,DEFAULTS.post,p.post);
 // Editor framing has no screen shake or flash: it should stay still while the effect is tuned.
 settings.global.cameraShake=0;settings.post.flashStrength=0;
 return p;
}
export class EffectStore {
 constructor(storage){this.storage=storage;}
 key(spell,draft=false){if(!/^[qildpetwgsh]{1,3}(?::(?:left|right)(?::charged)?)?$/.test(spell))throw Error('마법 저장 이름이 올바르지 않습니다.');return `mage-elemental-v1:${draft?'draft:':'saved:'}${spell}`;}
 read(spell,draft=false){const value=this.storage.getItem(this.key(spell,draft));return value===null?null:validatePreset(JSON.parse(value));}
 write(spell,preset,draft=false){const p=validatePreset(preset);this.storage.setItem(this.key(spell,draft),JSON.stringify(p));return p;}
}
