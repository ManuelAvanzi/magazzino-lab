import {currentUser} from './cloud.js';
currentUser().then(user=>{if(user)document.querySelectorAll('[data-access]').forEach(a=>a.textContent='I miei progetti ↗');}).catch(()=>{});
