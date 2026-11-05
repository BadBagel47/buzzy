import publicConfig from '../config/firebase.buzzy-197dc.json' with {type:'json'};
export const PILOT_HOSTS=['buzzy-197dc.web.app','buzzy-197dc.firebaseapp.com'];
export function resolveRuntime({target,hostname,protocol},config=publicConfig){
 if(target==='emulator'){
  if(!['localhost','127.0.0.1'].includes(hostname))throw new Error('This local build requires the local test environment.');
  return {target,config:{projectId:'demo-buzzy-ui',apiKey:'demo-buzzy-ui-key',authDomain:'demo-buzzy-ui.firebaseapp.com',databaseURL:'https://demo-buzzy-ui-default-rtdb.firebaseio.com'},authEmulator:'http://127.0.0.1:9099',databaseEmulator:{host:'127.0.0.1',port:9000}};
 }
 if(target!=='pilot')throw new Error('Unknown application target.');
 if(protocol!=='https:'||!(PILOT_HOSTS.includes(hostname)||/^buzzy-197dc--pilot-[a-z0-9-]+\.web\.app$/.test(hostname)))throw new Error('Open this pilot on its approved HTTPS address.');
 if(config.projectId!=='buzzy-197dc'||config.databaseURL!=='https://buzzy-197dc-default-rtdb.europe-west1.firebasedatabase.app'||config.authDomain!=='buzzy-197dc.firebaseapp.com'||config.appId!=='1:775038676052:web:362b4fd3f48bf77d2d51c1'||config.apiKey!==publicConfig.apiKey)throw new Error('Pilot configuration does not match the reviewed Firebase project.');
 return {target,config:{...config}};
}
export function initializeRuntime(sdk,input,config){
 const runtime=resolveRuntime(input,config);
 const app=sdk.initializeApp(runtime.config),auth=sdk.getAuth(app),db=sdk.getDatabase(app);
 if(runtime.target==='emulator'){
  sdk.connectAuthEmulator(auth,runtime.authEmulator,{disableWarnings:true});
  sdk.connectDatabaseEmulator(db,runtime.databaseEmulator.host,runtime.databaseEmulator.port);
 }
 return {app,auth,db,target:runtime.target};
}
