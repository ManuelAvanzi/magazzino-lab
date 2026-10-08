import {cp,mkdir,rm,stat} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve,dirname} from 'node:path';

const root=dirname(fileURLToPath(import.meta.url));
const output=resolve(root,'dist');
if(dirname(output)!==root)throw new Error('Output must stay in the project directory');
const files=['cloud.js','cloud-config.js','account.html','account.js','account.css','studio-account.js','home-account.js','studio-simple.js','studio-simple.css','equipment-catalog.js','equipment-models.js','index.html','simulator.html','simulator.css','simulator.js','simulator-model.js','simulator-scene.js','studio.html','startup.js','loading.css','flow.css','templates.js','truck-yard.js','app.js','atmosphere.js','editor-model.js','editor-refined.css','editor.css','flow-lesson.js','flow-model.js','home.css','home.js','human-worker.js','model.js','motion.js','plan-editor.js','style.css','warehouse-scene.js','assets','fonts','vendor'];
for(const file of files)await stat(resolve(root,file));
await rm(output,{recursive:true,force:true});
await mkdir(output,{recursive:true});
for(const file of files)await cp(resolve(root,file),resolve(output,file),{recursive:true});
console.log('Static site ready in dist/');
