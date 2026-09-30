// post-receive hook of the fixture's origin. A push to a track branch starts that track's EAS run,
// as each workflow's `on: push` does, with the statuses the test set in state.onPush. A null entry
// means the push starts no run.
import { readFileSync } from 'node:fs';
import { addRun, readState, writeState } from './state.mjs';

const WORKFLOW_FOR_BRANCH = { develop: 'develop.yml', testflight: 'testflight.yml', main: 'main.yml' };

const state = readState();
for (const line of readFileSync(0, 'utf8').trim().split('\n')) {
    const [, newCommitHash, refName] = line.split(' ');
    const branch = refName.replace('refs/heads/', '');
    const statuses = state.onPush[branch];
    if (WORKFLOW_FOR_BRANCH[branch] && statuses) addRun(state, WORKFLOW_FOR_BRANCH[branch], newCommitHash, statuses);
}
writeState(state);
