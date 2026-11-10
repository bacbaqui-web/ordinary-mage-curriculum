import {mountCharacterCodex} from './character-codex.mjs?v=codex1';
import {RevisionRequests} from './revision-requests.mjs?v=compact2';
import {mountPlanAudio} from './plan-audio.mjs?v=compact2';
import {DAMAGE_CATALOG} from './damage-catalog.mjs?v=compact2';
import {RUNES,valid,describe} from './combo-design.mjs?v=bolt17';
import {mountAtlasPreview} from './atlas-preview.mjs?v=movement-settings-1';
const $=id=>document.getElementById(id),ids=Object.keys(RUNES);let seq=valid(location.hash.slice(1))?location.hash.slice(1):'qqw',branch=seq.slice(0,2),dispose=()=>{},disposeSound=()=>{};
const requests=new RevisionRequests();let disposeRequest=()=>{};
const recipe=s=>[...s].map(k=>RUNES[k].name).join(' → ');
const icons=s=>[...s].map(k=>`<span class="rune-icon" style="--rune:${RUNES[k].color}" title="${RUNES[k].name}">${RUNES[k].icon}</span>`).join('<i>＋</i>');
function button(s){const d=describe(s);return `<button data-seq="${s}" class="node ${seq===s?'selected':''} ${seq.startsWith(s)?'path':''}" aria-pressed="${seq===s}"><span class="icon-formula">${icons(s)}</span><b>${d.name}</b></button>`;}
function render(){const base=seq[0],d=describe(seq);if(branch.length!==2||branch[0]!==base)branch=base+base;if(seq.length>1)branch=seq.slice(0,2);document.documentElement.style.setProperty('--accent',d.color);
$('bases').innerHTML=ids.map(k=>`<button class="base-rune" data-seq="${k}" aria-pressed="${base===k}"><span class="rune-icon" style="--rune:${RUNES[k].color}">${RUNES[k].icon}</span><span><b>${RUNES[k].name}</b></span></button>`).join('');
const pool=ids;$('root').innerHTML=button(base);$('pairs').innerHTML=pool.map(k=>button(base+k)).join('');$('triples').innerHTML=pool.map(k=>button(branch+k)).join('');
dispose();disposeSound();disposeRequest();const damage=DAMAGE_CATALOG[seq],number=v=>Math.round(v).toLocaleString('ko-KR');
const stats=damage?`<section class="damage-panel compact-damage"><strong title="완충·숙련 1·방어력 0인 고정 표적 기준. 누적 피해를 시전 후 피해 종료 시간(최소 1초)으로 나눕니다. 충전·재사용 시간은 제외합니다.">${number(damage.total/Math.max(1,damage.duration))} <span>DPS</span></strong><dl><dt>타격 피해</dt><dd>${number(damage.direct)}</dd><dt>지속 피해</dt><dd>${number(damage.dot)}</dd></dl></section>`:'';
$('detail').innerHTML=`<div class="spell-heading"><div class="icon-formula">${icons(seq)}</div><h2>${d.name}</h2></div><div class="preview-wrap"><div id="atlasPreview"></div><div id="planSound"></div></div>${stats}<section id="revisionRequest" class="revision-request"></section>`;
disposeRequest=requests.mount($('revisionRequest'),seq,{compact:true});const previewAudio=mountPlanAudio($('planSound'),seq,{compact:true});disposeSound=()=>previewAudio.dispose();dispose=mountAtlasPreview($('atlasPreview'),seq,previewAudio);$('atlasPreview').querySelector(':scope > small')?.remove();renderRequests();requestAnimationFrame(drawConnections);}
function drawConnections(){const tree=$('tree'),svg=$('connections'),r=tree.getBoundingClientRect();svg.setAttribute('viewBox',`0 0 ${tree.clientWidth} ${tree.scrollHeight}`);svg.style.height=tree.scrollHeight+'px';const paths=[];function link(a,b,on){if(!a||!b)return;const ar=a.getBoundingClientRect(),br=b.getBoundingClientRect(),x=ar.right-r.left,y=ar.top+ar.height/2-r.top,u=br.left-r.left,v=br.top+br.height/2-r.top,m=(x+u)/2;paths.push(`<path class="${on?'active':''}" d="M ${x} ${y} C ${m} ${y},${m} ${v},${u} ${v}"/>`);}const root=$('root').firstElementChild;for(const b of $('pairs').children)link(root,b,b.dataset.seq===branch);const selected=[...$('pairs').children].find(b=>b.dataset.seq===branch);for(const b of $('triples').children)link(selected,b,b.dataset.seq===seq);svg.innerHTML=paths.join('');}
function select(s){if(!valid(s))return;seq=s;history.replaceState(null,'','#'+seq);render();}document.addEventListener('click',e=>{const b=e.target.closest('[data-seq]');if(b)select(b.dataset.seq)});window.addEventListener('hashchange',()=>{if(valid(location.hash.slice(1))){seq=location.hash.slice(1);render()}});new ResizeObserver(()=>requestAnimationFrame(drawConnections)).observe($('tree'));window.addEventListener('pagehide',()=>dispose());render();

function renderRequests(){
 document.querySelectorAll('.node[data-seq]').forEach(node=>{let badge=node.querySelector('.request-badge');const exists=!!requests.items.get(node.dataset.seq)?.text;if(exists&&!badge){badge=document.createElement('small');badge.className='request-badge';badge.textContent='수정 요청 있음';node.append(badge);}else if(!exists&&badge)badge.remove();});
 const list=document.getElementById('requestList');list.replaceChildren();const entries=[...requests.items.values()].filter(x=>x.text).sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt));document.getElementById('requestTotal').textContent='저장한 수정 요청 '+entries.length+'개';
 if(!entries.length){const text=document.createElement('p');text.textContent=requests.error||'저장한 수정 요청이 없습니다.';list.append(text);}
 for(const item of entries){const button=document.createElement('button');button.type='button';button.textContent=recipe(item.sequence)+' · '+item.text.slice(0,70)+(item.text.length>70?'…':'');button.onclick=()=>{select(item.sequence);document.getElementById('revisionRequest').scrollIntoView({behavior:'smooth',block:'center'});};list.append(button);}

}
requests.listeners.add(renderRequests);void requests.load();

mountCharacterCodex(document.getElementById('characterCodex'));
