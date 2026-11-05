import test from 'node:test';import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';import {resolveRuntime,initializeRuntime,PILOT_HOSTS} from '../src/runtime-config.js';
const config=JSON.parse(readFileSync('config/firebase.buzzy-197dc.json','utf8'));
test('Emulator target accepts only loopback; pilot requires approved HTTPS origin',()=>{
 for(const host of ['localhost','127.0.0.1'])assert.equal(resolveRuntime({target:'emulator',hostname:host,protocol:'http:'}).target,'emulator');
 for(const hostname of [...PILOT_HOSTS,'evil.example'])assert.throws(()=>resolveRuntime({target:'emulator',hostname,protocol:'https:'}));
 for(const hostname of [...PILOT_HOSTS,'buzzy-197dc--pilot-abc123.web.app']){assert.equal(resolveRuntime({target:'pilot',hostname,protocol:'https:'}).config.projectId,'buzzy-197dc');assert.throws(()=>resolveRuntime({target:'pilot',hostname,protocol:'http:'}));}
 for(const hostname of ['localhost','127.0.0.1','evil.example','buzzy-197dc.web.app.evil.example'])assert.throws(()=>resolveRuntime({target:'pilot',hostname,protocol:'https:'}));
 assert.throws(()=>resolveRuntime({target:'unknown',hostname:'localhost',protocol:'http:'}));
});
test('Wrong project/region/app configuration fails before SDK initialization',()=>{
 for(const key of ['projectId','databaseURL','authDomain','appId','apiKey'])assert.throws(()=>resolveRuntime({target:'pilot',hostname:PILOT_HOSTS[0],protocol:'https:'},{...config,[key]:'wrong'}),key);
});
test('Live adapter initializes actual project without any emulator hook; invalid origin invokes no SDK',()=>{
 const calls=[],sdk=Object.fromEntries(['initializeApp','getAuth','getDatabase','connectAuthEmulator','connectDatabaseEmulator'].map(name=>[name,(...args)=>{calls.push({name,args});return name;}]))
 initializeRuntime(sdk,{target:'pilot',hostname:PILOT_HOSTS[0],protocol:'https:'});assert.deepEqual(calls.map(c=>c.name),['initializeApp','getAuth','getDatabase']);assert.deepEqual(calls[0].args[0],config);
 calls.length=0;assert.throws(()=>initializeRuntime(sdk,{target:'pilot',hostname:'localhost',protocol:'http:'}));assert.equal(calls.length,0);
 initializeRuntime(sdk,{target:'emulator',hostname:'localhost',protocol:'http:'});assert.deepEqual(calls.map(c=>c.name),['initializeApp','getAuth','getDatabase','connectAuthEmulator','connectDatabaseEmulator']);
});
