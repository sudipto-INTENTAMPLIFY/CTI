(()=>{'use strict';
const ROUTES=new Set(['services','pricing','blog','research','case-studies','vendors','intelligence','contact','thank-you','admin']);
function cleanRoute(value){
  if(!value)return null;
  let raw=String(value).trim();
  // Legacy SPA/hash forms: #/pricing, /services#/pricing, services#/pricing.
  const hashIndex=raw.indexOf('#/');
  if(hashIndex>=0) raw=raw.slice(hashIndex+2);
  else if(raw.startsWith('#/')) raw=raw.slice(2);
  else {
    try {
      const u=new URL(raw,location.href);
      if(u.origin!==location.origin)return null;
      if(u.hash&&u.hash.startsWith('#/')) raw=u.hash.slice(2);
      else raw=u.pathname.replace(/^\/+|\/+$/g,'');
    } catch(_){ return null; }
  }
  raw=raw.split(/[?#]/,1)[0].replace(/^\/+|\/+$/g,'').replace(/\.html$/i,'');
  if(raw===''||raw==='index')return '/';
  return ROUTES.has(raw)?'/'+raw:null;
}
function repairCurrentLocation(){
  if(!location.hash||!location.hash.startsWith('#/'))return false;
  const target=cleanRoute(location.href);
  if(!target)return false;
  const search=location.search||'';
  location.replace(target+search);
  return true;
}
function normalizeInternalLinks(){
  document.querySelectorAll('a[href]').forEach(a=>{
    const href=a.getAttribute('href');
    if(!href||href.startsWith('#')&&!href.startsWith('#/'))return; // preserve in-page anchors.
    const target=cleanRoute(href);
    if(!target)return;
    a.setAttribute('href',target);
    a.dataset.ctiCleanRoute='true';
  });
}
function interceptLegacyNavigation(){
  document.addEventListener('click',e=>{
    const a=e.target&&e.target.closest?e.target.closest('a[href]'):null;
    if(!a)return;
    const href=a.getAttribute('href')||'';
    if(!href.includes('#/')&&!/\.html(?:[?#]|$)/i.test(href))return;
    const target=cleanRoute(href);
    if(!target)return;
    e.preventDefault();
    location.assign(target);
  },true);
}
function boot(){
  if(repairCurrentLocation())return;
  normalizeInternalLinks();
  interceptLegacyNavigation();
  // Handle links injected later by dynamic CMS/runtime without disturbing DOM structure.
  if('MutationObserver'in window){
    const mo=new MutationObserver(()=>normalizeInternalLinks());
    mo.observe(document.documentElement,{subtree:true,childList:true});
  }
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();