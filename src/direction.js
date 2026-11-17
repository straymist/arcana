import { DEPTH_SHIFTS, DIRECTIONS } from './data.js';
export function depthOcean(){
  return `<span class="depth-ocean" role="img" aria-label="海洋切面"><svg viewBox="0 0 64 64" fill="none" aria-hidden="true"><path d="M5 17Q12 10 19 17T33 17T47 17T59 17V55H5Z" fill="#5e928a" stroke="#5f7061" stroke-width="2"/><path d="M6 29Q19 24 32 30T58 30V55H6Z" fill="#396d70"/><path d="M6 41Q20 36 33 42T58 41V55H6Z" fill="#25474e"/><path d="M6 53L19 48L32 52L45 46L58 50V56H6Z" fill="#b5a575"/><path d="M13 23L13 35M22 23L22 29M45 24L45 35" stroke="#cee2c5" stroke-width="1.5" stroke-linecap="round" opacity=".65"/></svg></span>`;
}
export function depthControl(slot,shift){
  const value=DEPTH_SHIFTS[shift];
  return `<button type="button" class="depth-control" data-action="depth-toggle" data-slot="${slot}" aria-label="切換 ${slot} 深度變換方向：${value?value.name:'尚未選擇'}"><span class="depth-disc"><span class="depth-arrow" aria-hidden="true">${value?value.icon:'↕'}</span></span></button>`;
}
export function directionPrompt(session,slot){
  const direction=session.directions[slot];
  if(direction==='depth')return '深度變換';
  return direction?DIRECTIONS[direction].prompt:'換個方向，看看還有什麼可能？';
}
