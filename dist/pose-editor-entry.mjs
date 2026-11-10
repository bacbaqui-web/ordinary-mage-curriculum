const wanted=new URLSearchParams(location.search).get('character');
if(wanted==='wolf')await import('./wolf-motion-editor.mjs?v=editor-shortcuts-1');else await import('./pose-editor.mjs?v=editor-shortcuts-1');
