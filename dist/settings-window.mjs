export function mountSettingsWindow({open,close}){
 const entries=[['skill-plan.html','마법설계'],['pose-editor.html','동작 편집'],['impact-lab.html','타격감']];
 const dialog=document.createElement('dialog');dialog.id='settingsWindow';dialog.setAttribute('aria-label','게임 설정');
 dialog.innerHTML='<div class="settings-bar"><nav aria-label="설정 종류"></nav><button class="settings-close" aria-label="설정 닫기" title="닫기">×</button></div><div class="settings-content"></div>';
 document.body.append(dialog);const nav=dialog.querySelector('nav'),content=dialog.querySelector('.settings-content'),frames=new Map();let trigger=null;
 function suspend(frame){try{const doc=frame.contentDocument;for(const b of doc?.querySelectorAll('button')||[]){if(b.textContent.trim()==='일시정지'||b.getAttribute('aria-label')==='일시정지')b.click();}const game=frame.contentDocument?.getElementById('game'),state=game?.contentWindow?.mageDebug?.();if(state?.running&&!state.paused)game.contentDocument.getElementById('pause')?.click();}catch{}}
 const dock=document.createElement('section');dock.id='impactDock';dock.hidden=true;dock.setAttribute('aria-label','타격감 설정');dock.innerHTML='<div class="settings-bar"><strong>타격감</strong><button class="settings-close" aria-label="타격감 닫기" title="닫기">×</button></div>';document.body.append(dock);dock.querySelector('button').onclick=()=>{dock.hidden=true;document.querySelector('.actions a[href^="impact-lab.html"]')?.focus();};
 function showDock(){if(dialog.open)dialog.close();dock.hidden=false;if(!dock.querySelector('iframe')){const frame=document.createElement('iframe');frame.title='타격감 설정';frame.src='impact-panel.html?v=impact-dock-1';dock.append(frame);}dock.querySelector('button').focus();}
 function select(path){if(path==='impact-lab.html'){showDock();return;}dock.hidden=true;for(const [p,frame] of frames){if(p!==path)suspend(frame);frame.hidden=p!==path;}for(const b of nav.children)b.setAttribute('aria-pressed',String(b.dataset.path===path));if(!frames.has(path)){
  const frame=document.createElement('iframe');frame.title=entries.find(e=>e[0]===path)[1];frame.src=path+'?embedded=1&v=settings-window-1';frame.addEventListener('load',()=>{
   const doc=frame.contentDocument;if(!doc)return;
   for(const a of doc.querySelectorAll('a[href]')){const url=new URL(a.href);if(url.origin===location.origin)a.removeAttribute('target');if(url.origin===location.origin&&/\/(index\.html)?$/.test(url.pathname)){a.hidden=true;}}
   doc.addEventListener('keydown',event=>{if(event.key==='Escape'&&!event.defaultPrevented){event.preventDefault();dialog.close();}});
  });frames.set(path,frame);content.append(frame);
 }}
 function show(path,source){trigger=source;if(path==='impact-lab.html'){showDock();return;}if(!dialog.open){open();dialog.showModal();}select(path);dialog.querySelector('.settings-close').focus();}
 for(const [path,label] of entries){const tab=document.createElement('button');tab.type='button';tab.textContent=label;tab.dataset.path=path;tab.onclick=()=>select(path);nav.append(tab);
  const link=document.querySelector(`.actions a[href^="${path}"]`);if(link){link.removeAttribute('target');link.removeAttribute('rel');link.textContent=label;link.setAttribute('aria-haspopup','dialog');link.onclick=e=>{e.preventDefault();show(path,link);};}
 }
 dialog.querySelector('.settings-close').onclick=()=>dialog.close();dialog.addEventListener('close',()=>{for(const frame of frames.values())suspend(frame);close();trigger?.focus();});
 return dialog;
}
