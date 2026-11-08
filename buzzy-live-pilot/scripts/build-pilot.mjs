import {spawnSync} from 'node:child_process';
import {readFileSync,writeFileSync,mkdirSync,readdirSync} from 'node:fs';
import {PILOT_HOSTS} from '../src/runtime-config.js';
const env={...process.env,VITE_BUZZY_TARGET:'pilot'};
for(const args of [['scripts/generate-ui.mjs'],['node_modules/vite/bin/vite.js','build','--mode','pilot']]){
 const result=spawnSync(process.execPath,args,{env,stdio:'inherit'});if(result.status!==0)process.exit(result.status||1);
}
const config=JSON.parse(readFileSync('config/firebase.buzzy-197dc.json','utf8'));
if(config.projectId!=='buzzy-197dc')throw new Error('Unexpected project');
const files=readdirSync('dist-pilot/assets');
mkdirSync('reports',{recursive:true});writeFileSync('reports/pilot-build.json',JSON.stringify({status:'built; not deployed',target:'pilot',projectId:config.projectId,databaseURL:config.databaseURL,hosts:PILOT_HOSTS,assets:files,functionsRequired:false},null,2)+'\n');
