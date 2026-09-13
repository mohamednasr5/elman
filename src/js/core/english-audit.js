const ARABIC_RE=/[\u0600-\u06FF]/;
const UI_ALLOWLIST=['html','script','style','title'];
export function findArabicUiLeaks(root=document.body){
  if(document.documentElement.lang!=='en') return [];
  const leaks=[];
  const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
  let node;
  while(node=walker.nextNode()){
    const value=(node.nodeValue||'').trim();
    if(!value||!ARABIC_RE.test(value)) continue;
    const parent=node.parentElement;
    if(!parent||UI_ALLOWLIST.includes(parent.tagName.toLowerCase())) continue;
    leaks.push({text:value.slice(0,120),selector:selectorFor(parent)});
  }
  return leaks;
}
function selectorFor(el){ return el.id?`#${el.id}`:el.className&&typeof el.className==='string'?`.${el.className.trim().split(/\s+/).filter(Boolean).join('.')}`:el.tagName.toLowerCase(); }
export function installEnglishAudit(){
  if(document.documentElement.lang!=='en'||window.__englishUiAuditInstalled) return;
  window.__englishUiAuditInstalled=true;
  const scan=()=>{const leaks=findArabicUiLeaks(); if(leaks.length) console.warn('[English UI Audit] Arabic UI text detected',leaks.slice(0,20));};
  new MutationObserver(()=>queueMicrotask(scan)).observe(document.body,{childList:true,subtree:true,characterData:true});
  setTimeout(scan,0);
}
