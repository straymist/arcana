import { ROLES, DIRECTIONS, DEPTH_SHIFTS, activeSession } from './data.js';
export function buildGamePrompt(state){
  const session=activeSession(state);
  if(!session||!Object.keys(ROLES).every(slot=>session.snapshot[slot]&&(!session.directionsRevealed||session.directions[slot])))throw Error('先抽出完整的六張牌，再複製解牌提示。');
  const lines=[
    '你是一位遊戲設計師。請根據以下 GOM 素材與各欄方向，提出 3 個可製作小型原型的遊戲提案。',
    '素材可以被重新詮釋；方向牌是各欄的思考方式。每項 AI 提案都只是候選，由創作者決定是否採用。',
    '',
    session.question?'本次問題：'+session.question:'本次問題：留白，請自由探索。',
    '',
    '【本次牌陣】'
  ];
  for(const [slot,role] of Object.entries(ROLES)){
    const card=session.snapshot[slot],direction=DIRECTIONS[session.directions[slot]];
    lines.push(`${slot}｜${role.name}（${role.question}）：${card.icon} ${card.text}`);
    if(!session.directionsRevealed){lines.push('  方向牌蓋起：僅使用本欄素材，不施加方向變換。','');continue;}
    lines.push(`  ${slot} 的方向：${direction.name}。${direction.detail}`);
    if(session.directions[slot]==='lateral')lines.push(`  ${slot} 的晶球詞：${session.randomWords[slot]||'尚未抽詞'}。請嘗試跨領域的關係碰撞。`);
    if(session.directions[slot]==='depth'){const shift=DEPTH_SHIFTS[session.depthShifts[slot]];lines.push(`  ${slot} 的深度方向：${shift?shift.name+'。'+shift.prompt:'尚未選擇，請探索上升與下降的可能。'}`);}
    lines.push('');
  }
  lines.push(
    '【解牌與提案要求】',
    '1. 每個提案用一句話說明玩家在做什麼，以及最有意思的問題。',
    '2. 解釋 G、O、M 如何結合，以及各欄方向如何影響解讀；空牌保持該欄原意。',
    '3. 給出一段 30–60 秒的具體遊玩流程：起始局面 → 玩家操作 → 可見結果 → 下一個選擇。',
    '4. 列出可立即做灰盒的最小規則、2–3 個核心動詞與一個小場景。',
    '5. 指出一個需要實際試玩的問題，清楚區分設計推測與已觀察的事實。',
    '讓三個提案有不同的遊玩關係，不只更換故事包裝。'
  );
  return lines.join('\n');
}
