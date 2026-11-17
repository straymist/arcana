import { ROLES,DIRECTIONS,DEPTH_SHIFTS,RECORD_KINDS,seed,clone,id,now,activeSession,newIdea,event,dealSix,rerollRow,drawLateralWord,toggleDepthShift,mergeStates,setCardInDeck,toggleDirectionRow } from './data.js';
import { load,save,download,readBackup,KEY } from './storage.js';
import { esc,date,icon,button,modal,field,textarea,toast,playTone,copyText } from './ui.js';
import { cardArt,iconPicker,bindIconPicker } from './card-icons.js';
import { buildGamePrompt } from './prompt.js';
import { spreadView } from './spread.js';
import { cauldronView } from './cauldron.js';
let state,loadError='',conflict=false,order=[],query='',incoming=null;
try{state=load();}catch(e){state=seed();loadError=e.message;}
const root=document.querySelector('#root');
const nav=[['spread','cards','牌陣'],['cauldron','cauldron','水槽']];
function render(){
  const scroll=window.scrollY;
  root.innerHTML=`<div class="app-shell"><header class="site-header"><a class="brand" href="#" data-action="home" aria-label="Arcana 首頁"><span class="brand-symbol">✧</span><span>ARCANA<small>IDEA ALCHEMY</small></span></a><div class="header-meta"><span class="local-status"><i></i><span id="save-status">${loadError?'資料待修復':conflict?'另一分頁有變更':'只在此裝置 · 自動儲存'}</span></span>${button(icon(state.ui.muted?'mute':'volume'),'mute','icon-button',`aria-label="${state.ui.muted?'開啟音效':'關閉音效'}"`)}${button(icon('settings'),'settings','icon-button','aria-label="設定與備份"')}</div></header>
  ${loadError||conflict?`<div class="error-banner" role="alert">${esc(loadError||'另一個分頁已更新資料。請先匯出目前備份，再重新載入，以免互相覆寫。')} ${button('匯出目前備份','export','text-button')} ${button('重新載入','reload','text-button')}</div>`:''}
  <div class="welcome"><div><p class="eyebrow">YOUR QUIET CORNER OF POSSIBILITY</p><h1>留一點未知，<em>讓靈感發生。</em></h1><p>抽一張牌，攪動一個念頭。今天，不必急著有答案。</p></div><div class="moon-note">${icon('moon')}<span>桌上燭火還亮著。<small>隨時離開，也隨時回來。</small></span></div></div>
  <div class="desk-bar"><nav class="workspace-nav" aria-label="煉金工作區">${nav.map(([view,i,label])=>`<button data-action="view" data-id="${view}" class="${state.ui.activeView===view?'selected':''}" aria-current="${state.ui.activeView===view?'page':'false'}">${icon(i)}<span>${label}</span></button>`).join('')}</nav><div class="desk-caption"><span>✦</span> THE ALCHEMIST’S WORKBENCH</div>${button(icon('plus')+' 快記一句','new-idea','quick-button')}</div>
  <main id="workbench" class="workspace focus-${state.ui.activeView}">${spreadView(state)}${cauldronView(state,order,query)}</main>
  <footer class="site-footer"><span>✧ &nbsp; 讓念頭休息，也是創作的一部分。</span><span>ARCANA <i>·</i> A SPACE FOR UNFINISHED THOUGHTS</span></footer></div>`;
  window.scrollTo(0,scroll);
}
document.body.insertAdjacentHTML('beforeend','<dialog id="dialog" aria-label="Arcana 操作視窗"></dialog><div id="toast" role="status" aria-live="polite"></div>');
function commit(fn,{redraw=true}={}){
  if(loadError)throw Error('原始資料讀取失敗。請先在設定匯出原始資料，或匯入有效備份。');
  if(conflict)throw Error('另一分頁已有新資料，請先重新載入。');
  const next=clone(state);fn(next);state=save(next);if(redraw)render();
  const status=document.querySelector('#save-status');if(status)status.textContent='已儲存在此裝置';return true;
}
function go(view){commit(s=>s.ui.activeView=view);if(matchMedia('(max-width: 999px)').matches)document.querySelector('#workbench').scrollIntoView({behavior:'instant',block:'start'});}
function saveButton(text='保存'){return `<button type="submit" class="primary">${icon('check')} ${text}</button>`;}
const findIdea=(key)=>state.ideas.find(x=>x.id===key);
function snapshotView(session){
  if(!session)return '';
  return `<details class="idea-snapshot"><summary>保存時的牌陣</summary><div class="idea-snapshot-content"><small>${date(session.createdAt)}</small>${Object.entries(ROLES).map(([slot,role])=>`<p><b>${slot} · ${role.name}</b><span>${session.snapshot[slot]?cardArt(session.snapshot[slot])+' '+esc(session.snapshot[slot].text):'留白'}<br/><small>${!session.directionsRevealed?'方向牌蓋起':session.directions[slot]?DIRECTIONS[session.directions[slot]].name:'方向留白'}${session.directionsRevealed&&session.directions[slot]==='depth'&&DEPTH_SHIFTS[session.depthShifts[slot]]?' · '+DEPTH_SHIFTS[session.depthShifts[slot]].name:''}${session.directionsRevealed&&session.randomWords[slot]?' · '+esc(session.randomWords[slot]):''}</small></span></p>`).join('')}${session.question?`<p>${esc(session.question)}</p>`:''}</div></details>`;
}
function ideaForm(key=null,origin={type:'manual'},text=''){
  const idea=key?findIdea(key):null;
  const captured=!idea&&origin.type==='session'?clone(state.sessions.find(s=>s.id===origin.id)):null;
  let iconImage=idea?.iconImage||null;
  const initialIcon=idea||{icon:'✦'};
  const sources={manual:'隨手記錄',session:'牌陣發現',idea:'另一個想法',seed:'預設想法','legacy-journal':'舊紀錄','legacy-draft':'未完成的紀錄'};
  const dialog=modal(idea?'照看這個念頭':'放下一個念頭',`
    <p class="record-date">${idea?`記錄日期 <time datetime="${esc(idea.createdAt)}">${date(idea.createdAt)}</time>`:'保存時會自動留下日期'}${idea?.isDraft?' · 未完成草稿':''}</p>
    ${field('一句話','text',idea?.text||text,'required maxlength="240" autofocus placeholder="有一個問題，一直留在腦海…"')}
    ${iconPicker(initialIcon,'想法圖示')}
    ${textarea('細節與發現（可空白）','notes',idea?.notes||'','maxlength="20000"')}
    <label class="field">記錄類型<select name="kind">${Object.entries(RECORD_KINDS).map(([kind,label])=>`<option value="${kind}" ${(idea?.kind||'inspiration')===kind?'selected':''}>${label}</option>`).join('')}</select></label>
    <label class="field">浮力 <output id="priority-output">${Math.round((idea?.priority??.6)*100)}%</output><input name="priority" type="range" min="0" max="100" value="${Math.round((idea?.priority??.6)*100)}"/></label>
    <p class="microcopy">浮力越高，越靠近水面。系統不會自動修改你的選擇。</p>
    <label class="field">狀態<select name="status"><option value="incubating" ${idea?.status!=='resting'?'selected':''}>醞釀中</option><option value="resting" ${idea?.status==='resting'?'selected':''}>休眠中</option></select></label>
    ${snapshotView(idea?.snapshot||captured)}
    ${idea?`<p class="source-note">來源：${esc(sources[idea.origin.type]||'相關記錄')}</p>`:''}
    <div class="dialog-actions">${saveButton(idea?'保存變更':'放入水槽')}${idea?button('撈取到牌陣','idea-spread','secondary',`data-id="${idea.id}"`):''}</div>
    ${idea?`<div class="dialog-subactions">${button('鍛造成素材牌','forge','text-button',`data-id="${idea.id}"`)}</div><p class="microcopy">編輯後請先保存，再使用下方操作。</p>`:''}
  `,(form,dialog)=>{
    const title=String(form.get('text')).trim();if(!title)return toast('留下一句話，再把它放進水槽。');
    order=[];commit(s=>{
      const value=key?s.ideas.find(v=>v.id===key):newIdea(title,origin);
      Object.assign(value,{text:title,icon:String(form.get('icon')).trim()||'✦',notes:String(form.get('notes')),kind:form.get('kind'),priority:Number(form.get('priority'))/100,status:form.get('status'),updatedAt:now()});delete value.isDraft;if(iconImage)value.iconImage=iconImage;else delete value.iconImage;
      if(!key){if(captured){value.snapshot=clone(captured);value.sessionIds=[captured.id];value.cardIds=Object.values(captured.slots).filter(Boolean);value.ideaIds=captured.ideaId?[captured.ideaId]:[];}s.ideas.push(value);}
    });dialog.close();toast('這個念頭與日期已留在水槽。');
  });
  bindIconPicker(dialog,initialIcon,value=>iconImage=value);
}
function library(){
  const search=document.querySelector('#card-search')?.value||'',cards=state.cards.filter(c=>!c.deleted),deck=state.decks.find(d=>d.id==='main');
  modal('素材牌庫',`<p class="muted">共 ${cards.length} 張素材，${cards.filter(c=>deck.cardIds.includes(c.id)).length} 張參與抽牌。不抽取的素材仍可編輯、手動放入牌陣。</p>${button(icon('plus')+' 新增素材牌','new-card','primary')}<label class="search-field">${icon('search')}<input id="card-search" type="search" value="${esc(search)}" placeholder="搜尋素材或標籤" aria-label="搜尋素材牌"/></label><div class="library-list">${cards.map(c=>{const included=deck.cardIds.includes(c.id);return `<article class="library-item" ${(c.text+' '+c.tags.join(' ')).toLowerCase().includes(search.toLowerCase())?'':'hidden'} data-search="${esc(c.text+' '+c.tags.join(' '))}"><button type="button" class="library-card" data-action="edit-card" data-id="${c.id}"><span>${cardArt(c)}</span><b>${esc(c.text)}</b><small>${esc(c.tags.join(' · '))||'自由素材'} ↗</small></button><button type="button" class="deck-toggle ${included?'included':''}" data-action="toggle-card-deck" data-id="${c.id}" aria-pressed="${included}" aria-label="${included?'移出牌堆':'放入牌堆'}：${esc(c.text)}"><span>${included?'✦ 抽牌中':'○ 不抽取'}</span><small>${included?'移出牌堆':'放入牌堆'}</small></button></article>`;}).join('')}</div>`);
}
function cardForm(key=null,origin={type:'manual'},text='',sourceIcon=null){
  const c=state.cards.find(c=>c.id===key),included=!c||state.decks.find(d=>d.id==='main').cardIds.includes(c.id);
  const initialIcon=c||sourceIcon;
  let iconImage=initialIcon?.iconImage||null;
  const dialog=modal(c?'雕琢這張素材':'鍛造一張素材',`${field('一句話','text',c?.text||text,'required maxlength="240" autofocus')}${iconPicker(initialIcon,'素材圖示')}${field('標籤（以逗號分隔）','tags',c?.tags.join(', ')||'','maxlength="800"')}<label class="deck-checkbox"><input type="checkbox" name="inDeck" ${included?'checked':''}/><span>放入牌堆，參與隨機抽牌<small>關閉後仍保留在素材牌庫。</small></span></label><label class="field">保存後放到牌陣<select name="slot"><option value="">先留在素材牌庫</option>${Object.entries(ROLES).map(([k,r])=>`<option value="${k}">${k} · ${r.name}</option>`).join('')}</select></label><p class="source-note">來源：${esc((c?.origin||origin).type)}${(c?.origin||origin).id?' · '+esc((c?.origin||origin).id):''}</p><div class="dialog-actions">${saveButton()}${c?button('刪除素材牌','delete-card','danger',`data-id="${key}"`):''}</div>`,(f,d)=>{
    const t=String(f.get('text')).trim();if(!t)return toast('素材需要一句話。');
    const slot=f.get('slot'),inDeck=f.has('inDeck');
    commit(s=>{
      const card=key?s.cards.find(x=>x.id===key):{id:id('card'),origin};
      Object.assign(card,{text:t,icon:String(f.get('icon')).trim()||'✧',tags:String(f.get('tags')).split(/[,，]/).map(t=>t.trim()).filter(Boolean)});
      if(iconImage)card.iconImage=iconImage;else delete card.iconImage;
      if(!key)s.cards.push(card);setCardInDeck(s,card.id,inDeck);
      if(slot){const session=activeSession(s);event(session,'assign',{slot,previousCard:session.snapshot[slot],cardId:card.id});session.slots[slot]=card.id;session.snapshot[slot]=clone(card);s.ui.activeView='spread';}
    });d.close();toast(slot?'素材已放入牌陣。':inDeck?'素材已保存，現在可從主牌堆抽到。':'素材已留在牌庫，暫不參與抽牌。');
  });
  bindIconPicker(dialog,initialIcon,value=>iconImage=value);
}
function slotDialog(slot){const c=activeSession(state).snapshot[slot];if(!c)return;modal(`${slot} · ${ROLES[slot].name}`,`<div class="detail-card"><span>${cardArt(c)}</span><h3>${esc(c.text)}</h3><p>${ROLES[slot].question}</p></div><p class="muted">這張牌此刻扮演「${ROLES[slot].name}」。你會怎麼解讀？同樣的素材，換一個位置可能就改變了意思。</p><div class="dialog-actions">${button('只重抽這張','reroll','primary',`data-slot="${slot}"`)}${button('查看素材','edit-card','secondary',`data-id="${c.id}"`)}</div><div class="dialog-subactions">${Object.entries(ROLES).filter(([k])=>k!==slot).map(([k,r])=>button(`與 ${k} · ${r.name} 交換`,'swap-slot','text-button',`data-from="${slot}" data-to="${k}"`)).join('')}</div>`);}
function swapSlots(from,to){if(!Object.hasOwn(ROLES,from)||!Object.hasOwn(ROLES,to)||from===to)return;commit(s=>{const v=activeSession(s);[v.slots[from],v.slots[to]]=[v.slots[to],v.slots[from]];[v.snapshot[from],v.snapshot[to]]=[v.snapshot[to],v.snapshot[from]];event(v,'swap',{from,to});});toast('素材換了位置，也換了一個問題。');}
function settings(){
  modal('照顧你的工作桌',`<p class="muted">沒有帳號，沒有雲端。這張桌子的內容，保存在此瀏覽器的 localStorage。</p><div class="settings-stats"><span><b>${state.ideas.length}</b> 想法</span><span><b>${state.cards.filter(c=>!c.deleted).length}</b> 素材</span><span><b>${state.sessions.length}</b> 牌局</span></div><div class="settings-buttons">${button(icon('download')+' 匯出 JSON 備份','export','primary')}<label class="file-button secondary">匯入 JSON 備份<input type="file" accept=".json,application/json" id="import-file"/></label>${loadError?button('下載無法讀取的原始資料','export-raw'):''}</div><p class="source-note">不同網址、不同裝置與無痕模式不共享資料。清除網站資料也會移除這張桌子，請定期匯出備份。已載入後可離線操作；離線重新開頁尚未支援。</p><div class="settings-bottom">${button('清空本機資料','reset','danger')}<span>版本 1.2 · Schema 3</span></div>`);
}
function confirmReset(){modal('清空這張工作桌？',`<p>這會移除所有想法、素材牌與牌局，回到預設桌面。此操作無法復原，請先匯出備份。</p><div class="dialog-actions">${button('先匯出備份','export','secondary')}${saveButton('確認清空並重設')}</div>`,(_,d)=>{const next=seed();next.revision=state.revision;state=save(next);loadError='';conflict=false;order=[];query='';d.close();render();toast('已重設為預設桌面。');});}
function importConfirm(){modal('還原這份備份',`<p>已檢查 Schema 與來源關聯。備份包含 ${incoming.ideas.length} 個想法、${incoming.cards.length} 張素材、${incoming.sessions.length} 次牌局。</p><label class="field">還原方式<select name="mode"><option value="merge">合併 · 保留雙方全部資料（匯入項目使用新 ID）</option><option value="replace">覆蓋 · 完整取代目前資料</option></select></label><p class="source-note">合併不會自動去除相似想法；覆蓋會移除目前資料。建議先匯出現在的桌面。</p><div class="dialog-actions">${button('先匯出目前備份','export','secondary')}${saveButton('確認匯入')}</div>`,(f,d)=>{const next=f.get('mode')==='merge'?mergeStates(state,incoming):clone(incoming);next.revision=state.revision;state=save(next);loadError='';conflict=false;incoming=null;order=[];query='';d.close();render();toast('備份已還原。');});}
const actions={
  home:()=>go('spread'),view:b=>go(b.dataset.id),reload:()=>location.reload(),
  mute:()=>{commit(s=>s.ui.muted=!s.ui.muted);playTone(state.ui.muted);},settings,export:()=>{download(state);toast('JSON 備份已下載。');},
  'export-raw':()=>{const blob=new Blob([localStorage.getItem(KEY)||''],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='arcana-recovery.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);},reset:confirmReset,
  draw:()=>{commit(s=>dealSix(s));document.querySelector('.six-card-spread').classList.add('dealing');playTone(state.ui.muted);toast(activeSession(state).directionsRevealed?'三張素材與方向已重抽。':'素材已重抽，方向牌保持蓋起。');},
  'toggle-directions':()=>{commit(s=>toggleDirectionRow(s));document.querySelector('.direction-row').classList.add('dealing');playTone(state.ui.muted);toast(activeSession(state).directionsRevealed?'星光亮起，新的方向已揭開。':'方向牌已蓋回。');},
  'reroll-row':b=>{const row=b.dataset.row;commit(s=>rerollRow(s,row));document.querySelector(`.spread-row[data-row="${row}"] .slots`).classList.add('dealing');playTone(state.ui.muted);toast(row==='gom'?'上排素材已重抽，下排保持不動。':'下排方向已重抽，上排保持不動。');},
  slot:b=>slotDialog(b.dataset.slot),
  'swap-slot':b=>{swapSlots(b.dataset.from,b.dataset.to);document.querySelector('#dialog').close();},
  reroll:b=>{const slot=b.dataset.slot;commit(s=>{const session=activeSession(s),used=Object.values(session.slots),deck=s.decks.find(d=>d.id==='main'),cards=s.cards.filter(c=>!c.deleted&&deck.cardIds.includes(c.id)&&!used.includes(c.id));if(!cards.length)throw Error('需要更多素材牌，才能換一張不同的牌。');const c=cards[Math.floor(Math.random()*cards.length)];event(session,'reroll',{slot,previousCard:clone(session.snapshot[slot]),cardId:c.id});session.slots[slot]=c.id;session.snapshot[slot]=clone(c);});document.querySelector('#dialog').close();playTone(state.ui.muted);},
  'session-idea':()=>ideaForm(null,{type:'session',id:activeSession(state).id}),
  'copy-prompt':async()=>{const text=buildGamePrompt(state);if(await copyText(text))return toast('解牌提示已複製，可貼給其他 AI。');modal('複製解牌提示',`${textarea('可直接貼給其他 AI 的題目','prompt',text,'readonly id="prompt-copy-text"')}<p class="microcopy">瀏覽器未允許自動複製。全選後用複製選單或 Ctrl／⌘ + C。</p>${button('全選文字','select-prompt','primary')}`);},
  'select-prompt':()=>{const input=document.querySelector('#prompt-copy-text');input.focus();input.select();input.setSelectionRange(0,input.value.length);},
  library,'toggle-card-deck':b=>{const key=b.dataset.id;commit(s=>setCardInDeck(s,key,!s.decks.find(d=>d.id==='main').cardIds.includes(key)));const scroll=document.querySelector('#dialog').scrollTop;library();document.querySelector('#dialog').scrollTop=scroll;document.querySelector('#dialog [data-action=toggle-card-deck][data-id="'+key+'"]')?.focus({preventScroll:true});},'new-card':()=>cardForm(),'edit-card':b=>cardForm(b.dataset.id),
  'delete-card':b=>{if(state.decks.find(d=>d.id==='main').cardIds.includes(b.dataset.id)&&state.cards.filter(c=>!c.deleted&&state.decks.find(d=>d.id==='main').cardIds.includes(c.id)).length<=3)return toast('抽牌堆至少需要三張素材，請先加入其他牌。');modal('刪除這張素材？','<p>這張牌將離開可抽取的牌堆；已保存的牌局快照仍會保留。</p>'+saveButton('確認刪除'),(_,d)=>{commit(s=>{s.cards.find(c=>c.id===b.dataset.id).deleted=true;s.decks.forEach(deck=>deck.cardIds=deck.cardIds.filter(x=>x!==b.dataset.id));});d.close();toast('素材已移出牌堆，歷史仍保留。');});},
  'new-idea':()=>ideaForm(),idea:b=>ideaForm(b.dataset.id),
  forge:b=>{const idea=findIdea(b.dataset.id);cardForm(null,{type:'idea',id:idea.id},idea.text,idea);},
  'idea-spread':b=>{commit(s=>{const v=activeSession(s);v.ideaId=b.dataset.id;v.question=s.ideas.find(x=>x.id===b.dataset.id).text;event(v,'idea',{ideaId:b.dataset.id});s.ui.activeView='spread';});document.querySelector('#dialog').close();toast('想法已撈起。帶著這個問題來抽牌。');},
  stir:()=>{const ids=(order.length?order:state.ideas.slice().sort((a,b)=>b.priority-a.priority).map(i=>i.id)).filter(id=>findIdea(id));if(ids.length>1){const offset=1+Math.floor(Math.random()*(ids.length-1));order=ids.slice(offset).concat(ids.slice(0,offset));}render();document.querySelector('.vessel').classList.add('stirring');playTone(state.ui.muted);toast('舊念頭重新浮現。浮力沒有改變。');},
  'lateral-word':b=>{const slot=b.dataset.slot;commit(s=>drawLateralWord(activeSession(s),slot));document.querySelector(`.crystal-icon[data-slot="${slot}"]`).classList.add('awakening');playTone(state.ui.muted);},
  'depth-toggle':b=>{commit(s=>toggleDepthShift(activeSession(s),b.dataset.slot));playTone(state.ui.muted);},
};
document.addEventListener('click',async e=>{const b=e.target.closest('[data-action]');if(!b)return;e.preventDefault();try{await actions[b.dataset.action]?.(b);}catch(err){toast(err.message);}});
document.addEventListener('dragstart',e=>{const card=e.target.closest('.material-card.filled');if(card){e.dataTransfer.setData('application/x-arcana-slot',card.dataset.slot);e.dataTransfer.effectAllowed='move';}});
document.addEventListener('dragover',e=>{if(e.target.closest('.material-card')&&e.dataTransfer.types.includes('application/x-arcana-slot')){e.preventDefault();e.dataTransfer.dropEffect='move';}});
document.addEventListener('drop',e=>{const card=e.target.closest('.material-card');if(!card)return;const from=e.dataTransfer.getData('application/x-arcana-slot');if(!from)return;e.preventDefault();try{swapSlots(from,card.dataset.slot);}catch(err){toast(err.message);}});
document.addEventListener('input',e=>{
  try{
    if(e.target.id==='session-question')commit(s=>activeSession(s).question=e.target.value,{redraw:false});
    if(e.target.name==='priority')document.querySelector('#priority-output').textContent=e.target.value+'%';
    if(e.target.id==='card-search'){const q=e.target.value.toLowerCase();document.querySelectorAll('.library-item').forEach(c=>c.hidden=!c.dataset.search.toLowerCase().includes(q));}
    if(e.target.id==='idea-search'){query=e.target.value;const fresh=document.createElement('div');fresh.innerHTML=cauldronView(state,order,query);document.querySelector('.idea-list').innerHTML=fresh.querySelector('.idea-list').innerHTML;}
  }catch(err){toast(err.message);}
});
document.addEventListener('change',async e=>{try{if(e.target.id==='idea-sort')commit(s=>s.ui.ideaSort=e.target.value);if(e.target.id==='import-file'){incoming=await readBackup(e.target.files[0]);importConfirm();}}catch(err){toast(err.message);if(e.target.id==='import-file')e.target.value='';}});
// Form submit handlers are direct callbacks: surface failed storage instead of losing a draft.
window.addEventListener('error',e=>{if(e.error){console.error(e.error);toast(e.error.message);}});
window.addEventListener('storage',e=>{if(e.key===KEY&&e.newValue!==JSON.stringify(state)){conflict=true;render();}});
render();
if(!loadError){try{state=save(state);}catch(e){toast(e.message);}}
