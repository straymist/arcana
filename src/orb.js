import { esc } from './ui.js';
export function lateralOrb(slot,word){
  return `<button type="button" class="crystal-icon" data-action="lateral-word" data-slot="${slot}" aria-label="點 ${slot} 側向牌上的水晶球換一個字"><span class="mini-orb"><span class="crystal-word ${word?'has-word':''}" role="status" aria-live="polite">${word?esc(word):'✧'}</span></span></button>`;
}
