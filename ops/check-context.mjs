import {assertContext} from './policy.mjs';
try {
  assertContext(process.env, process.argv[2]);
  console.log('Repository, workflow, branch and non-secret identity selectors verified.');
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
