import {spawn} from 'node:child_process';
import {mkdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const cache=process.env.FIREBASE_EMULATORS_PATH||'/tmp/buzzy-firebase-emulators';
mkdirSync(cache,{recursive:true});
const configHome='/tmp/buzzy-firebase-config';mkdirSync(configHome,{recursive:true});
const mode=process.argv[2];
if(!['start','test','ui','production','transport','pilot-ui','room-ui','refinements','reconnect'].includes(mode))throw new Error('Invalid emulator test mode.');
const args=['--project','demo-buzzy-ui','--config',path.join(root,'firebase.json')];
if(mode==='test')args.unshift('emulators:exec','--only','auth,database','npm run test:integration');
else if(mode==='pilot-ui')args.unshift('emulators:exec','--only','auth,database','node --test --test-concurrency=1 tests/room-exit.integration.mjs tests/transport-csp.integration.mjs tests/room-ui.integration.mjs tests/ui-refinements.integration.mjs tests/reconnect.integration.mjs');
else if(mode==='reconnect')args.unshift('emulators:exec','--only','auth,database','node --test tests/reconnect.integration.mjs');
else if(mode==='refinements')args.unshift('emulators:exec','--only','auth,database','node --test tests/ui-refinements.integration.mjs');
else if(mode==='room-ui')args.unshift('emulators:exec','--only','auth,database','node --test tests/room-ui.integration.mjs');
else if(mode==='transport')args.unshift('emulators:exec','--only','auth,database','node --test tests/transport-csp.integration.mjs');
else if(mode==='ui')args.unshift('emulators:exec','--only','auth,database','node --test tests/ui.integration.mjs');
else if(mode==='production')args.unshift('emulators:exec','--only','auth,database','node --test tests/production.integration.mjs');
else args.unshift('emulators:start','--only','auth,database');
const child=spawn(process.execPath,['--require',path.join(root,'scripts/firebase-loopback-proxy.cjs'),path.join(root,'node_modules/firebase-tools/lib/bin/firebase.js'),...args],{
 cwd:root,stdio:'inherit',env:{...process.env,FIREBASE_EMULATORS_PATH:cache,XDG_CONFIG_HOME:configHome,CI:'true',NO_UPDATE_NOTIFIER:'1'}
});
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>child.kill(signal));
child.on('exit',(code,signal)=>{process.exitCode=code??(signal?1:0);});
