import { esc } from './ui.js';
export const ICON_CATEGORIES={
  '自然與環境':['🌊','🌱','🌳','🍄','🌋','🏔️','🌙','☀️','🌧️','❄️','🔥','🪨'],
  '生命與角色':['🧑','👥','👁️','🧠','🦴','🐦','🐟','🦊','🦋','🐚','🥚','🐾'],
  '物件與場所':['🏙️','🏚️','🚪','🪞','🔑','🔔','🕯️','📦','🧵','🧭','⌛','⚖️'],
  '動作與機制':['🔨','⚙️','🧲','✂️','🔗','🛡️','💥','🔄','🔀','⚡','🪜','🎲'],
  '情緒與關係':['❤️','💔','🎭','🤝','💭','❓','❗','👑','🎁','🕊️','🕸️','🫧'],
  '符號與魔法':['✧','✦','◎','⟁','✳','∞','☯','♟','🔮','🪄','📜','🧿']
};
export function cardArt(card){return card?.iconImage?`<img class="card-image" src="${esc(card.iconImage)}" alt=""/>`:esc(card?.icon||'✧');}
export function iconPicker(card,label='圖示'){
  return `<fieldset class="icon-picker"><legend>${esc(label)}</legend><div class="icon-preview-row"><span id="card-icon-preview" class="icon-preview">${cardArt(card)}</span><p>從分類挑一個圖示，或使用自己的圖片。</p></div><label class="field">圖示分類<select id="icon-category">${Object.keys(ICON_CATEGORIES).map(name=>`<option>${name}</option>`).join('')}</select></label><div id="icon-options" class="icon-options" role="group" aria-label="預設圖示">${iconOptions(Object.keys(ICON_CATEGORIES)[0])}</div><details class="custom-icon"><summary>自行輸入符號</summary><label class="field">文字或 Emoji<input name="icon" maxlength="32" required value="${esc(card?.icon||'✧')}"/></label></details><div class="icon-upload-row"><label class="file-button secondary">上傳圖片<input id="card-icon-file" type="file" accept="image/png,image/jpeg,image/webp"/></label><button type="button" class="text-button" id="remove-card-image" ${card?.iconImage?'':'hidden'}>移除上傳圖片</button></div><p class="microcopy" id="icon-feedback" role="status">支援 PNG、JPG、WebP，最多 5 MB。會縮為小圖並隨 JSON 備份保存。</p></fieldset>`;
}
export function iconOptions(category){return (ICON_CATEGORIES[category]||[]).map(value=>`<button type="button" class="icon-option" data-icon="${esc(value)}" aria-label="使用圖示 ${esc(value)}">${value}</button>`).join('');}
export async function readIconImage(file){
  if(!file||!['image/png','image/jpeg','image/webp'].includes(file.type))throw Error('請選擇 PNG、JPG 或 WebP 圖片。');
  if(file.size>5*1024*1024)throw Error('圖片超過 5 MB，請選擇較小的圖片。');
  const url=URL.createObjectURL(file),image=new Image();
  try{
    image.src=url;await image.decode();
    if(!image.naturalWidth||!image.naturalHeight||image.naturalWidth*image.naturalHeight>40_000_000)throw Error('圖片尺寸過大，請選擇較小的圖片。');
    const canvas=document.createElement('canvas');canvas.width=128;canvas.height=128;
    const context=canvas.getContext('2d');if(!context)throw Error('此瀏覽器無法處理圖片。');
    const scale=Math.min(128/image.naturalWidth,128/image.naturalHeight),w=image.naturalWidth*scale,h=image.naturalHeight*scale;
    context.drawImage(image,(128-w)/2,(128-h)/2,w,h);
    const result=canvas.toDataURL('image/png');if(result.length>150000)throw Error('圖片轉換後過大，請選擇較簡單的圖示。');return result;
  }catch(error){if(error.message.includes('圖片')||error.message.includes('瀏覽器'))throw error;throw Error('無法讀取這張圖片，請換一張有效圖片。');}
  finally{URL.revokeObjectURL(url);}
}
export function bindIconPicker(dialog,card,onImageChange){
  const input=dialog.querySelector('[name=icon]'),preview=dialog.querySelector('#card-icon-preview'),remove=dialog.querySelector('#remove-card-image'),feedback=dialog.querySelector('#icon-feedback'),fileInput=dialog.querySelector('#card-icon-file');
  let image=card?.iconImage||null,version=0;
  const refresh=()=>{preview.innerHTML=cardArt({icon:input.value,iconImage:image});remove.hidden=!image;dialog.querySelectorAll('.icon-option').forEach(button=>button.setAttribute('aria-pressed',String(!image&&button.dataset.icon===input.value)));onImageChange(image);};
  const useSymbol=()=>{version++;image=null;fileInput.value='';feedback.textContent='已選用圖示，保存後套用。';refresh();};
  dialog.querySelector('#icon-category').onchange=e=>{dialog.querySelector('#icon-options').innerHTML=iconOptions(e.target.value);refresh();};
  dialog.querySelector('#icon-options').onclick=e=>{const option=e.target.closest('[data-icon]');if(option){input.value=option.dataset.icon;useSymbol();}};
  input.addEventListener('input',useSymbol);remove.onclick=useSymbol;
  fileInput.onchange=async()=>{
    const file=fileInput.files[0];if(!file)return;const request=++version,submit=dialog.querySelector('[type=submit]');submit.disabled=true;feedback.textContent='正在縮小圖片…';
    try{const result=await readIconImage(file);if(request!==version||!dialog.open)return;image=result;refresh();feedback.textContent='圖片已準備好，保存後套用。';}
    catch(error){if(request===version){feedback.textContent=error.message;fileInput.value='';}}
    finally{if(request===version||!fileInput.value)submit.disabled=false;}
  };
  dialog.querySelector('#icon-category').value=Object.keys(ICON_CATEGORIES).find(category=>ICON_CATEGORIES[category].includes(input.value))||Object.keys(ICON_CATEGORIES)[0];
  dialog.querySelector('#icon-options').innerHTML=iconOptions(dialog.querySelector('#icon-category').value);
  refresh();
}
