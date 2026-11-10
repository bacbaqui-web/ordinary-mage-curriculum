const paths={
 sound:'<path d="M11 5 6 9H3v6h3l5 4V5Z"/><path d="M15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>',
 muted:'<path d="M11 5 6 9H3v6h3l5 4V5Z"/><path d="m16 9 6 6m0-6-6 6"/>',
 hitbox:'<path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/><rect x="7" y="7" width="10" height="10" rx="1" stroke-dasharray="2 2"/>',
 pause:'<path d="M8 5v14M16 5v14" stroke-width="3"/>',
 play:'<path d="m8 4 12 8-12 8V4Z"/>',
 restart:'<path d="M20 7v5h-5M20 12a8 8 0 1 0-2 5"/>'
};
export function toolbarIcon(button,icon,label){button.innerHTML=`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[icon]}</svg>`;button.title=label;button.setAttribute('aria-label',label);}
