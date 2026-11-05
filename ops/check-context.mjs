import {assertContext} from './policy.mjs';
import {rulesOptions} from './console-rules.mjs';
try {
  assertContext(process.env, process.argv[2]);
  rulesOptions(process.env);
  console.log('Repository, workflow, branch and non-secret identity selectors verified.');
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
