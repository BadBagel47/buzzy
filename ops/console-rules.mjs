import {readFile} from 'node:fs/promises';
import {PROJECT, DATABASE_URL, rulesHash} from './policy.mjs';
import {parseRulesSource} from './rules-source.mjs';

export function rulesOptions(env) {
  const source = env.RULES_SOURCE || 'api';
  if (!['api', 'console'].includes(source)) throw new Error('Unexpected rules source');
  if (source === 'console' && env.CONSOLE_RULES_CONFIRMED !== 'true') throw new Error('Console snapshot requires an explicit current-console confirmation');
  return {source};
}

export function validateConsoleEvidence(source, metadata, baseline) {
  const sha256 = rulesHash(parseRulesSource(source));
  if (metadata?.version !== 1 || metadata.projectId !== PROJECT || metadata.databaseURL !== DATABASE_URL || metadata.captureMethod !== 'user-copied-from-firebase-console' || metadata.serverApiVerified !== false || !Number.isFinite(Date.parse(metadata.capturedAt))) throw new Error('Unexpected console rules evidence identity/source');
  if (metadata.canonicalSha256 !== sha256 || metadata.beforePilotCanonicalSha256 !== rulesHash(parseRulesSource(baseline))) throw new Error('Console snapshot or preserved baseline hash mismatch');
  return {source, metadata, baseline, sha256};
}

export async function loadConsoleEvidence(env) {
  if (rulesOptions(env).source === 'api') return undefined;
  const [source, metadata, baseline] = await Promise.all([
    readFile('ops/rules-evidence/console-current.rules.json', 'utf8'),
    readFile('ops/rules-evidence/console-snapshot.json', 'utf8'),
    readFile('ops/rules-evidence/before-pilot.rules.json', 'utf8'),
  ]);
  return validateConsoleEvidence(source, JSON.parse(metadata), baseline);
}
