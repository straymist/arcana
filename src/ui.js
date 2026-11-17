export const esc=(v='')=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const date=(v)=>new Intl.DateTimeFormat('zh-TW',{year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(v));
export function icon(name,cls=''){
  const paths={cards:'<rect x="5" y="3" width="13" height="18" rx="2"/><path d="M2 7v12a3 3 0 0 0 3 3m5-14 3 4-3 4-3-4Z"/>',cauldron:'<path d="M4 8h16l-1 9a4 4 0 0 1-4 3H9a4 4 0 0 1-4-3L4 8Zm1-3h14M8 20l-1 2m9-2 1 2M9 2l1 2m5-3-1 3"/>',orb:'<circle cx="12" cy="10" r="7"/><path d="M7 21h10m-8-4-2 4m8-4 2 4M8 8a4 4 0 0 1 4-2"/>',book:'<path d="M12 5C8 2 4 3 2 4v15c4-2 7-1 10 1 3-2 6-3 10-1V4c-2-1-6-2-10 1Zm0 0v15M5 8h4m-4 4h4m6-4h4m-4 4h4"/>',spark:'<path d="m12 2 2.7 7.3L22 12l-7.3 2.7L12 22l-2.7-7.3L2 12l7.3-2.7L12 2Z"/>',plus:'<path d="M12 5v14M5 12h14"/>',settings:'<circle cx="12" cy="12" r="3"/><path d="m9 3-1 3-3 1-2 3 2 2-1 4 3 1 2 4h4l1-3 4-1 2-3-2-3 1-3-3-1-2-4Z"/>',arrow:'<path d="M4 12h16m-6-6 6 6-6 6"/>',shuffle:'<path d="m3 5 4 0 10 14h4M3 19h4L17 5h4m-3-3 3 3-3 3m0 8 3 3-3 3"/>',close:'<path d="m6 6 12 12M6 18 18 6"/>',search:'<circle cx="10" cy="10" r="6"/><path d="m15 15 6 6"/>',moon:'<path d="M20 15A9 9 0 0 1 9 4a9 9 0 1 0 11 11Z"/>',volume:'<path d="M3 9h4l5-4v14l-5-4H3V9Zm13-2a7 7 0 0 1 0 10m3-13a11 11 0 0 1 0 16"/>',mute:'<path d="M3 9h4l5-4v14l-5-4H3V9Zm13 0 5 6m0-6-5 6"/>',check:'<path d="m5 12 4 4L19 6"/>',download:'<path d="M12 3v12m-5-5 5 5 5-5M4 17v4h16v-4"/>'};
  return `<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]||paths.spark}</svg>`;
}
export const button=(label,action,cls='secondary',attrs='')=>`<button type="button" class="${cls}" data-action="${action}" ${attrs}>${label}</button>`;
export function toast(message){const el=document.querySelector('#toast');el.textContent=message;el.classList.add('show');const dialog=document.querySelector('#dialog');if(dialog?.open){let notice=dialog.querySelector('.dialog-notice');if(!notice){notice=document.createElement('p');notice.className='dialog-notice';notice.setAttribute('role','status');dialog.querySelector('header').after(notice);}notice.textContent=message;notice.scrollIntoView({block:'nearest',behavior:'instant'});}clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove('show'),3500);}
export function modal(title,body,onSubmit){
  const dialog=document.querySelector('#dialog');dialog.innerHTML=`<form method="dialog" class="dialog-inner"><header><h2>${esc(title)}</h2><button type="button" class="icon-button" data-close aria-label="關閉">${icon('close')}</button></header>${body}</form>`;
  dialog.querySelector('[data-close]').onclick=()=>dialog.close();
  dialog.querySelector('form').onsubmit=e=>{e.preventDefault();try{if(onSubmit)onSubmit(new FormData(e.currentTarget),dialog);else dialog.close();}catch(err){toast(err.message);}};
  dialog.onclick=e=>{if(e.target===dialog)dialog.close();};
  if(!dialog.open)dialog.showModal();
  dialog.querySelector('[autofocus]')?.focus();return dialog;
}
export const field=(label,name,value='',extra='')=>`<label class="field">${esc(label)}<input name="${name}" value="${esc(value)}" ${extra}/></label>`;
export const textarea=(label,name,value='',extra='')=>`<label class="field">${esc(label)}<textarea name="${name}" rows="4" ${extra}>${esc(value)}</textarea></label>`;
export async function copyText(text){
  try{if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(text);return true;}}catch{/* Continue to the local-file fallback. */}
  const input=document.createElement('textarea'),previous=document.activeElement;input.value=text;input.readOnly=true;input.style.cssText='position:fixed;top:0;left:0;width:1px;height:1px;opacity:0;font-size:16px';document.body.append(input);input.focus();input.select();input.setSelectionRange(0,text.length);
  let copied=false;try{copied=document.execCommand('copy');}catch{/* Manual copy remains available. */}input.remove();previous?.focus?.({preventScroll:true});return copied;
}
export function playTone(muted){if(muted)return;try{const AC=window.AudioContext||window.webkitAudioContext;const ctx=playTone.ctx||(playTone.ctx=new AC());ctx.resume();const o=ctx.createOscillator(),g=ctx.createGain();o.type='sine';o.frequency.setValueAtTime(440,ctx.currentTime);o.frequency.exponentialRampToValueAtTime(880,ctx.currentTime+.18);g.gain.setValueAtTime(.035,ctx.currentTime);g.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+.4);o.connect(g);g.connect(ctx.destination);o.start();o.stop(ctx.currentTime+.4);}catch{/* Audio is optional; interactions remain available. */}}
