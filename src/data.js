import { WORD_BANK } from './words.js';
import { defaultCards } from './materials.js';
/** @typedef {{type:string,id?:string}} Origin */
/** @typedef {{id:string,icon:string,text:string,tags:string[],origin:Origin,iconImage?:string,deleted?:boolean}} Card */
/** @typedef {{id:string,icon:string,text:string,notes:string,priority:number,status:'incubating'|'resting',origin:Origin,createdAt:string,updatedAt:string,iconImage?:string,kind:'inspiration'|'observation'|'review',ideaIds:string[],cardIds:string[],sessionIds:string[],snapshot:Session|null,isDraft?:boolean}} Idea */
/** @typedef {'G'|'O'|'M'} Slot */
/** @typedef {{id:string,spreadId:string,slots:Record<Slot,string|null>,snapshot:Record<Slot,Card|null>,directions:Record<Slot,string|null>,directionsRevealed:boolean,randomWords:Record<Slot,string|null>,depthShifts:Record<Slot,'up'|'down'|null>,ideaId:string|null,question:string,status:string,createdAt:string,events:object[]}} Session */
export const ROLES = {G:{name:'目標',en:'GOAL',question:'想達成什麼？',symbol:'◎'},O:{name:'阻礙',en:'OBSTACLE',question:'什麼擋在面前？',symbol:'⟁'},M:{name:'機制',en:'MECHANISM',question:'如何改變局面？',symbol:'✳'}};
export const RECORD_KINDS={inspiration:'靈感 / 設計推測',observation:'實際試玩觀察',review:'RES 回顧'};
export const DEPTH_SHIFTS={up:{name:'上升',icon:'↑',prompt:'放大尺度，提升一層抽象。'},down:{name:'下降',icon:'↓',prompt:'縮小尺度，深入內部結構。'}};
export const DIRECTIONS = {
  inversion:{name:'逆向',en:'INVERSION',icon:'⇄',prompt:'逆向',detail:'沿著現有極性軸，探索另一端。目標明確 ↔ 迷霧探索；日常小事 ↔ 宏大史詩。阻礙強度與失敗代價，也可以反過來。'},
  lateral:{name:'側向',en:'LATERAL',icon:'⤴',prompt:'借一個不相干的詞，打開側門。',detail:'點水晶球引入陌生材料。它的形狀、動作或關係，能如何碰撞現在的牌陣？不必急著合理化。'},
  depth:{name:'深度變換',en:'DEPTH SHIFT',icon:'⊙',prompt:'深度變換',detail:'放大十倍、縮小十倍、升一個抽象層次，或深入內部結構。如果這不是一座城市，而是一個房間呢？'},
  blank:{name:'空牌',en:'NO CHANGE',icon:'○',prompt:'不做變換，沿用原本解讀。',detail:'保留這一欄原本的目標、阻礙或機制，不施加方向變換。'}
};
export const WORDS=WORD_BANK;
export const now=()=>new Date().toISOString();
export const id=(prefix)=>`${prefix}-${globalThis.crypto?.randomUUID?.() || `${Date.now().toString(36)}-${Array.from(globalThis.crypto.getRandomValues(new Uint32Array(3)),n=>n.toString(36)).join('')}`}`;
export const clone=(x)=>JSON.parse(JSON.stringify(x));
export function emptySession(){return {id:id('session'),spreadId:'gom',slots:{G:null,O:null,M:null},snapshot:{G:null,O:null,M:null},directions:{G:null,O:null,M:null},directionsRevealed:false,randomWords:{G:null,O:null,M:null},depthShifts:{G:null,O:null,M:null},ideaId:null,question:'',status:'active',createdAt:now(),events:[]};}
export function seed(){
  const cards=defaultCards();
  const session=emptySession();
  const ideas=[{...newIdea('如果城市會像森林一樣生長？',{type:'seed'},'🌱'),id:'idea-seed-1',notes:'建築不只是被建造，也可能需要被照顧。',priority:.8},{...newIdea('把未知留給明天的自己',{type:'seed'},'🕯'),id:'idea-seed-2',notes:'有些問題不需要今天解完。',priority:.35,status:'resting'}];
  return {schemaVersion:3,catalogVersion:3,revision:0,cards,ideas,decks:[{id:'main',name:'素材牌堆',cardIds:cards.map(c=>c.id)}],spreadTemplates:[{id:'gom',slots:clone(ROLES)}],sessions:[session],orb:{word:null,kept:false,history:[]},ui:{activeView:'spread',activeSessionId:session.id,muted:true,ideaSort:'priority'}};
}
export function activeSession(s){return s.sessions.find(x=>x.id===s.ui.activeSessionId);}
export function event(session,type,detail={}){session.events.push({type,at:now(),...detail});}
export function newIdea(text,origin={type:'manual'},icon='✦'){return {id:id('idea'),icon,text:text.trim(),notes:'',priority:.6,status:'incubating',origin,createdAt:now(),updatedAt:now(),kind:'inspiration',ideaIds:[],cardIds:[],sessionIds:[],snapshot:null};}
export function setCardInDeck(state,cardId,enabled){
  const card=state.cards.find(card=>card.id===cardId),deck=state.decks.find(deck=>deck.id==='main');
  if(!card||card.deleted||!deck)throw Error('找不到可使用的素材牌。');
  const included=deck.cardIds.includes(cardId);
  if(!enabled&&included&&state.cards.filter(card=>!card.deleted&&deck.cardIds.includes(card.id)).length<=3)throw Error('抽牌堆至少需要三張素材，請先加入其他牌。');
  if(enabled&&!included)deck.cardIds.push(cardId);
  if(!enabled)deck.cardIds=deck.cardIds.filter(id=>id!==cardId);
}
export function drawDirection(current=null,random=Math.random){
  const choices=Object.keys(DIRECTIONS).filter(key=>key!==current);
  return choices[Math.floor(random()*choices.length)];
}
export function drawIds(cards,old=[],count=3,random=Math.random){
  if(cards.length<count)throw Error(`至少需要 ${count} 張素材牌。`);
  const pool=[...cards];for(let i=pool.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]];}
  const result=pool.slice(0,count).map(x=>x.id);
  if(result.every((v,i)=>v===old[i]))[result[0],result[1]]=[result[1],result[0]];
  return result;
}
export function dealSix(state,random=Math.random){
  const old=activeSession(state),deck=state.decks.find(d=>d.id==='main');
  const cards=state.cards.filter(c=>deck.cardIds.includes(c.id)&&!c.deleted);
  const cardIds=drawIds(cards,Object.values(old.slots),3,random);
  const next=emptySession();
  Object.assign(next,{ideaId:old.ideaId,question:old.question});
  Object.keys(ROLES).forEach((slot,i)=>{next.slots[slot]=cardIds[i];next.snapshot[slot]=clone(cards.find(c=>c.id===cardIds[i]));next.directions[slot]=drawDirection(old.directions[slot],random);});
  next.directionsRevealed=old.directionsRevealed;
  event(next,'draw',{cardIds,directions:clone(next.directions)});
  Object.keys(ROLES).forEach(slot=>{if(next.directions[slot]==='lateral')drawLateralWord(next,slot,random);if(next.directions[slot]==='depth'){next.depthShifts[slot]=random()<.5?'up':'down';event(next,'depth-shift',{slot,shift:next.depthShifts[slot]});}});
  old.status='archived';state.sessions.push(next);state.ui.activeSessionId=next.id;
  return next;
}
export function rerollDirection(session,slot,random=Math.random){
  if(!Object.hasOwn(ROLES,slot))throw Error('未知的方向牌位。');
  const previousDirection=session.directions[slot],previousWord=session.randomWords[slot],previousDepth=session.depthShifts[slot];
  session.directions[slot]=drawDirection(previousDirection,random);session.randomWords[slot]=null;session.depthShifts[slot]=null;
  event(session,'direction-reroll',{slot,previousDirection,previousWord,previousDepth,direction:session.directions[slot]});
  if(session.directions[slot]==='lateral')drawLateralWord(session,slot,random);
  if(session.directions[slot]==='depth'){session.depthShifts[slot]=random()<.5?'up':'down';event(session,'depth-shift',{slot,shift:session.depthShifts[slot]});}
}
export function toggleDepthShift(session,slot){
  if(!Object.hasOwn(ROLES,slot)||session.directions[slot]!=='depth')throw Error('請點深度變換牌上的方向箭頭。');
  session.depthShifts[slot]=session.depthShifts[slot]==='up'?'down':'up';event(session,'depth-shift',{slot,shift:session.depthShifts[slot]});
}
export function drawLateralWord(session,slot,random=Math.random){
  if(!Object.hasOwn(ROLES,slot)||session.directions[slot]!=='lateral')throw Error('請點側向牌上的水晶球。');
  const pool=WORDS.filter(word=>word!==session.randomWords[slot]);
  session.randomWords[slot]=pool[Math.floor(random()*pool.length)];
  event(session,'word',{slot,word:session.randomWords[slot]});
}
export function rerollRow(state,row,random=Math.random){
  if(!['gom','directions'].includes(row))throw Error('未知的牌列。');
  const session=activeSession(state);
  if(row==='gom'){
    const deck=state.decks.find(d=>d.id==='main'),cards=state.cards.filter(c=>deck.cardIds.includes(c.id)&&!c.deleted);
    const cardIds=drawIds(cards,Object.values(session.slots),3,random),previousSnapshot=clone(session.snapshot);
    Object.keys(ROLES).forEach((slot,i)=>{session.slots[slot]=cardIds[i];session.snapshot[slot]=clone(cards.find(c=>c.id===cardIds[i]));});
    event(session,'row-reroll',{row,cardIds,previousSnapshot});
  }else{
    Object.keys(ROLES).forEach(slot=>rerollDirection(session,slot,random));
    event(session,'row-reroll',{row,directions:clone(session.directions)});
  }
}
export function toggleDirectionRow(state,random=Math.random){
  const session=activeSession(state),revealed=!session.directionsRevealed;
  if(revealed)rerollRow(state,'directions',random);
  session.directionsRevealed=revealed;
  event(session,'direction-visibility',{revealed});
}
const assert=(ok,path)=>{if(!ok)throw Error(`備份格式不正確：${path}`);};
/** Schema 1's shared direction applies to every role; schema 2 stores each role independently. */
export function migrate(raw){
  assert(raw&&typeof raw==='object'&&!Array.isArray(raw),'根物件');
  assert([1,2,3].includes(raw.schemaVersion),'不支援的 schemaVersion（支援 1、2、3）');
  if(raw.schemaVersion===1){
    const upgrade=session=>{if(!session||typeof session!=='object')return;session.directions={G:session.direction,O:session.direction,M:session.direction};session.randomWords={G:session.randomWord,O:session.randomWord,M:session.randomWord};delete session.direction;delete session.randomWord;};
    if(Array.isArray(raw.sessions))raw.sessions.forEach(upgrade);
    if(Array.isArray(raw.journal))raw.journal.forEach(entry=>upgrade(entry?.snapshot));
    upgrade(raw.ui?.journalDraft?.session);raw.schemaVersion=2;
  }
  if(raw.schemaVersion===2){
    assert(Array.isArray(raw.ideas)&&Array.isArray(raw.journal),'舊版 ideas / journal');
    const journalIds=new Map(raw.journal.map(entry=>[entry.id,id('idea')]));
    raw.ideas.forEach(idea=>{idea.kind??='inspiration';idea.ideaIds??=[];idea.cardIds??=[];idea.sessionIds??=[];idea.snapshot??=null;});
    for(const entry of raw.journal){
      assert(typeof entry.title==='string'&&typeof entry.text==='string','舊紀錄標題與文字');
      const idea=newIdea(entry.title.trim()||'未命名紀錄',{type:'legacy-journal',journalId:entry.id},'📜');
      Object.assign(idea,{id:journalIds.get(entry.id),notes:entry.text,kind:entry.kind,createdAt:entry.createdAt,updatedAt:entry.createdAt,priority:.5,status:'resting',ideaIds:clone(entry.ideaIds),cardIds:clone(entry.cardIds),sessionIds:clone(entry.sessionIds),snapshot:clone(entry.snapshot)});
      raw.ideas.push(idea);
    }
    const draft=raw.ui?.journalDraft;
    if(draft){
      assert(typeof draft.title==='string'&&typeof draft.text==='string','舊草稿標題與文字');
      const snapshot=clone(draft.session),idea=newIdea(draft.title.trim()||'未完成的想法',{type:'legacy-draft'},'✎');
      Object.assign(idea,{notes:draft.text,kind:draft.kind,isDraft:true,priority:.5,status:'resting',ideaIds:clone(draft.ideaIds),cardIds:snapshot?Object.values(snapshot.slots).filter(Boolean):[],sessionIds:snapshot?[snapshot.id]:[],snapshot});raw.ideas.push(idea);
      delete raw.ui.journalDraft;
    }
    for(const entity of [...raw.ideas,...(raw.cards||[])])if(entity.origin?.type==='journal'){
      assert(journalIds.has(entity.origin.id),'舊日誌來源遺失');entity.origin={...entity.origin,type:'idea',legacyJournalId:entity.origin.id,id:journalIds.get(entity.origin.id)};
    }
    delete raw.journal;raw.schemaVersion=3;
  }
  if(raw.ui?.activeView==='journal')raw.ui.activeView='cauldron';
  if(raw.ui?.activeView==='orb')raw.ui.activeView='spread';
  if(raw.ui&&typeof raw.ui==='object')raw.ui.ideaSort??='priority';
  const depthDefaults=session=>{if(session&&typeof session==='object'){session.depthShifts??={G:null,O:null,M:null};session.directionsRevealed??=false;}};
  if(Array.isArray(raw.sessions))raw.sessions.forEach(depthDefaults);
  if(Array.isArray(raw.ideas))raw.ideas.forEach(idea=>depthDefaults(idea?.snapshot));
  if(raw.catalogVersion===undefined||raw.catalogVersion===1||raw.catalogVersion===2){
    const deck=Array.isArray(raw.decks)?raw.decks.find(deck=>deck.id==='main'):null;
    if(Array.isArray(raw.cards)&&deck&&Array.isArray(deck.cardIds)){
      const existing=new Set(raw.cards.map(card=>card.id));
      for(const card of defaultCards().slice(raw.catalogVersion===2?52:18))if(!existing.has(card.id)){raw.cards.push(card);deck.cardIds.push(card.id);}
      raw.catalogVersion=3;
    }
  }
  return raw;
}
export function validate(raw){
  const s=migrate(clone(raw));
  const str=(v,p,max=20000)=>assert(typeof v==='string'&&v.length<=max,p);
  const list=(v,p)=>assert(Array.isArray(v)&&v.length<=20000,p);
  const origin=(v,p)=>{assert(v&&typeof v==='object',p);str(v.type,p+'.type',80);if(v.id!==undefined)str(v.id,p+'.id',150);};
  const timestamp=(v,p)=>assert(typeof v==='string'&&Number.isFinite(Date.parse(v)),p);
  const unique=(rows,p)=>{list(rows,p);const ids=new Set();rows.forEach(v=>{assert(v&&typeof v==='object',p);str(v.id,p+'.id',150);assert(/^[a-zA-Z0-9_-]+$/.test(v.id)&&!ids.has(v.id),p+' ID 無效或重複');ids.add(v.id);});return ids;};
  const imageIcon=(v,p)=>{if(v.iconImage!==undefined){str(v.iconImage,p+'.iconImage',150000);assert(/^data:image\/png;base64,iVBORw0KGgo[A-Za-z0-9+/]*={0,2}$/.test(v.iconImage),p+'.iconImage 只接受內嵌 PNG');}};
  const card=(v,p)=>{str(v.text,p+'.text',240);assert(v.text.trim(),p+'.text 空白');str(v.icon,p+'.icon',32);imageIcon(v,p);list(v.tags,p+'.tags');v.tags.forEach(t=>str(t,p+'.tag',80));origin(v.origin,p+'.origin');if(v.deleted!==undefined)assert(typeof v.deleted==='boolean',p+'.deleted');};
  assert(s.catalogVersion===3,'catalogVersion');
  const cs=unique(s.cards,'cards');s.cards.forEach(c=>card(c,'card'));
  const is=unique(s.ideas,'ideas');s.ideas.forEach(v=>{str(v.text,'idea.text',240);assert(v.text.trim(),'idea.text 空白');str(v.icon,'idea.icon',32);imageIcon(v,'idea');str(v.notes,'idea.notes');assert(Number.isFinite(v.priority)&&v.priority>=0&&v.priority<=1,'priority 0–1');assert(['incubating','resting'].includes(v.status),'idea.status');origin(v.origin,'idea.origin');timestamp(v.createdAt,'idea.createdAt');timestamp(v.updatedAt,'idea.updatedAt');});
  unique(s.decks,'decks');s.decks.forEach(d=>{str(d.name,'deck.name',120);list(d.cardIds,'deck.cardIds');assert(new Set(d.cardIds).size===d.cardIds.length,'deck 重複 cardId');d.cardIds.forEach(v=>assert(cs.has(v),'deck 卡片遺失'));});assert(s.decks.some(d=>d.id==='main'),'main deck 遺失');
  unique(s.spreadTemplates,'spreadTemplates');assert(s.spreadTemplates.some(t=>t.id==='gom'),'GOM 模板遺失');
  const checkSession=(v)=>{assert(v&&v.spreadId==='gom','session.spreadId');assert(v.directions&&v.randomWords,'session.directions / randomWords');assert(typeof v.directionsRevealed==='boolean','session.directionsRevealed');for(const slot of Object.keys(ROLES)){assert(v.slots&&v.snapshot,'session.slots / snapshot');assert(v.slots[slot]===null||cs.has(v.slots[slot]),'session 卡片遺失');const c=v.snapshot[slot];if(v.slots[slot]!==null){assert(c&&c.id===v.slots[slot],'session.snapshot');card(c,'snapshot');}else assert(c===null,'snapshot 空牌位');assert(v.directions[slot]===null||Object.hasOwn(DIRECTIONS,v.directions[slot]),slot+' direction');assert(v.randomWords[slot]===null||typeof v.randomWords[slot]==='string'&&v.randomWords[slot].length<=240,slot+' randomWord');}assert(v.ideaId===null||is.has(v.ideaId),'session idea 遺失');str(v.question,'question',4000);str(v.status,'session.status',80);timestamp(v.createdAt,'session.createdAt');list(v.events,'session.events');v.events.forEach(e=>{assert(e&&typeof e==='object','event');str(e.type,'event.type',80);timestamp(e.at,'event.at');});};
  const ss=unique(s.sessions,'sessions');s.sessions.forEach(checkSession);
  const checkDepth=session=>{assert(session.depthShifts&&typeof session.depthShifts==='object','session.depthShifts');for(const slot of Object.keys(ROLES))assert(session.depthShifts[slot]===null||Object.hasOwn(DEPTH_SHIFTS,session.depthShifts[slot]),slot+' depth shift');};
  s.sessions.forEach(checkDepth);s.ideas.filter(idea=>idea.snapshot).forEach(idea=>checkDepth(idea.snapshot));
  assert(!Object.hasOwn(s,'journal'),'Schema 3 的紀錄應儲存在水槽');
  s.ideas.forEach(v=>{assert(Object.hasOwn(RECORD_KINDS,v.kind),'idea.kind');if(v.isDraft!==undefined)assert(typeof v.isDraft==='boolean','idea.isDraft');for(const [field,ids] of [['ideaIds',is],['cardIds',cs],['sessionIds',ss]]){list(v[field],field);v[field].forEach(ref=>assert(ids.has(ref),`idea ${field} 遺失`));}if(v.snapshot!==null){checkSession(v.snapshot);assert(ss.has(v.snapshot.id),'idea snapshot session 遺失');}});
  assert(s.ui&&['spread','cauldron'].includes(s.ui.activeView),'ui.activeView');assert(ss.has(s.ui.activeSessionId),'activeSessionId');assert(typeof s.ui.muted==='boolean','ui.muted');assert(['priority','date'].includes(s.ui.ideaSort),'ui.ideaSort');
  assert(s.orb&&typeof s.orb.kept==='boolean','orb');assert(s.orb.word===null||typeof s.orb.word==='string'&&s.orb.word.length<=240,'orb.word');list(s.orb.history,'orb.history');s.orb.history.forEach(v=>{str(v.word,'orb history word',240);timestamp(v.at,'orb history at');});s.orb.savedWords??=[];list(s.orb.savedWords,'orb.savedWords');s.orb.savedWords.forEach(w=>str(w,'orb.savedWord',240));
  assert(Number.isSafeInteger(s.revision)&&s.revision>=0,'revision');
  const allIds=[...s.cards,...s.ideas,...s.sessions,...s.decks].map(v=>v.id);assert(new Set(allIds).size===allIds.length,'跨類型 ID 重複');
  const known={idea:is,card:cs,session:ss};
  [...s.cards,...s.ideas].forEach(v=>{if(v.origin.id&&known[v.origin.type])assert(known[v.origin.type].has(v.origin.id),'origin 來源遺失');});
  return s;
}
/** Merge preserves both histories by remapping every imported entity ID, including collisions. */
export function mergeStates(current,incoming){
  const a=validate(current),b=validate(incoming),map=new Map();
  for(const field of ['ideas','cards','decks','sessions'])for(const v of b[field])map.set(v.id,id(field.slice(0,-1)));
  const ref=(x)=>map.get(x)||x;
  const remapOrigin=(v)=>{if(v.origin?.id)v.origin.id=ref(v.origin.id);};
  const remapCard=v=>{v.id=ref(v.id);remapOrigin(v);};
  const remapSession=(v)=>{v.id=ref(v.id);v.ideaId=v.ideaId?ref(v.ideaId):null;for(const k of Object.keys(ROLES)){if(v.slots[k])v.slots[k]=ref(v.slots[k]);if(v.snapshot[k])remapCard(v.snapshot[k]);}v.events=v.events.map(e=>{const next={...e};if(next.cardId)next.cardId=ref(next.cardId);if(next.ideaId)next.ideaId=ref(next.ideaId);if(Array.isArray(next.cardIds))next.cardIds=next.cardIds.map(ref);if(next.previousCard)remapCard(next.previousCard);if(next.previousSnapshot)Object.values(next.previousSnapshot).filter(Boolean).forEach(remapCard);return next;});};
  b.cards.forEach(remapCard);b.sessions.forEach(remapSession);
  b.ideas.forEach(v=>{v.id=ref(v.id);remapOrigin(v);v.ideaIds=v.ideaIds.map(ref);v.cardIds=v.cardIds.map(ref);v.sessionIds=v.sessionIds.map(ref);if(v.snapshot)remapSession(v.snapshot);});
  for(const field of ['ideas','cards','sessions'])a[field].push(...b[field]);
  const main=a.decks.find(d=>d.id==='main');for(const d of b.decks){const ids=d.cardIds.map(ref);main.cardIds.push(...ids.filter(x=>!main.cardIds.includes(x)));}
  a.orb.history.push(...b.orb.history);a.orb.savedWords=[...new Set([...(a.orb.savedWords||[]),...b.orb.savedWords])];return validate(a);
}
