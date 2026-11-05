import {mkdir, writeFile, readFile, appendFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {PROJECT, PROJECT_NUMBER, DATABASE, DATABASE_URL, rulesHash, assertContext, assertPilotReady, hostingOnlyConfig} from './policy.mjs';
import {parseRulesSource} from './rules-source.mjs';

export const RESOURCES = Object.freeze({
  project: `https://firebase.googleapis.com/v1beta1/projects/${PROJECT}`,
  billing: `https://cloudbilling.googleapis.com/v1/projects/${PROJECT}/billingInfo`,
  auth: `https://identitytoolkit.googleapis.com/admin/v2/projects/${PROJECT}/config`,
  database: `https://firebasedatabase.googleapis.com/v1beta/projects/${PROJECT}/locations/europe-west1/instances/${DATABASE}`,
  site: `https://firebasehosting.googleapis.com/v1beta1/projects/${PROJECT}/sites/${PROJECT}`,
  releases: `https://firebasehosting.googleapis.com/v1beta1/projects/${PROJECT}/sites/${PROJECT}/releases?pageSize=5`,
  pilot: `https://firebasehosting.googleapis.com/v1beta1/projects/${PROJECT}/sites/${PROJECT}/channels/pilot`,
  hostingService: `https://serviceusage.googleapis.com/v1/projects/${PROJECT_NUMBER}/services/firebasehosting.googleapis.com`,
  rules: `${DATABASE_URL}/.settings/rules.json`,
});

export function reader(token, fetchImpl = fetch) {
  if (!token || /[\r\n]/.test(token)) throw new Error('Missing or invalid temporary access token');
  return async name => {
    if (!Object.hasOwn(RESOURCES, name)) throw new Error('Unknown inventory resource');
    let response;
    try {
      response = await fetchImpl(RESOURCES[name], {
        method: 'GET', redirect: 'error', signal: AbortSignal.timeout(25_000),
        headers: {Authorization: `Bearer ${token}`, Accept: 'application/json'},
      });
    } catch {
      throw new Error(`${name}: request failed (network/redirect/timeout); credentials and response bodies are not logged`);
    }
    if (name === 'pilot' && response.status === 404) return null;
    if (!response.ok) throw new Error(`${name}: HTTP ${response.status}; inspect API status and read permissions in Google Console`);
    if (name === 'rules') return response.text();
    let value;
    try { value = await response.json(); } catch { throw new Error(`${name}: invalid JSON response`); }
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${name}: unexpected response`);
    return value;
  };
}

function releaseMetadata(release) {
  if (!release) return null;
  return {name: release.name, type: release.type, releaseTime: release.releaseTime, version: release.version && {name: release.version.name, status: release.version.status}};
}

export async function collectInventory({read, proposed, save}) {
  const result = {projectId: PROJECT, checkedAt: new Date().toISOString(), readOnly: true, errors: []};
  const resources = {};
  // Save rules immediately, even if a later metadata read fails. No player data is read.
  for (const name of ['rules', ...Object.keys(RESOURCES).filter(n => n !== 'rules')]) {
    try {
      resources[name] = await read(name);
      if (name === 'rules') {
        await save('existing-database.rules.json', resources.rules);
        result.currentRulesSha256 = rulesHash(parseRulesSource(resources.rules));
      }
    } catch (error) {
      result.errors.push(error.message);
    }
  }
  result.proposedRulesSha256 = rulesHash(proposed);
  await save('proposed-database.rules.json', proposed);
  result.rulesMatch = result.currentRulesSha256 === result.proposedRulesSha256;
  result.projectNumber = String(resources.project?.projectNumber ?? '');
  result.projectState = resources.project?.state;
  if (resources.project && resources.project.projectId !== PROJECT) result.errors.push('Firebase project identity is not verified');
  result.billingEnabled = resources.billing?.billingEnabled;
  result.billingAccountLinked = resources.billing ? Boolean(resources.billing.billingAccountName) : undefined;
  result.anonymousEnabled = resources.auth?.signIn?.anonymous?.enabled;
  result.authorizedDomains = resources.auth?.authorizedDomains;
  result.databaseUrl = resources.database?.databaseUrl?.replace(/\/$/, '');
  result.databaseState = resources.database?.state;
  result.siteDefaultUrl = resources.site?.defaultUrl;
  result.hostingApiEnabled = resources.hostingService?.state === 'ENABLED';
  result.liveReleases = resources.releases?.releases?.map(releaseMetadata) ?? [];
  result.pilot = resources.pilot === null ? null : resources.pilot ? {name: resources.pilot.name, url: resources.pilot.url, expireTime: resources.pilot.expireTime, release: releaseMetadata(resources.pilot.release)} : undefined;
  result.status = result.errors.length ? 'incomplete; no changes performed' : 'inventory complete; no changes performed';
  await save('inventory.json', result);
  return result;
}

export async function main(kind = process.argv[2], env = process.env) {
  assertContext(env, kind);
  const directory = resolve('ci-reports', kind);
  await mkdir(directory, {recursive: true});
  const save = (name, value) => writeFile(resolve(directory, name), typeof value === 'string' ? value : JSON.stringify(value, null, 2) + '\n');
  const proposed = JSON.parse(await readFile('buzzy-live-pilot/database.rules.json', 'utf8'));
  const report = await collectInventory({read: reader(env.GOOGLE_OAUTH_ACCESS_TOKEN), proposed, save});
  const summary = `## Buzzy ${kind}\n\nRead-only check for ${PROJECT} at commit ${env.GITHUB_SHA}.\n\n- Status: ${report.status}\n- Current rules SHA-256: ${report.currentRulesSha256 || 'not read'}\n- Proposed rules SHA-256: ${report.proposedRulesSha256}\n- Rules match: ${report.rulesMatch}\n- Billing enabled: ${report.billingEnabled ?? 'not verified'}\n- Anonymous Auth enabled: ${report.anonymousEnabled ?? 'not verified'}\n\nDownload the inventory artifact for the complete rules backup and sanitized metadata. No player data, account list, OAuth settings or credentials are included.\n`;
  if (env.GITHUB_STEP_SUMMARY) await appendFile(env.GITHUB_STEP_SUMMARY, summary);
  console.log(`${report.status}; rules match: ${report.rulesMatch}; resources checked: ${Object.keys(RESOURCES).length}`);
  if (report.errors.length) throw new Error('Read-only inventory incomplete. Read inventory.json; no deployment is permitted.');
  if (kind === 'pilot') {
    assertPilotReady(report, env.REVIEWED_RULES_SHA256);
    const config = JSON.parse(await readFile('buzzy-live-pilot/firebase.pilot.json', 'utf8'));
    await writeFile('buzzy-live-pilot/firebase.hosting-ci.json', JSON.stringify(hostingOnlyConfig(config), null, 2) + '\n');
    await save('approval.json', {sourceCommit: env.GITHUB_SHA, reviewedRulesSha256: env.REVIEWED_RULES_SHA256, verifiedAt: new Date().toISOString(), target: 'pilot', expires: '1d', databaseWritesAllowed: false});
  }
  return report;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
}
