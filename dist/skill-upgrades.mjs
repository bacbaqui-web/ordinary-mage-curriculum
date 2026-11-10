export function renderSkillUpgrades(root,progress,loadout,runes,maxRank=3){
 for(const k of ['q','w','e']){const n=progress.ranks[k],r=runes[loadout[k]],el=root.getElementById('key-'+k),available=progress.points>0&&n<maxRank;
  el.disabled=!available;el.classList.toggle('upgrade-ready',available);el.classList.toggle('unlearned',n===0);
  const action=n===0?r.name+' 배우기':n<maxRank?r.name+' 강화 '+(n+1):r.name+' 숙련 완료';
  el.setAttribute('aria-label',({q:'기본',w:'좌클릭',e:'우클릭'}[k])+' · '+action);el.title=available?action+' · 스킬 포인트 1 사용':n>=maxRank?'최대 숙련도':'레벨업하면 강화할 수 있습니다.';
  el.querySelector('small').textContent=k==='q'&&loadout[k]==='i'&&n>=2?'숙련 '+n+' / 3 · 충전 중 Shift: 빙결 두 륜':n?'숙련 '+n+' / 3 · '+(n===1?'기본 위력':(loadout[k]==='e'?'내구도':'직접 피해')+' +'+((n-1)*15)+'%'):'미습득';
 }
}
