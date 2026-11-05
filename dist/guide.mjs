import {groundDescription} from './ground.mjs?v=zones1';
import {forceDescription} from './forces.mjs?v=zones1';
import {elementalDescription} from './elements.mjs?v=zones1';
import {composition} from './loadout.mjs?v=zones1';
export function describeSpell(seq){
 const ground=groundDescription(seq);if(ground)return ground;
 const force=forceDescription(seq);if(force)return force;
 const elemental=elementalDescription(seq);if(elemental)return elemental;
 if(/[ilg]/.test(seq)){
 const s=composition(seq),multi=seq.length>1;
 const parts=[{shield:multi?'보호막을 두르고 주변에 피해 구역을 만듭니다.':'짧게 보호막을 두릅니다.',field:'조준한 곳에 지속 피해 구역을 만듭니다.',cone:'앞쪽 범위의 적을 타격합니다.',projectile:seq.startsWith('ll')?'전격탄 세 발을 펼쳐 쏩니다.':'조준한 방향으로 마법탄을 쏩니다.'}[s.shape]];
 if(s.slow)parts.push('맞은 적이 느려집니다.');if(s.force<0)parts.push('적을 끌어당깁니다.');if(s.force>0)parts.push('적을 밀칩니다.');if(s.echo)parts.push('잠시 뒤 추가 피해를 줍니다.');if(s.burn)parts.push('화상 피해를 남깁니다.');if(s.pierce&&s.shape==='projectile')parts.push('적을 관통합니다.');if(s.blast&&s.shape==='projectile')parts.push('끝에서 폭발합니다.');return parts.join(' ');
 }
 const base=seq.slice(0,2),third=seq[2],parts=[];
 if(seq[0]==='q'){
 parts.push(base==='qq'?'불꽃 세 발을 펼쳐 쏩니다.':seq==='q'?'짧은 불꽃을 쏩니다.':base==='qw'?'멀리 날아가는 화염탄을 쏩니다.':'느린 불꽃 구체를 쏘고 끝에 화염 구역을 남깁니다.');
 if(third==='q')parts.push('끝에서 폭발합니다.');if(third==='w')parts.push(base==='qq'?'사거리가 늘어납니다.':base==='qw'?'더 빠르게 날아가 적을 관통합니다.':'구체가 빨라지고 적을 밀칩니다.');if(third==='e'&&base!=='qe')parts.push('끝에 화염 구역을 남깁니다.');
 }else if(seq[0]==='w'){
 if(base==='we'){parts.push('조준한 곳에 적을 밀어내는 지속 피해 구역을 만듭니다.');if(third==='e')parts.push('구역이 넓어집니다.');if(third==='q')parts.push('보복 피해가 있는 보호막을 얻습니다.');}
 else{parts.push(base==='ww'?'넓은 전방의 적을 강하게 밀칩니다.':'앞쪽 적을 타격하고 밀칩니다.');if(seq.includes('q'))parts.push('열기로 타격 피해가 커집니다.');if(third==='q')parts.push('앞에 화염 구역을 남깁니다.');if(third==='w')parts.push('반동으로 뒤로 물러납니다.');if(third==='e')parts.push('보호막을 얻습니다.');}
 }else{parts.push(base==='ee'?'더 튼튼한 보호막을 두릅니다.':'보호막을 두릅니다.');if(base==='ew')parts.push('앞으로 돌진하며 적을 밀칩니다.');if(seq.includes('q'))parts.push('주변에 화염 구역을 만들고 가까운 적에게 보복 피해를 줍니다.');if(third==='e')parts.push('보호막 유지 시간이 늘어납니다.');}
 return parts.join(' ')+(seq.length===3?' 세 원의 충전으로 위력이 커집니다.':'');
}
