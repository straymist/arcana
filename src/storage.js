import { seed, validate, clone } from './data.js';
export const KEY='arcana.idea-alchemy.v1';
export function load(){
  const raw=localStorage.getItem(KEY);
  if(raw===null)return seed();
  try{return validate(JSON.parse(raw));}catch(e){throw Error(`本機資料無法讀取，原始資料仍保留。${e.message}`);}
}
export function save(state){
  const next=clone(state);next.revision++;
  const json=JSON.stringify(validate(next));
  try{localStorage.setItem(KEY,json);}catch{throw Error('裝置未允許儲存或空間不足。變更尚未儲存，請先匯出備份。');}
  return next;
}
export function download(state){
  const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`arcana-${new Date().toISOString().slice(0,10)}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
export async function readBackup(file){
  if(!file)throw Error('請選取 JSON 檔案。');if(file.size>10*1024*1024)throw Error('檔案超過 10 MB。請選擇 Arcana JSON 備份。');
  let data;try{data=JSON.parse(await file.text());}catch{throw Error('不是有效的 JSON；目前資料未變更。');}return validate(data);
}
