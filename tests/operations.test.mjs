import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {mkdtemp, mkdir, writeFile, readFile, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {PROJECT, PROJECT_NUMBER, DATABASE_URL, PROVIDER, REPOSITORY, REPOSITORY_ID, OWNER_ID, assertContext, assertPilotReady, assertApproval, rulesHash, hostingOnlyConfig, pilotArguments, hostingArguments, oidcSubject} from '../ops/policy.mjs';
import {RESOURCES, reader, collectInventory, main, apiFailure} from '../ops/inventory.mjs';
import {parseRulesSource} from '../ops/rules-source.mjs';
import {summarizeClaims, diagnose} from '../ops/oidc-diagnostics.mjs';
import {rulesOptions, validateConsoleEvidence} from '../ops/console-rules.mjs';

const proposed = JSON.parse(readFileSync(new URL('../buzzy-live-pilot/database.rules.json', import.meta.url), 'utf8'));
function context(kind) {
  return {GITHUB_REPOSITORY: REPOSITORY, GITHUB_REPOSITORY_ID: REPOSITORY_ID, GITHUB_REPOSITORY_OWNER_ID: OWNER_ID, GITHUB_EVENT_NAME: 'workflow_dispatch', GITHUB_REF: 'refs/heads/main', GITHUB_WORKFLOW_REF: `${REPOSITORY}/.github/workflows/firebase-${kind}.yml@refs/heads/main`, WIF_PROVIDER: PROVIDER, GOOGLE_SERVICE_ACCOUNT: `buzzy-${kind === 'inventory' ? 'gpt' : 'hosting'}@${PROJECT}.iam.gserviceaccount.com`, GITHUB_SHA: 'a'.repeat(40), REVIEWED_RULES_SHA256: rulesHash(proposed)};
}
function fixture() {
  return {
    project: {projectId: PROJECT, projectNumber: PROJECT_NUMBER, state: 'ACTIVE'},
    billing: {billingEnabled: false, billingAccountName: ''},
    auth: {signIn: {anonymous: {enabled: true}}, authorizedDomains: [`${PROJECT}.firebaseapp.com`], clientSecret: 'DO-NOT-EXPORT', oauthIdpConfigs: ['DO-NOT-EXPORT']},
    database: {databaseUrl: DATABASE_URL + '/', state: 'ACTIVE'},
    site: {defaultUrl: `https://${PROJECT}.web.app`},
    releases: {releases: [{name: 'sites/buzzy-197dc/releases/old', type: 'DEPLOY', releaseTime: '2026-11-01T00:00:00Z', version: {name: 'sites/buzzy-197dc/versions/old', status: 'FINALIZED'}, releaseUser: {email: 'DO-NOT-EXPORT'}}]},
    pilot: null,
    hostingService: {state: 'ENABLED'},
    rules: JSON.stringify(proposed, null, 2),
  };
}
async function collect(data = fixture(), consoleEvidence) {
  const saved = new Map();
  const report = await collectInventory({read: async name => {if (data[name] instanceof Error) throw data[name]; return data[name];}, proposed, save: async (name, body) => saved.set(name, body), consoleEvidence});
  return {report, saved};
}

test('Cloud identity is limited to exact repo IDs, main, manual workflow and dedicated service account', () => {
  for (const kind of ['inventory', 'pilot']) {
    const env = context(kind);
    assert.doesNotThrow(() => assertContext(env, kind));
    for (const key of Object.keys(env).filter(k => k !== 'REVIEWED_RULES_SHA256' || kind === 'pilot')) assert.throws(() => assertContext({...env, [key]: 'untrusted'}, kind), key);
    assert.throws(() => assertContext({...env, GITHUB_EVENT_NAME: 'pull_request'}, kind));
    assert.throws(() => assertContext({...env, GITHUB_REF: 'refs/heads/feature'}, kind));
  }
});

test('OIDC diagnostics retain only allowed public claims and detect an actual subject mismatch', () => {
  const report = summarizeClaims({repository_id: REPOSITORY_ID, repository_owner_id: OWNER_ID, ref: 'refs/heads/main', event_name: 'workflow_dispatch', workflow_ref: context('inventory').GITHUB_WORKFLOW_REF, sub: 'different-format', environment: 'firebase-inventory', email: 'DO-NOT-RETAIN', jwt: 'DO-NOT-RETAIN', access_token: 'DO-NOT-RETAIN'}, 'inventory');
  assert.equal(report.comparisons.sub.matches, false);
  assert.equal(report.comparisons.repository_id.matches, true);
  assert.ok(!JSON.stringify(report).includes('DO-NOT-RETAIN'));
  assert.equal(summarizeClaims({}, 'inventory').claims.sub, '(missing)');
});

test('OIDC diagnostics never export the token and use only the trusted GitHub endpoint and intended audience', async () => {
  const env = {...context('inventory'), ACTIONS_ID_TOKEN_REQUEST_URL: 'https://run-actions-1.actions.githubusercontent.com/test/idtoken?api-version=2', ACTIONS_ID_TOKEN_REQUEST_TOKEN: 'LOCAL-FAKE-REQUEST-SECRET'};
  const claims = {sub: oidcSubject('inventory'), access_token: 'DO-NOT-EXPORT'};
  const jwt = 'header.' + Buffer.from(JSON.stringify(claims)).toString('base64url') + '.signature';
  let called = 0;
  const fetchFixture = async (url, options) => {
    called++;assert.equal(url.searchParams.get('audience'), 'https://iam.googleapis.com/' + PROVIDER);
    assert.equal(options.redirect, 'error');assert.equal(options.headers.Authorization, 'Bearer ' + env.ACTIONS_ID_TOKEN_REQUEST_TOKEN);
    return {ok: true, json: async () => ({value: jwt})};
  };
  const report = await diagnose(env, 'inventory', fetchFixture);
  assert.equal(called, 1);assert.equal(report.comparisons.sub.matches, true);
  assert.ok(!JSON.stringify(report).includes(jwt));assert.ok(!JSON.stringify(report).includes('DO-NOT-EXPORT'));assert.ok(!JSON.stringify(report).includes(env.ACTIONS_ID_TOKEN_REQUEST_TOKEN));
  for (const url of ['http://run-actions-1.actions.githubusercontent.com/idtoken', 'https://attacker.invalid/idtoken', 'https://actions.githubusercontent.com.attacker.invalid/']) await assert.rejects(diagnose({...env, ACTIONS_ID_TOKEN_REQUEST_URL: url}, 'inventory', fetchFixture));
  assert.equal(called, 1);
  await assert.rejects(diagnose(env, 'inventory', async () => {throw new Error(env.ACTIONS_ID_TOKEN_REQUEST_TOKEN);}), error => !error.message.includes(env.ACTIONS_ID_TOKEN_REQUEST_TOKEN));
});

test('Actual run 42115890476 identity matches immutable IDs; legacy or different subjects are rejected', () => {
  const claims = JSON.parse(readFileSync(new URL('./fixtures/oidc-inventory-2026-11-05.json', import.meta.url), 'utf8'));
  const report = summarizeClaims(claims, 'inventory');
  assert.equal(oidcSubject('inventory'), claims.sub);
  assert.ok(Object.values(report.comparisons).every(value => value.matches));
  for (const sub of [`repo:${REPOSITORY}:environment:firebase-inventory`, claims.sub.replace('@1423632612', '@0000000000'), claims.sub.replace('@340718529', '@000000000'), oidcSubject('pilot')]) assert.equal(summarizeClaims({...claims, sub}, 'inventory').comparisons.sub.matches, false);
  assert.throws(() => oidcSubject('unknown'));
});

test('Rules comparison ignores object order but retains every permission/validation expression', () => {
  const a = {rules: {'.read': false, '.write': false, rooms: {$room: {'.validate': 'newData.hasChildren()'}}}};
  const b = {rules: {rooms: {$room: {'.validate': 'newData.hasChildren()'}}, '.write': false, '.read': false}};
  assert.equal(rulesHash(a), rulesHash(b));
  b.rules['.write'] = true;
  assert.notEqual(rulesHash(a), rulesHash(b));
  for (const invalid of [null, {}, {rules: true}, {rules: []}]) assert.throws(() => rulesHash(invalid));
});

test('Inventory transport makes only fixed GET requests and never follows a token-bearing redirect', async () => {
  const calls = [];
  const read = reader('fake-token-for-local-test', async (url, options) => {calls.push({url, options});return {ok: true, json: async () => ({ok: true}), text: async () => JSON.stringify(proposed)};});
  for (const name of Object.keys(RESOURCES)) await read(name);
  assert.equal(calls.length, 9);
  for (const {url, options} of calls) {
    assert.equal(options.method, 'GET');assert.equal(options.redirect, 'error');assert.ok(url.startsWith('https://'));
    assert.ok(!url.endsWith('/.json'));assert.ok(!url.includes('auth='));assert.ok(!Object.hasOwn(options, 'body'));
  }
  assert.equal(calls.filter(c => c.url.startsWith(DATABASE_URL)).length, 1);
  assert.equal(calls.find(c => c.url.startsWith(DATABASE_URL)).url, DATABASE_URL + '/.settings/rules.json');
  await assert.rejects(read('https://attacker.invalid/'));
  assert.equal(calls.length, 9);
});

test('Inventory never exposes tokens or server error bodies; only a missing pilot channel is optional', async () => {
  const token = 'LOCAL-FAKE-SECRET';
  for (const status of [401, 403, 404, 500]) {
    const read = reader(token, async () => ({ok: false, status, json: async () => ({token})}));
    await assert.rejects(read('rules'), error => !error.message.includes(token) && error.message.includes(`HTTP ${status}`));
  }
  const missing = reader(token, async () => ({ok: false, status: 404}));
  assert.equal(await missing('pilot'), null);
  const failed = reader(token, async () => {throw new Error(token);});
  await assert.rejects(failed('rules'), error => !error.message.includes(token));
  assert.throws(() => reader(''));
});

test('API diagnostics distinguish disabled APIs and IAM without exporting response messages or secrets', async () => {
  const secret = 'LOCAL-FAKE-RESPONSE-SECRET';
  const body = {error: {status: 'PERMISSION_DENIED', message: secret, token: secret, details: [{reason: 'SERVICE_DISABLED', metadata: {service: 'cloudbilling.googleapis.com', permission: 'resourcemanager.projects.get', token: secret}}]}};
  const read = reader('LOCAL-FAKE-AUTH', async () => ({ok: false, status: 403, json: async () => body}));
  await assert.rejects(read('billing'), error => {
    assert.deepEqual(error.apiDiagnostic, {resource: 'billing', httpStatus: 403, status: 'PERMISSION_DENIED', reason: 'SERVICE_DISABLED', service: 'cloudbilling.googleapis.com', permission: 'resourcemanager.projects.get'});
    assert.ok(!JSON.stringify(error.apiDiagnostic).includes(secret));assert.ok(!error.message.includes(secret));return true;
  });
  assert.equal(apiFailure('rules', 401, {error: 'Permission denied'}).apiDiagnostic.reason, 'REMOTE_PERMISSION_DENIED');
  const rejected = apiFailure('billing', 403, {error: {status: secret, details: [{reason: secret, metadata: {service: 'attacker.invalid', permission: secret}}]}});
  assert.deepEqual(rejected.apiDiagnostic, {resource: 'billing', httpStatus: 403});
  const data = fixture();data.billing = apiFailure('billing', 403, body);
  const {report} = await collect(data);
  assert.equal(report.rulesBackupSaved, true);assert.equal(report.apiErrors[0].reason, 'SERVICE_DISABLED');
  data.rules = apiFailure('rules', 401, {error: 'Permission denied'});
  assert.equal((await collect(data)).report.rulesBackupSaved, false);
});

test('Inventory backs up exact rules before metadata; filters Auth and release data', async () => {
  const {report, saved} = await collect();
  assert.equal(saved.keys().next().value, 'existing-database.rules.json');
  assert.deepEqual(parseRulesSource(saved.get('existing-database.rules.json')), proposed);
  assert.equal(report.errors.length, 0);
  assert.equal(report.rulesMatch, true);
  assert.equal(report.pilot, null);
  assert.equal(report.billingEnabled, false);
  assert.ok(!JSON.stringify([...saved.values()]).includes('DO-NOT-EXPORT'));
  assert.doesNotThrow(() => assertPilotReady(report, rulesHash(proposed)));
});

test('A failed API or backup read leaves an incomplete report; it cannot authorize deployment', async () => {
  for (const resource of Object.keys(RESOURCES)) {
    const data = fixture();data[resource] = new Error(`${resource}: HTTP 403`);
    const {report, saved} = await collect(data);
    assert.equal(report.errors.length, 1);
    assert.match(report.status, /incomplete/);
    assert.ok(saved.has('inventory.json'));
    if (resource !== 'rules') assert.ok(saved.has('existing-database.rules.json'));
    assert.throws(() => assertPilotReady(report, rulesHash(proposed)), resource);
  }
});

test('Pilot stops for billing, wrong project/DB, disabled Anonymous, missing Hosting or changed rules', async () => {
  const {report} = await collect();
  for (const [key, value] of Object.entries({billingEnabled: true, billingAccountLinked: true, projectId: 'wrong', projectNumber: 'wrong', projectState: 'DELETED', anonymousEnabled: false, databaseUrl: 'https://wrong.invalid', databaseState: 'DISABLED', siteDefaultUrl: 'https://wrong.invalid', hostingApiEnabled: false, currentRulesSha256: 'b'.repeat(64)})) assert.throws(() => assertPilotReady({...report, [key]: value}, rulesHash(proposed)), key);
  assert.throws(() => assertPilotReady(report, 'b'.repeat(64)), 'An old/different reviewed hash must fail');
});

test('A different existing ruleset is retained intact and cannot be silently replaced', async () => {
  const data = fixture();data.rules = '{\n// Preserved old rules\n"rules": {".read": false, ".write": false}\n}';
  const {report, saved} = await collect(data);
  assert.equal(report.rulesMatch, false);
  assert.deepEqual(saved.get('existing-database.rules.json'), data.rules);
  assert.throws(() => assertPilotReady(report, rulesHash(proposed)));
});

test('Rules comments are preserved for rollback; comment markers inside expressions stay untouched', async () => {
  const document = {rules: {'.validate': 'newData.val() == "https://example.org/a/*b*/" && newData.val() != "//"'}};
  const source = '// Existing comment\n' + JSON.stringify(document).replace('{"rules"', '{/* internal comment */"rules"') + '\n// End comment';
  assert.deepEqual(parseRulesSource(source), document);
  assert.equal(rulesHash(parseRulesSource(source)), rulesHash(document));
  assert.throws(() => parseRulesSource('{/* unterminated'));
  assert.throws(() => parseRulesSource('{invalid-json}'));
  const data = fixture();data.rules = '// Original formatted source\n' + JSON.stringify(proposed);
  const {report, saved} = await collect(data);
  assert.equal(saved.get('existing-database.rules.json'), data.rules);
  assert.equal(report.rulesMatch, true);
});

test('Only fresh, same-commit, same-reviewed-rules preflight can authorize the Hosting command', () => {
  const now = Date.now(), env = context('pilot');
  const approval = {verifiedAt: new Date(now).toISOString(), sourceCommit: env.GITHUB_SHA, reviewedRulesSha256: env.REVIEWED_RULES_SHA256, target: 'pilot', databaseWritesAllowed: false, rulesSource: 'api', rulesApiVerified: true};
  assert.doesNotThrow(() => assertApproval(approval, env, now));
  for (const patch of [{verifiedAt: 'invalid'}, {verifiedAt: new Date(now - 120_001).toISOString()}, {verifiedAt: new Date(now + 1).toISOString()}, {sourceCommit: 'b'.repeat(40)}, {reviewedRulesSha256: 'b'.repeat(64)}, {target: 'live'}, {databaseWritesAllowed: true}]) assert.throws(() => assertApproval({...approval, ...patch}, env, now));
});

function evidenceFor(document) {
  const source = JSON.stringify(document, null, 2), baseline = JSON.stringify({rules: {'.read': false, '.write': false}});
  const metadata = {version: 1, projectId: PROJECT, databaseURL: DATABASE_URL, captureMethod: 'user-copied-from-firebase-console', capturedAt: '2026-11-05T23:00:00+01:00', canonicalSha256: rulesHash(document), beforePilotCanonicalSha256: rulesHash(JSON.parse(baseline)), serverApiVerified: false};
  return validateConsoleEvidence(source, metadata, baseline);
}

test('Manual rules source is opt-in and validates project, database, snapshot and preserved baseline', () => {
  assert.equal(rulesOptions({}).source, 'api');
  assert.throws(() => rulesOptions({RULES_SOURCE: 'console'}));
  assert.throws(() => rulesOptions({RULES_SOURCE: 'other', CONSOLE_RULES_CONFIRMED: 'true'}));
  assert.equal(rulesOptions({RULES_SOURCE: 'console', CONSOLE_RULES_CONFIRMED: 'true'}).source, 'console');
  const evidence = evidenceFor(proposed);
  for (const patch of [{projectId: 'wrong'}, {databaseURL: 'https://wrong.invalid'}, {canonicalSha256: 'b'.repeat(64)}, {beforePilotCanonicalSha256: 'b'.repeat(64)}, {serverApiVerified: true}, {captureMethod: 'automatic'}, {capturedAt: 'invalid'}]) assert.throws(() => validateConsoleEvidence(evidence.source, {...evidence.metadata, ...patch}, evidence.baseline));
});

test('Confirmed console backup skips denied rules API, stays visibly manual and cannot deploy closed rules', async () => {
  const data = fixture();data.rules = new Error('Rules endpoint must not be called');
  const closed = {rules: {'.read': false, '.write': false}};
  const {report, saved} = await collect(data, evidenceFor(closed));
  assert.equal(report.errors.length, 0);assert.equal(report.apiReadsAttempted, 8);
  assert.equal(report.rulesSource, 'console-copy-confirmed');assert.equal(report.rulesApiVerified, false);
  assert.equal(report.rulesBackupSaved, true);assert.equal(report.rulesMatch, false);
  assert.match(report.status, /not API verified/);
  assert.deepEqual(JSON.parse(saved.get('existing-database.rules.json')), closed);
  assert.ok(saved.has('before-pilot.rules.json'));assert.ok(saved.has('rules-evidence.json'));
  assert.throws(() => assertPilotReady(report, rulesHash(proposed)), 'Closed baseline must never permit a pilot');
});

test('Manual pilot requires matching reviewed rules, exact evidence and repeated operator confirmation', async () => {
  const {report} = await collect(fixture(), evidenceFor(proposed));
  assert.doesNotThrow(() => assertPilotReady(report, rulesHash(proposed)));
  for (const patch of [{operatorConfirmed: false}, {canonicalSha256: 'b'.repeat(64)}, {projectId: 'wrong'}, {databaseURL: 'wrong'}, {serverApiVerified: true}]) assert.throws(() => assertPilotReady({...report, consoleRulesEvidence: {...report.consoleRulesEvidence, ...patch}}, rulesHash(proposed)));
  assert.throws(() => assertPilotReady({...report, rulesApiVerified: true}, rulesHash(proposed)));
  const now = Date.now(), env = {...context('pilot'), RULES_SOURCE: 'console', CONSOLE_RULES_CONFIRMED: 'true'};
  const approval = {verifiedAt: new Date(now).toISOString(), sourceCommit: env.GITHUB_SHA, reviewedRulesSha256: env.REVIEWED_RULES_SHA256, target: 'pilot', databaseWritesAllowed: false, rulesSource: 'console-copy-confirmed', rulesApiVerified: false, consoleSnapshotSha256: env.REVIEWED_RULES_SHA256};
  assert.doesNotThrow(() => assertApproval(approval, env, now));
  assert.throws(() => assertApproval(approval, {...env, CONSOLE_RULES_CONFIRMED: 'false'}, now));
  assert.throws(() => assertApproval({...approval, consoleSnapshotSha256: 'b'.repeat(64)}, env, now));
  assert.throws(() => assertApproval(approval, {...env, RULES_SOURCE: 'api'}, now));
});

test('Hosting targets are explicit and cannot deploy database, Functions or Auth configuration', () => {
  const source = JSON.parse(readFileSync(new URL('../buzzy-live-pilot/firebase.pilot.json', import.meta.url), 'utf8'));
  const config = hostingOnlyConfig(source), args = pilotArguments();
  assert.deepEqual(Object.keys(config), ['hosting']);
  assert.equal(config.hosting.site, PROJECT);
  assert.equal(args[0], 'hosting:channel:deploy');assert.equal(args[1], 'pilot');assert.ok(args.includes('--no-authorized-domains'));
  assert.equal(args[args.indexOf('--expires') + 1], '1d');
  assert.ok(!args.includes('deploy'));assert.ok(!args.includes('live'));assert.ok(!args.includes('--force'));
  assert.deepEqual(hostingArguments('pilot'),args);
  assert.deepEqual(hostingArguments('live'),['deploy','--only','hosting','--project',PROJECT,'--config','firebase.hosting-ci.json','--non-interactive','--json']);
  for(const target of ['', 'production', 'database', '../live'])assert.throws(()=>hostingArguments(target));
  assert.deepEqual(config.hosting.headers, source.hosting.headers);
  for (const hosting of [{...source.hosting, public: '..'}, {...source.hosting, rewrites: []}, {...source.hosting, frameworksBackend: {}}]) assert.throws(() => hostingOnlyConfig({hosting}));
});

test('Whole pilot preflight writes a raw backup and Hosting-only config, with zero mutations or credential exports', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'buzzy-web-preflight-'));
  const initialCwd = process.cwd(), initialFetch = globalThis.fetch;
  const config = JSON.parse(readFileSync(new URL('../buzzy-live-pilot/firebase.pilot.json', import.meta.url), 'utf8'));
  const data = fixture(), token = 'LOCAL-FAKE-OAUTH-TOKEN', requests = [];
  try {
    await mkdir(join(directory, 'buzzy-live-pilot'));
    await writeFile(join(directory, 'buzzy-live-pilot/database.rules.json'), JSON.stringify(proposed));
    await writeFile(join(directory, 'buzzy-live-pilot/firebase.pilot.json'), JSON.stringify(config));
    globalThis.fetch = async (url, options) => {
      requests.push(options.method);
      assert.equal(options.headers.Authorization, `Bearer ${token}`);
      const key = Object.keys(RESOURCES).find(name => RESOURCES[name] === url);
      assert.ok(key);
      if (key === 'pilot') return {ok: false, status: 404};
      return {ok: true, status: 200, text: async () => data[key], json: async () => data[key]};
    };
    process.chdir(directory);
    await main('pilot', {...context('pilot'), GOOGLE_OAUTH_ACCESS_TOKEN: token});
    assert.deepEqual(requests, Array(9).fill('GET'));
    const backup = await readFile('ci-reports/pilot/existing-database.rules.json', 'utf8');
    assert.equal(backup, data.rules);
    const generated = JSON.parse(await readFile('buzzy-live-pilot/firebase.hosting-ci.json', 'utf8'));
    assert.deepEqual(Object.keys(generated), ['hosting']);
    assert.equal(generated.hosting.site, PROJECT);
    for (const name of ['inventory.json', 'approval.json', 'existing-database.rules.json', 'proposed-database.rules.json']) {
      const output = await readFile(`ci-reports/pilot/${name}`, 'utf8');
      assert.ok(!output.includes(token));assert.ok(!output.includes('DO-NOT-EXPORT'));
    }
  } finally {
    process.chdir(initialCwd);globalThis.fetch = initialFetch;await rm(directory, {recursive: true, force: true});
  }
});

