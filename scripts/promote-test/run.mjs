// Runs the promote tests with a spinner on the test in progress (see reporter.mjs).
//
//   node scripts/promote-test/run.mjs
//   node scripts/promote-test/run.mjs --test-name-pattern=shallow    # any `node --test` flag works
//
// `node --test scripts/promote-test/promote.test.mjs` runs the same tests with Node's plain output.
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const reporter = fileURLToPath(new URL('./reporter.mjs', import.meta.url));
const testFile = fileURLToPath(new URL('./promote.test.mjs', import.meta.url));

const result = spawnSync(process.execPath, ['--test', `--test-reporter=${reporter}`, ...process.argv.slice(2), testFile], {
    stdio: 'inherit',
});
process.exit(result.status ?? 1);
