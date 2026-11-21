import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
// #441: the committed database rules must be exactly what the rules generator produces.
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
test('Committed database rules match the generator output',()=>{
 const dir=mkdtempSync(path.join(tmpdir(),'buzzy-rules-'));
 execFileSync(process.execPath,[path.join(root,'scripts/generate-ui-rules.mjs')],{cwd:dir});
 assert.equal(readFileSync(path.join(dir,'database.rules.json'),'utf8'),readFileSync(path.join(root,'database.rules.json'),'utf8'),'Run `npm run rules` in buzzy-live-pilot and commit database.rules.json');
});
