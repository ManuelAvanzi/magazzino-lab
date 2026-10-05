const overlay=document.querySelector('#scene-loading');
const status=document.querySelector('#loading-status');
const track=document.querySelector('.loading-track');
const retry=document.querySelector('#loading-retry');
const appRoot=document.querySelector('#studio-app');
retry.onclick=()=>location.reload();
const paint=()=>new Promise(resolve=>requestAnimationFrame(()=>setTimeout(resolve,0)));
let pending=false,failedResource=false;
const slow=setTimeout(()=>{status.textContent='Il caricamento sta richiedendo più tempo. Attendi oppure riprova.';retry.hidden=false;},45000);
try{
 await paint();
 const T=await import('three');
 T.DefaultLoadingManager.onStart=()=>{pending=true;status.textContent='Caricamento dei modelli e dei materiali…';};
 T.DefaultLoadingManager.onProgress=(_url,loaded,total)=>{status.textContent=`Caricamento delle risorse · ${loaded} di ${total}`;};
 T.DefaultLoadingManager.onLoad=()=>{pending=false;};
 T.DefaultLoadingManager.onError=()=>{failedResource=true;};
 const app=await import('./app.js');
 while(pending)await paint();
 if(failedResource)throw new Error('Una risorsa della scena non è stata caricata.');
 status.textContent='Preparazione delle luci e della prima vista…';
 await paint();
 await app.finishLoading();
 await paint();
 clearTimeout(slow);
 status.textContent='Il magazzino è pronto.';
 track.setAttribute('aria-valuetext','Caricamento completato');
 appRoot.inert=false;appRoot.setAttribute('aria-busy','false');
 overlay.remove();
 // Render catalog thumbnails in separate frames, after the warehouse is usable.
 app.loadCatalogPreviews().catch(error=>console.warn('Anteprime catalogo non disponibili',error));
}catch(error){
 clearTimeout(slow);
 status.textContent='Non è stato possibile aprire la scena. Controlla la connessione e riprova.';
 track.hidden=true;retry.hidden=false;
 console.error('Warehouse Lab: caricamento non riuscito',error);
}
