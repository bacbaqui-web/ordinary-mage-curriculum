export const LEGACY_MOTION_KEY='ordinary-mage-pose-editor-v1';
export const CHARACTERS=[
 {id:'default',name:'기본 캐릭터',label:'기본 캐릭터 · 기존 동작'},
 {id:'fire',name:'이솔',label:'화염 · 이솔'},
 {id:'ice',name:'서린',label:'빙결 · 서린',model:'assets/characters/ice-rigged.glb',ankleLift:-.03,ankleBack:.07,garment:{hemDepth:.30,thighRadius:.145,shinRadius:.12},accessories:[{id:'ice-bag',model:'assets/characters/ice-bag.glb',joint:'Hips',width:.60,offset:[-.48,-.10,0],rotation:[0,-Math.PI/2,0],strap:{joint:'LeftArm',color:0x284b83}}]},
 {id:'lightning',name:'번',label:'전격 · 번'},
 {id:'earth',name:'담',label:'대지 · 담'},
 {id:'poison',name:'연두',label:'독 · 연두'},
 {id:'barrier',name:'도윤',label:'장벽 · 도윤'},
 {id:'field',name:'모아',label:'장판 · 모아'},
 {id:'pull',name:'나루',label:'당김 · 나루'},
 {id:'slash',name:'재이',label:'베기 · 재이'},
 {id:'impact',name:'두리',label:'타격 · 두리'}
];
export function characterProfile(id){return CHARACTERS.find(c=>c.id===id)||CHARACTERS[0];}
export function motionStorageKey(id){const c=characterProfile(id);return c.id==='default'?LEGACY_MOTION_KEY:`${LEGACY_MOTION_KEY}:character:${c.id}`;}
export function projectForCharacter(project,id){return {...structuredClone(project),characterId:characterProfile(id).id};}
export function assertCharacterImport(project,id){
 if(project.characterId&&project.characterId!==id)throw Error(`${characterProfile(project.characterId).label} 파일입니다. 해당 캐릭터를 선택한 뒤 열어 주세요.`);
}
