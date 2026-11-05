// Local metadata only. No login, API request, token output or deployment.
import {createRequire} from 'node:module';import {readFileSync,existsSync,writeFileSync} from 'node:fs';
const require=createRequire(import.meta.url);process.env.XDG_CONFIG_HOME='/tmp/buzzy-firebase-config';
const accounts=require('firebase-tools/lib/auth').getAllAccounts();
const config=JSON.parse(readFileSync('config/firebase.buzzy-197dc.json','utf8'));
const result={status:accounts.length?'local prerequisites present; cloud inventory still required':'blocked for cloud operations: Firebase login required',projectId:config.projectId,authorizedAccountCount:accounts.length,pilotBuildExists:existsSync('dist-pilot/index.html'),databaseRules:'reviewed reference; existing cloud rules not read',cloudRequestsSent:0,deploymentPerformed:false};
writeFileSync('reports/local-preflight.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
