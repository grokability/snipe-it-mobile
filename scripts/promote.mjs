// Promotes a commit that already passed one track to the next, by fast-forwarding the next
// track's branch to it. The commit, its update bundle and its release number stay the same.
//
//   npm run promote beta [sha]          # develop → testflight
//   npm run promote production [sha]    # testflight → main
//   npm run promote beta -- --dry-run   # every check; prints what would be pushed and published
//   npm run promote beta -- --yes       # skips the confirmation prompt
//
// Flags need the `--` separator: without it npm takes --dry-run and --yes as its own options.
//
// Without a sha, the tip of the source branch is promoted. The script refuses unless the
// source track's EAS run for that commit succeeded (it waits while that run is in progress),
// the push is a fast-forward, and no other run is in progress on either track. After the push
// it waits for the destination run, and when that succeeds it publishes the GitHub Release
// v<release>: a prerelease for beta, turned into the Latest release on production.
//
// It runs on your machine with your own logins: git push rights to the destination branch (the
// "release-branches: admins push" ruleset), `gh auth login`, and `eas login`. No GitHub token is
// stored in EAS for this. Running it again after an interruption is safe: an already promoted
// commit is not pushed again, and an existing release is left as it is.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createInterface } from 'node:readline/promises';

const TRACKS = {
    beta: { source: 'develop', sourceWorkflow: 'develop.yml', destination: 'testflight', destinationWorkflow: 'testflight.yml' },
    production: { source: 'testflight', sourceWorkflow: 'testflight.yml', destination: 'main', destinationWorkflow: 'main.yml' },
};
const PENDING_STATUSES = new Set(['NEW', 'IN_PROGRESS', 'WAITING']);
const POLL_INTERVAL_MS = 20_000;
const RUN_START_TIMEOUT_MS = 3 * 60_000;
const RUN_URL = 'https://expo.dev/accounts/grokability/projects/snipe-it-mobile/workflows/';
const GIST_URL = 'https://gist.github.com/spencerrlongg/04a4aef25f4763d3a9b7771be6385e32';

function fail(message) {
    console.error(`\n✖ ${message}`);
    process.exit(1);
}

