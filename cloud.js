// Compatibility for links created before the online archive was retired.
export const cloud=null;
export const escapeHTML=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function message(e){return e?.message||'Operazione non disponibile.';}
export async function currentUser(){return null;}
export async function loadProject(){throw Error('L’archivio online è stato disattivato. Apri un file esportato o riprendi una bozza su questo dispositivo.');}
