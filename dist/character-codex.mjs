import {CHARACTERS} from './characters.mjs';
import {RUNES,describe} from './combo-design.mjs?v=ice2';
import {SPACE_SKILLS} from './space-skills.mjs?v=turn-rates-1';
import {ICE_BASIC} from './ice-basic.mjs?v=pose-speed-1';

export function mountCharacterCodex(host){
 host.innerHTML=`<summary>캐릭터 도감 <span>${CHARACTERS.length}명</span></summary><div class="codex-grid" aria-label="캐릭터 선택">${CHARACTERS.map(c=>`<button type="button" data-character="${c.id}" aria-pressed="false" aria-label="${c.name} · ${RUNES[c.rune].name}"><img src="${c.image}" alt="" loading="lazy"><b>${c.name}</b><small>${RUNES[c.rune].icon} ${RUNES[c.rune].name}</small></button>`).join('')}</div><div class="codex-detail" aria-live="polite"></div>`;
 function choose(id){
  const c=CHARACTERS.find(c=>c.id===id),r=RUNES[c.rune],space=SPACE_SKILLS[c.rune],spell=describe(c.rune);
  host.querySelectorAll('[data-character]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.character===id)));
  const basic=c.rune==='i'?`<p><b>좌클릭 · ${ICE_BASIC.left.name}</b><br>왼손에서 얼음탄을 발사합니다. 재사용 ${ICE_BASIC.left.cooldown}초.</p><p><b>우클릭 · ${ICE_BASIC.right.name}</b><br>오른손에서 ${ICE_BASIC.right.life}초 동안 얼음안개를 뿜습니다. 사용 중에는 움직일 수 없습니다. 재사용 ${ICE_BASIC.right.cooldown}초.</p><p>두 공격 모두 맞은 상대의 이동 속도를 늦춥니다.</p>`:`<p><b>좌·우 클릭 · ${c.rune==='e'?'선택한 보조 공격 마법':spell.name}</b><br>${c.rune==='e'?'장벽 전문 캐릭터는 선택한 보조 공격 마법 하나로 시작합니다. 사냥으로 장벽을 배울 수 있습니다.':spell.steps.join(' ')}</p>`;
  host.querySelector('.codex-detail').innerHTML=`<img class="codex-portrait" src="${c.image}" alt="${c.name} 캐릭터 일러스트"><div><span class="codex-rune" style="color:${r.color}">${r.icon} 전문 1륜 · ${r.name}</span><h2>${c.name} <small>${c.job}</small></h2><p class="codex-line">${c.line}</p><div class="codex-skills"><section><h3>기본 공격</h3>${basic}</section><section><h3>Space · ${space.name}</h3><p>${space.desc}</p><small>재사용 ${space.cooldown}초 · 사용 중 충전 일시정지</small></section></div><button type="button" class="codex-combos" data-seq="${c.rune}">${r.name} 조합 보기 →</button></div>`;
 }
 host.addEventListener('click',e=>{const b=e.target.closest('[data-character]');if(b)choose(b.dataset.character);if(e.target.closest('.codex-combos'))requestAnimationFrame(()=>document.getElementById('bases').scrollIntoView({behavior:'smooth',block:'start'}));});
 choose(CHARACTERS[0].id);
}
