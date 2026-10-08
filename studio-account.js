import {currentUser,loadProject,saveProject,message} from './cloud.js';
export async function openOnlineProject(id){
 try{return await loadProject(id);}catch(error){
  const overlay=document.querySelector('#scene-loading');
  if(overlay){overlay.dataset.accountError='true';overlay.querySelector('#loading-status').textContent=message(error);const a=document.createElement('a');a.textContent='Accedi o torna ai tuoi progetti →';a.href='account.html?return='+encodeURIComponent(location.pathname+location.search);a.style.cssText='display:block;margin-top:20px;color:white';overlay.append(a);}
  throw error;
 }
}
export function mountAccount({getProject,getBinding,setBinding,saveLocal}){
 const menu=document.querySelector('.actions .studio-menu-content');
 const online=document.createElement('button');online.textContent='Salva online';online.id='save-online';
 const copy=document.createElement('button');copy.textContent='Salva online come nuova copia';
 const account=document.createElement('a');account.href='account.html';account.textContent='Accedi / I miei progetti';account.className='studio-account-link';
 const status=document.createElement('span');status.id='cloud-status';status.setAttribute('role','status');status.textContent=getBinding()?'Progetto online aperto':'Salvataggio online dal menu Progetto';
 document.querySelector('.actions .studio-menu-content').append(status);menu.prepend(online,copy,account);
 async function save(asCopy){online.disabled=copy.disabled=true;saveLocal();try{const user=await currentUser();if(!user){location.assign('account.html?return='+encodeURIComponent(location.pathname+location.search));return;}status.textContent='Salvataggio online…';const source=getProject(),snapshot=structuredClone(source),result=await saveProject(snapshot,asCopy?null:getBinding());if(getProject()!==source){status.textContent='Progetto precedente salvato online. Lo trovi in I miei progetti.';return;}setBinding(result);status.textContent=JSON.stringify(snapshot)===JSON.stringify(getProject())?'✓ Salvato online':'Online salvato · ci sono nuove modifiche locali';}catch(error){status.textContent=message(error);status.title=message(error);const dialog=document.createElement('dialog');dialog.className='editor-help';const h=document.createElement('h2');h.textContent='Salvataggio online';const p=document.createElement('p');p.textContent=message(error);const a=document.createElement('a');a.href='account.html';a.textContent='Apri I miei progetti →';const form=document.createElement('form');form.method='dialog';const close=document.createElement('button');close.textContent='Torna all’editor';form.append(close);dialog.append(h,p,a,form);dialog.addEventListener('close',()=>dialog.remove());document.body.append(dialog);dialog.showModal();}finally{online.disabled=copy.disabled=false;}}
 online.onclick=()=>save(false);copy.onclick=()=>save(true);
 currentUser().then(user=>{if(user)account.textContent='I miei progetti ↗';}).catch(()=>{});
}