function sleep(milliseconds) {
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function runGit(args) {
    return execFileSync('git', args, { encoding: 'utf8' }).trim();
}

function isAncestor(ancestor, descendant) {
    try {
        execFileSync('git', ['merge-base', '--is-ancestor', ancestor, descendant]);
        return true;
    } catch {
        return false;
    }
}

function runGh(args) {
    return execFileSync('gh', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

function runEas(args) {
    const output = execFileSync('npx', ['--yes', 'eas-cli@latest', ...args, '--json'], {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'inherit'],
    });
    return JSON.parse(output);
}

function listRuns(workflowFile) {
    return runEas(['workflow:runs', '--workflow', workflowFile, '--limit', '50']);
}

function runsForCommit(workflowFile, commitHash) {
    return listRuns(workflowFile)
        .filter((run) => run.gitCommitHash === commitHash)
        .sort((first, second) => (second.startedAt ?? '9999').localeCompare(first.startedAt ?? '9999'));
}

function describeRun(run) {
    return `${run.workflowFileName} ${run.status} ${RUN_URL}${run.id}`;
}

async function waitForRunToFinish(workflowFile, runId) {
    let lastStatus = null;
    while (true) {
        const run = listRuns(workflowFile).find((candidate) => candidate.id === runId);
        if (!run) fail(`${workflowFile} run ${runId} is no longer listed by EAS.`);
        if (!PENDING_STATUSES.has(run.status)) return run;
        if (run.status !== lastStatus) {
            console.log(`  waiting: ${describeRun(run)}`);
            lastStatus = run.status;
        }
        await sleep(POLL_INTERVAL_MS);
    }
}

async function waitForNewRun(workflowFile, commitHash, knownRunIds) {
    const deadline = Date.now() + RUN_START_TIMEOUT_MS;
    while (Date.now() < deadline) {
        const newRun = runsForCommit(workflowFile, commitHash).find((run) => !knownRunIds.has(run.id));
        if (newRun) return newRun;
        await sleep(POLL_INTERVAL_MS);
    }
    return null;
}

// The same number the release_info job computes, read from the promoted commit itself.
function releaseNumberFor(commitHash) {
    // A shallow clone counts only the commits it has, which gives a lower number that can match an
    // older release. release_info refuses a shallow checkout for the same reason.
    if (runGit(['rev-parse', '--is-shallow-repository']) === 'true') {
        fail('This clone is shallow, so the release number would be wrong. Run `git fetch --unshallow` first.');
    }
    const appVersion = JSON.parse(runGit(['show', `${commitHash}:app.json`])).expo.version;
    const majorMinor = appVersion.split('.').slice(0, 2).join('.');
    return `${majorMinor}.${runGit(['rev-list', '--count', '--first-parent', commitHash])}`;
}

function releaseExists(tag) {
    try {
        runGh(['release', 'view', tag, '--json', 'tagName']);
        return true;
    } catch {
        return false;
    }
}

function latestReleaseTag({ excludePrereleases }) {
    const args = ['release', 'list', '--exclude-drafts', '--limit', '1', '--json', 'tagName', '--jq', '.[0].tagName // empty'];
    if (excludePrereleases) args.push('--exclude-pre-releases');
    return runGh(args) || null;
}

// Beta: a prerelease whose notes list the PRs merged since the previous beta release.
function publishBetaRelease(tag, commitHash) {
    if (releaseExists(tag)) {
        console.log(`Release ${tag} already exists; left as it is.`);
        return;
    }
    const previousTag = latestReleaseTag({ excludePrereleases: false });
    const args = ['release', 'create', tag, '--target', commitHash, '--prerelease', '--generate-notes'];
    if (previousTag) args.push('--notes-start-tag', previousTag);
    console.log(`Published ${runGh(args)}`);
}

// Production: the same commit, so the same tag. The beta prerelease becomes the Latest release,
// with notes regenerated from the previous production release so they cover every beta between.
function publishProductionRelease(tag, commitHash) {
    const previousTag = latestReleaseTag({ excludePrereleases: true });
    if (previousTag === tag) {
        console.log(`Release ${tag} is already the production release; left as it is.`);
        return;
    }
    const notesArgs = ['api', 'repos/{owner}/{repo}/releases/generate-notes', '-f', `tag_name=${tag}`, '-f', `target_commitish=${commitHash}`, '--jq', '.body'];
    if (previousTag) notesArgs.push('-f', `previous_tag_name=${previousTag}`);
    const notesDirectory = mkdtempSync(join(tmpdir(), 'promote-'));
    const notesFile = join(notesDirectory, 'notes.md');
    try {
        writeFileSync(notesFile, runGh(notesArgs));
        if (releaseExists(tag)) {
            runGh(['release', 'edit', tag, '--prerelease=false', '--latest', '--notes-file', notesFile]);
            console.log(`Release ${tag} is now the Latest release.`);
        } else {
            console.log(`Published ${runGh(['release', 'create', tag, '--target', commitHash, '--latest', '--title', tag, '--notes-file', notesFile])}`);
        }
    } finally {
        rmSync(notesDirectory, { recursive: true, force: true });
    }
}

async function confirm(question) {
    const prompt = createInterface({ input: process.stdin, output: process.stdout });
    const answer = await prompt.question(`${question} [y/N] `);
    prompt.close();
    return answer.trim().toLowerCase() === 'y';
}

async function main() {
    const positionalArgs = process.argv.slice(2).filter((arg) => !arg.startsWith('--'));
    const skipConfirmation = process.argv.includes('--yes');
    // npm sets npm_config_dry_run when it swallows a --dry-run given without `--`. Honoring it
    // keeps that mistake from publishing a release the caller asked not to publish.
    const isDryRun = process.argv.includes('--dry-run') || process.env.npm_config_dry_run === 'true';
    const [trackName, requestedCommit] = positionalArgs;
    const track = TRACKS[trackName];
    if (!track) fail('Usage: npm run promote <beta|production> [sha] -- [--yes] [--dry-run]');

    // Checked before anything is pushed, so a missing login cannot leave a promotion without its release.
    try {
        runGh(['auth', 'status']);
    } catch {
        fail('gh is not logged in. Run `gh auth login` first.');
    }
    try {
        // whoami has no --json output; its exit status is the answer.
        execFileSync('npx', ['--yes', 'eas-cli@latest', 'whoami'], { stdio: 'ignore' });
    } catch {
        fail('eas is not logged in. Run `npx eas-cli@latest login` first.');
    }

    runGit(['fetch', 'origin', '--quiet']);
    const sourceRef = `origin/${track.source}`;
    const destinationRef = `origin/${track.destination}`;
    let commitHash;
    try {
        commitHash = runGit(['rev-parse', '--verify', `${requestedCommit ?? sourceRef}^{commit}`]);
    } catch {
        fail(`${requestedCommit} is not a commit in this repository.`);
    }
    const shortHash = commitHash.slice(0, 7);

    if (!isAncestor(commitHash, sourceRef)) {
        fail(`${shortHash} is not on ${track.source}. Only commits that passed ${track.source} can be promoted.`);
    }
    const destinationTip = runGit(['rev-parse', destinationRef]);
    const alreadyPromoted = destinationTip === commitHash;
    if (!alreadyPromoted && isAncestor(commitHash, destinationRef)) {
        fail(`${track.destination} already contains ${shortHash}; it is ahead of the commit you asked for.`);
    }
    if (!alreadyPromoted && !isAncestor(destinationRef, commitHash)) {
        fail(`${track.destination} is not an ancestor of ${shortHash}, so this would not be a fast-forward. See the hotfix path in the README.`);
    }

    const releaseNumber = releaseNumberFor(commitHash);
    const tag = `v${releaseNumber}`;
    console.log(`Promoting ${shortHash} (${releaseNumber}) from ${track.source} to ${track.destination}.`);

    const sourceRun = runsForCommit(track.sourceWorkflow, commitHash)[0];
    if (!sourceRun) {
        fail(`${track.sourceWorkflow} never ran on ${shortHash}. Only a commit with its own successful ${track.source} run can be promoted.`);
    }
    const finishedSourceRun = await waitForRunToFinish(track.sourceWorkflow, sourceRun.id);
    if (finishedSourceRun.status !== 'SUCCESS') {
        fail(`The ${track.source} run for ${shortHash} did not succeed: ${describeRun(finishedSourceRun)}`);
    }
    console.log(`✓ ${describeRun(finishedSourceRun)}`);

    let destinationRun;
    if (alreadyPromoted) {
        console.log(`${track.destination} is already at ${shortHash}; nothing to push.`);
        destinationRun = runsForCommit(track.destinationWorkflow, commitHash)[0];
        if (!destinationRun) fail(`No ${track.destinationWorkflow} run exists for ${shortHash}.`);
    } else {
        const runningOnDestination = listRuns(track.destinationWorkflow).find((run) => PENDING_STATUSES.has(run.status));
        if (runningOnDestination) {
            fail(`A ${track.destination} run is still going. Promote once it finishes: ${describeRun(runningOnDestination)}`);
        }
        // The promoted commit's own run has finished by now, so a pending one is another run.
        // Both tracks submit to Google Play, and two runs doing that at once race for one edit.
        const runningOnSource = listRuns(track.sourceWorkflow).find((run) => PENDING_STATUSES.has(run.status));
        if (runningOnSource) {
            fail(`Another ${track.source} run is still going. Promote once it finishes: ${describeRun(runningOnSource)}`);
        }

        console.log(`\nWhat ${track.destination} gains:`);
        console.log(runGit(['log', '--first-parent', '--format=  %h %s', `${destinationRef}..${commitHash}`]));
        console.log('');
        if (isDryRun) {
            console.log(`Dry run: would push ${shortHash} to ${track.destination}, wait for ${track.destinationWorkflow}, then publish ${tag}.`);
            return;
        }
        if (!skipConfirmation && !(await confirm(`Push ${shortHash} to ${track.destination}?`))) {
            fail('Not pushed.');
        }

        const knownRunIds = new Set(runsForCommit(track.destinationWorkflow, commitHash).map((run) => run.id));
        execFileSync('git', ['push', 'origin', `${commitHash}:refs/heads/${track.destination}`], { stdio: 'inherit' });
        destinationRun = await waitForNewRun(track.destinationWorkflow, commitHash, knownRunIds);
        if (!destinationRun) {
            fail(`Pushed, but no ${track.destinationWorkflow} run started within ${RUN_START_TIMEOUT_MS / 60_000} minutes. No release was published.`);
        }
    }

    const finishedDestinationRun = await waitForRunToFinish(track.destinationWorkflow, destinationRun.id);
    if (finishedDestinationRun.status !== 'SUCCESS') {
        fail(`The ${track.destination} run did not succeed, so no release was published: ${describeRun(finishedDestinationRun)}`);
    }
    console.log(`✓ ${describeRun(finishedDestinationRun)}`);

    if (isDryRun) {
        console.log(`Dry run: would publish ${tag} (${trackName === 'beta' ? 'prerelease' : 'Latest release'}).`);
        return;
    }

    if (trackName === 'beta') {
        publishBetaRelease(tag, commitHash);
    } else {
        publishProductionRelease(tag, commitHash);
    }
    console.log(`Deployments: ${GIST_URL}`);
}

await main();
