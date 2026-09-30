// The fake EAS and GitHub keep their runs and releases in one JSON file, so the fakes, the push
// hook and the tests all see the same state. Its path comes from PROMOTE_TEST_STATE.
import { readFileSync, writeFileSync } from 'node:fs';

export function readState(statePath = process.env.PROMOTE_TEST_STATE) {
    return JSON.parse(readFileSync(statePath, 'utf8'));
}

export function writeState(state, statePath = process.env.PROMOTE_TEST_STATE) {
    writeFileSync(statePath, JSON.stringify(state, null, 2));
}

// `statuses` is what the run reports on successive listings: ['IN_PROGRESS', 'SUCCESS'] is still
// going the first time the script lists it and finished every time after.
export function addRun(state, workflowFileName, gitCommitHash, statuses) {
    const runNumber = state.nextRunNumber++;
    state.runs.push({
        id: `run-${runNumber}`,
        workflowFileName,
        gitCommitHash,
        statuses,
        timesListed: 0,
        startedAt: new Date(Date.UTC(2026, 8, 30, 12) + runNumber * 60_000).toISOString(),
    });
}
