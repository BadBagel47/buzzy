import {createHash} from 'node:crypto';

export const PROJECT = 'buzzy-197dc';
export const PROJECT_NUMBER = '775038676052';
export const REPOSITORY = 'BadBagel47/buzzy';
export const REPOSITORY_ID = '1423632612';
export const OWNER_ID = '340718529';
export const DATABASE = 'buzzy-197dc-default-rtdb';
export const DATABASE_URL = `https://${DATABASE}.europe-west1.firebasedatabase.app`;
export const PROVIDER = `projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/buzzy-github/providers/github`;
export const SCOPES = ['https://www.googleapis.com/auth/cloud-platform', 'https://www.googleapis.com/auth/firebase.database', 'https://www.googleapis.com/auth/userinfo.email'];

// Observed in this repository's GitHub OIDC token: names are qualified with
// immutable owner/repository IDs. Do not fall back to the older name-only sub.
export function oidcSubject(kind) {
  if (!['inventory', 'pilot'].includes(kind)) throw new Error('Unknown workflow kind');
  const [owner, repository] = REPOSITORY.split('/');
  return `repo:${owner}@${OWNER_ID}/${repository}@${REPOSITORY_ID}:environment:firebase-${kind}`;
}

function ordered(value) {
  if (Array.isArray(value)) return value.map(ordered);
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map(key => [key, ordered(value[key])]));
  return value;
}
export function rulesHash(rules) {
  if (!rules || typeof rules !== 'object' || !rules.rules || typeof rules.rules !== 'object' || Array.isArray(rules.rules)) throw new Error('Invalid rules document');
  return createHash('sha256').update(JSON.stringify(ordered(rules))).digest('hex');
}

export function assertContext(env, kind) {
  if (!['inventory', 'pilot'].includes(kind)) throw new Error('Unknown workflow kind');
  const required = {
    GITHUB_REPOSITORY: REPOSITORY,
    GITHUB_REPOSITORY_ID: REPOSITORY_ID,
    GITHUB_REPOSITORY_OWNER_ID: OWNER_ID,
    GITHUB_EVENT_NAME: 'workflow_dispatch',
    GITHUB_REF: 'refs/heads/main',
    GITHUB_WORKFLOW_REF: `${REPOSITORY}/.github/workflows/firebase-${kind}.yml@refs/heads/main`,
    WIF_PROVIDER: PROVIDER,
    GOOGLE_SERVICE_ACCOUNT: `buzzy-${kind === 'inventory' ? 'gpt' : 'hosting'}@${PROJECT}.iam.gserviceaccount.com`,
  };
  for (const [key, expected] of Object.entries(required)) if (env[key] !== expected) throw new Error(`Unexpected or missing ${key}`);
  if (!/^[a-f0-9]{40}$/.test(env.GITHUB_SHA || '')) throw new Error('Missing source commit');
  if (kind === 'pilot' && !/^[a-f0-9]{64}$/.test(env.REVIEWED_RULES_SHA256 || '')) throw new Error('A reviewed rules hash is required');
}

export function assertPilotReady(report, reviewedHash) {
  const failed = [];
  if (!Array.isArray(report.errors) || report.errors.length) failed.push('inventory is incomplete');
  if (report.projectId !== PROJECT || report.projectNumber !== PROJECT_NUMBER || report.projectState !== 'ACTIVE') failed.push('project identity/state');
  if (report.billingEnabled !== false || report.billingAccountLinked !== false) failed.push('no linked billing account has not been verified');
  if (report.anonymousEnabled !== true) failed.push('Anonymous Auth is not enabled');
  if (report.databaseUrl !== DATABASE_URL || report.databaseState !== 'ACTIVE') failed.push('database identity/state');
  if (report.siteDefaultUrl !== `https://${PROJECT}.web.app`) failed.push('Hosting site is missing or different');
  if (report.hostingApiEnabled !== true) failed.push('Hosting API is not already enabled');
  if (report.currentRulesSha256 !== report.proposedRulesSha256 || report.currentRulesSha256 !== reviewedHash) failed.push('cloud rules do not match the reviewed proposed rules');
  if (failed.length) throw new Error(`Pilot blocked: ${failed.join('; ')}`);
}

export function hostingOnlyConfig(config) {
  const hosting = structuredClone(config.hosting);
  if (!hosting || Array.isArray(hosting) || hosting.public !== 'dist-pilot' || hosting.rewrites || hosting.frameworksBackend) throw new Error('Unexpected Hosting configuration');
  hosting.site = PROJECT;
  return {hosting};
}

export function pilotArguments() {
  return ['hosting:channel:deploy', 'pilot', '--project', PROJECT, '--config', 'firebase.hosting-ci.json', '--expires', '1d', '--no-authorized-domains', '--non-interactive', '--json'];
}

export function assertApproval(approval, env, now = Date.now()) {
  const verifiedAt = Date.parse(approval.verifiedAt);
  if (approval.sourceCommit !== env.GITHUB_SHA || approval.reviewedRulesSha256 !== env.REVIEWED_RULES_SHA256 || !Number.isFinite(verifiedAt) || now - verifiedAt > 120_000 || verifiedAt > now || approval.target !== 'pilot' || approval.databaseWritesAllowed !== false) throw new Error('Missing or stale read-only preflight approval');
}
