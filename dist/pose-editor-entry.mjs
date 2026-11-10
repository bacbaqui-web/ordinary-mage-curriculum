const wanted=new URLSearchParams(location.search).get('character');
if(wanted==='wolf')await import('./wolf-motion-editor.mjs?v=points-1');else await import('./pose-editor.mjs?v=wolf-1');
