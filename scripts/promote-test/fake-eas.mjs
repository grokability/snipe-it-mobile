// Stands in for `npx --yes eas-cli@latest ...` in the promote tests. Handles the two commands the
// script runs, `whoami` and `workflow:runs --workflow <file> --limit <n> --json`, and fails loudly
// on anything else.
import { readState, writeState } from './state.mjs';

const args = process.argv.slice(2);
const state = readState();

if (args.includes('whoami')) {
    process.exit(state.easLoggedIn ? 0 : 1);
}

if (args.includes('workflow:runs')) {
    const workflowFileName = args[args.indexOf('--workflow') + 1];
    const limit = Number(args[args.indexOf('--limit') + 1]);
    const listedRuns = state.runs
        .filter((run) => run.workflowFileName === workflowFileName)
        .reverse()
        .slice(0, limit)
        .map((run) => {
            const status = run.statuses[Math.min(run.timesListed, run.statuses.length - 1)];
            run.timesListed += 1;
            return { id: run.id, workflowFileName, status, gitCommitHash: run.gitCommitHash, startedAt: run.startedAt };
        });
    writeState(state);
    console.log(JSON.stringify(listedRuns));
    process.exit(0);
}

console.error(`fake eas: unexpected command: ${args.join(' ')}`);
process.exit(2);
