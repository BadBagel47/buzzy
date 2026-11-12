import {readFile, appendFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {rulesHash} from './policy.mjs';

// #385: a push to the release branch may start the reviewed Hosting publication only when
// (1) release points at exactly the current main commit, which the publication workflow builds, and
// (2) the proposed rules in the repo are the rules last confirmed in the Firebase console.
// A rules change is never published this way; it still needs the manual console flow.
export function releaseCheck({releaseSha, mainSha, proposed, snapshot}) {
  if (!/^[a-f0-9]{40}$/.test(releaseSha || '') || !/^[a-f0-9]{40}$/.test(mainSha || '')) throw new Error('Missing release or main commit');
  if (releaseSha !== mainSha) throw new Error('The release branch must point at the current main commit. Push main first, then the same commit to release.');
  if (snapshot?.publicationConfirmedByUser !== true || !/^[a-f0-9]{64}$/.test(snapshot.canonicalSha256 || '')) throw new Error('No user-confirmed console rules snapshot');
  const hash = rulesHash(proposed);
  if (hash !== snapshot.canonicalSha256) throw new Error('The proposed rules differ from the confirmed console rules. Publish the rules through the manual console flow first.');
  return hash;
}

export async function main(env = process.env) {
  const [proposed, snapshot] = await Promise.all([
    readFile('buzzy-live-pilot/database.rules.json', 'utf8').then(JSON.parse),
    readFile('ops/rules-evidence/console-snapshot.json', 'utf8').then(JSON.parse),
  ]);
  const hash = releaseCheck({releaseSha: env.GITHUB_SHA, mainSha: env.MAIN_SHA, proposed, snapshot});
  if (env.GITHUB_OUTPUT) await appendFile(env.GITHUB_OUTPUT, `rules_sha256=${hash}\n`);
  console.log(`Release ${env.GITHUB_SHA} equals main; proposed rules match the confirmed console rules (${hash}).`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch(error => { console.error(error.message); process.exitCode = 1; });