test('Whole console workflow preserves the supplied closed backup, makes eight GETs and cannot approve a pilot', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'buzzy-console-preflight-'));
  const initialCwd = process.cwd(), initialFetch = globalThis.fetch;
  const closed = {rules: {'.read': false, '.write': false}}, evidence = evidenceFor(closed), data = fixture(), requests = [];
  try {
    await mkdir(join(directory, 'buzzy-live-pilot'));
    await mkdir(join(directory, 'ops/rules-evidence'), {recursive: true});
    await writeFile(join(directory, 'buzzy-live-pilot/database.rules.json'), JSON.stringify(proposed));
    await writeFile(join(directory, 'ops/rules-evidence/console-current.rules.json'), evidence.source);
    await writeFile(join(directory, 'ops/rules-evidence/console-snapshot.json'), JSON.stringify(evidence.metadata));
    await writeFile(join(directory, 'ops/rules-evidence/before-pilot.rules.json'), evidence.baseline);
    globalThis.fetch = async (url, options) => {
      requests.push(url);assert.equal(options.method, 'GET');assert.ok(!url.startsWith(DATABASE_URL));
      const key = Object.keys(RESOURCES).find(name => RESOURCES[name] === url);assert.ok(key);
      return key === 'pilot' ? {ok: false, status: 404} : {ok: true, json: async () => data[key]};
    };
    process.chdir(directory);
    const env = {...context('inventory'), RULES_SOURCE: 'console', CONSOLE_RULES_CONFIRMED: 'true', GOOGLE_OAUTH_ACCESS_TOKEN: 'LOCAL-FAKE-OAUTH'};
    const report = await main('inventory', env);
    assert.equal(requests.length, 8);assert.equal(report.rulesApiVerified, false);assert.equal(report.rulesMatch, false);
    assert.equal(await readFile('ci-reports/inventory/existing-database.rules.json', 'utf8'), evidence.source);
    assert.equal(await readFile('ci-reports/inventory/before-pilot.rules.json', 'utf8'), evidence.baseline);
    const {operatorConfirmed, serverApiVerified} = JSON.parse(await readFile('ci-reports/inventory/rules-evidence.json', 'utf8'));
    assert.equal(operatorConfirmed, true);assert.equal(serverApiVerified, false);
    await assert.rejects(main('pilot', {...env, ...context('pilot')}), /cloud rules do not match/);
    await assert.rejects(readFile('ci-reports/pilot/approval.json'));
  } finally {
    process.chdir(initialCwd);globalThis.fetch = initialFetch;await rm(directory, {recursive: true, force: true});
  }
});
