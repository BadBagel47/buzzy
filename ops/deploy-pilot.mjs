import {spawnSync} from 'node:child_process';
import {readFileSync, existsSync, appendFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {assertContext, assertApproval, pilotArguments, hostingOnlyConfig} from './policy.mjs';

assertContext(process.env, 'pilot');
const approval = JSON.parse(readFileSync('ci-reports/pilot/approval.json', 'utf8'));
assertApproval(approval, process.env);
const root = resolve('buzzy-live-pilot');
const config = JSON.parse(readFileSync(resolve(root, 'firebase.hosting-ci.json'), 'utf8'));
const expected = hostingOnlyConfig(JSON.parse(readFileSync(resolve(root, 'firebase.pilot.json'), 'utf8')));
if (JSON.stringify(config) !== JSON.stringify(expected) || !existsSync(resolve(root, 'dist-pilot/index.html'))) throw new Error('Unexpected deploy configuration or missing build');
if (!process.env.GOOGLE_APPLICATION_CREDENTIALS || !existsSync(process.env.GOOGLE_APPLICATION_CREDENTIALS)) throw new Error('Missing short-lived ADC file');
const result = spawnSync(process.execPath, ['node_modules/firebase-tools/lib/bin/firebase.js', ...pilotArguments()], {
  cwd: root, stdio: 'inherit', env: {...process.env, CI: 'true', NO_UPDATE_NOTIFIER: '1'},
});
if (result.status !== 0) process.exit(result.status || 1);
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, '\nPilot deployment command completed successfully. Find the actual channel URL in the Firebase output or Hosting Console. Main Hosting release, Auth domains and database rules were not targets of this command.\n');
