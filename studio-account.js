import {loadProject,message} from './cloud.js';
export async function openOnlineProject(id){
 try{return await loadProject(id);}catch(error){
  const overlay=document.querySelector('#scene-loading');
  if(overlay){overlay.dataset.accountError='true';overlay.querySelector('#loading-status').textContent=message(error);const a=document.createElement('a');a.textContent='Torna al laboratorio →';a.href='studio.html?session=plan';a.style.cssText='display:block;margin-top:20px;color:white';overlay.append(a);}
  throw error;
 }
}
export function mountAccount(){}
