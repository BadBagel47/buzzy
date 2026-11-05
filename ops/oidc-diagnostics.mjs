import {mkdir, writeFile, appendFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {assertContext, REPOSITORY, REPOSITORY_ID, OWNER_ID} from './policy.mjs';

// These are public identity selectors. Never print/retain the JWT, request
// authorization, arbitrary claims or Google credentials.
export const PUBLIC_CLAIMS = Object.freeze(['repository_id', 'repository_owner_id', 'ref', 'event_name', 'workflow_ref', 'sub', 'environment', 'aud']);

export function summarizeClaims(claims, kind) {
  const expected = {
    repository_id: REPOSITORY_ID, repository_owner_id: OWNER_ID,
    ref: 'refs/heads/main', event_name: 'workflow_dispatch',
    workflow_ref: `${REPOSITORY}/.github/workflows/firebase-${kind}.yml@refs/heads/main`,
    sub: `repo:${REPOSITORY}:environment:firebase-${kind}`,
  };
  const visible = Object.fromEntries(PUBLIC_CLAIMS.map(key => [key, typeof claims[key] === 'string' ? claims[key] : '(missing)']));
  return {claims: visible, comparisons: Object.fromEntries(Object.entries(expected).map(([key, value]) => [key, {expected: value, matches: visible[key] === value}])), note: 'Public selector diagnostics only; not JWT signature verification and not Google authorization.'};
}

export async function diagnose(env, kind, fetchImpl = fetch) {
  assertContext(env, kind);
  const url = new URL(env.ACTIONS_ID_TOKEN_REQUEST_URL || 'https://invalid.local');
  if (url.protocol !== 'https:' || !url.hostname.endsWith('.actions.githubusercontent.com') || !env.ACTIONS_ID_TOKEN_REQUEST_TOKEN) throw new Error('Missing supported GitHub OIDC request context');
  url.searchParams.set('audience', `https://iam.googleapis.com/${env.WIF_PROVIDER}`);
  let response;
  try {
    response = await fetchImpl(url, {method: 'GET', redirect: 'error', signal: AbortSignal.timeout(20_000), headers: {Authorization: `Bearer ${env.ACTIONS_ID_TOKEN_REQUEST_TOKEN}`}});
  } catch { throw new Error('GitHub OIDC diagnostics request failed; request credentials are not logged'); }
  if (!response.ok) throw new Error(`GitHub OIDC diagnostics HTTP ${response.status}`);
  let claims;
  try {
    const payload = await response.json();
    const parts = payload.value.split('.');
    if (parts.length !== 3) throw new Error('Invalid JWT');
    claims = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
  } catch { throw new Error('Invalid GitHub OIDC response; token contents are not logged'); }
  return summarizeClaims(claims, kind);
}

export async function main(kind = process.argv[2], env = process.env) {
  const report = await diagnose(env, kind);
  const directory = resolve('ci-reports', kind);
  await mkdir(directory, {recursive: true});
  const json = JSON.stringify(report, null, 2);
  await writeFile(resolve(directory, 'oidc-selectors.json'), json + '\n');
  if (env.GITHUB_STEP_SUMMARY) await appendFile(env.GITHUB_STEP_SUMMARY, '## GitHub identity selectors\n\nOnly public claim values are shown. No authentication tokens are included.\n\n```json\n' + json + '\n```\n');
  console.log(json);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch(error => { console.error(error.message); process.exitCode = 1; });
