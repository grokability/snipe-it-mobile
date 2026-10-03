// A throwaway world for one promote test: a bare repo standing in for origin, with develop,
// testflight and main; a clone of it that the script runs in; and fake `gh` and `npx` (EAS)
// commands first on PATH. Nothing here reaches GitHub, EAS or this repository.
//
// History: first ← second (a merge) ← third on develop (releases 1.0.1, 1.0.2, 1.0.3). testflight and main
// start at first. develop.yml succeeded on all three, and testflight.yml and main.yml on first.
// A push to testflight or main starts a run that is still going for two listings, then succeeds.
import { execFileSync, spawn } from 'node:child_process';
import { chmodSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { addRun, readState, writeState } from './state.mjs';

const testDirectory = fileURLToPath(new URL('.', import.meta.url));
const promoteScript = fileURLToPath(new URL('../promote.mjs', import.meta.url));
const RUN_THAT_SUCCEEDS = ['IN_PROGRESS', 'IN_PROGRESS', 'SUCCESS'];

function writeExecutable(path, contents) {
    writeFileSync(path, contents);
    chmodSync(path, 0o755);
}

// `shallow` clones the work copy with --depth 1: 'all-branches' as a CI checkout usually is, or
// 'single-branch' as a plain `git clone --depth 1` is.
export function createFixture({ shallow = null } = {}) {
    const root = mkdtempSync(join(tmpdir(), 'promote-test-'));
    const originDirectory = join(root, 'origin.git');
    const seedDirectory = join(root, 'seed');
    const workDirectory = join(root, 'work');
    const binDirectory = join(root, 'bin');
    const statePath = join(root, 'state.json');
    const emptyGitConfig = join(root, 'gitconfig');
    writeFileSync(emptyGitConfig, '');

    const env = {
        ...process.env,
        PATH: `${binDirectory}:${process.env.PATH}`,
        // The developer's own git config (signing, hooks, default branch) stays out of the fixture.
        GIT_CONFIG_GLOBAL: emptyGitConfig,
        GIT_CONFIG_NOSYSTEM: '1',
        GIT_AUTHOR_NAME: 'Promote Test',
        GIT_AUTHOR_EMAIL: 'promote-test@example.com',
        GIT_COMMITTER_NAME: 'Promote Test',
        GIT_COMMITTER_EMAIL: 'promote-test@example.com',
        PROMOTE_TEST_STATE: statePath,
        NODE_OPTIONS: `--import=${pathToFileURL(join(testDirectory, 'fast-timers.mjs')).href}`,
    };

    const git = (cwd, ...args) => execFileSync('git', args, { cwd, env, encoding: 'utf8' }).trim();
    const gitWithoutHook = (cwd, ...args) =>
        execFileSync('git', args, { cwd, env: { ...env, PROMOTE_TEST_SKIP_HOOK: '1' }, encoding: 'utf8' }).trim();
    const commitInSeed = (message) => {
        writeFileSync(join(seedDirectory, 'history.txt'), `${message}\n`, { flag: 'a' });
        git(seedDirectory, 'add', '.');
        git(seedDirectory, 'commit', '--quiet', '--message', message);
        return git(seedDirectory, 'rev-parse', 'HEAD');
    };

    git(root, 'init', '--quiet', '--bare', '--initial-branch=develop', originDirectory);
    git(root, 'init', '--quiet', '--initial-branch=develop', seedDirectory);
    git(seedDirectory, 'remote', 'add', 'origin', originDirectory);
    writeFileSync(join(seedDirectory, 'app.json'), JSON.stringify({ expo: { version: '1.0.0' } }));
    const first = commitInSeed('First');
    git(seedDirectory, 'push', '--quiet', 'origin', 'HEAD:refs/heads/develop', 'HEAD:refs/heads/testflight', 'HEAD:refs/heads/main');
    // second merges a PR branch, as develop's history does, so the first-parent count (2) differs
    // from the full commit count (3).
    git(seedDirectory, 'checkout', '--quiet', '-b', 'pull-request');
    commitInSeed('Work in a pull request');
    git(seedDirectory, 'checkout', '--quiet', 'develop');
    git(seedDirectory, 'merge', '--quiet', '--no-ff', '--message', 'Second', 'pull-request');
    const second = git(seedDirectory, 'rev-parse', 'HEAD');
    const third = commitInSeed('Third');
    git(seedDirectory, 'push', '--quiet', 'origin', 'HEAD:refs/heads/develop');

    const shallowArgs = { 'all-branches': ['--depth', '1', '--no-single-branch'], 'single-branch': ['--depth', '1'] }[shallow] ?? [];
    git(root, 'clone', '--quiet', ...shallowArgs, pathToFileURL(originDirectory).href, workDirectory);

    writeExecutable(
        join(originDirectory, 'hooks', 'post-receive'),
        `#!/bin/sh\n[ -n "$PROMOTE_TEST_SKIP_HOOK" ] && exit 0\nexec node "${join(testDirectory, 'push-hook.mjs')}"\n`,
    );
    mkdirSync(binDirectory);
    writeExecutable(join(binDirectory, 'gh'), `#!/bin/sh\nexec node "${join(testDirectory, 'fake-gh.mjs')}" "$@"\n`);
    writeExecutable(join(binDirectory, 'npx'), `#!/bin/sh\nexec node "${join(testDirectory, 'fake-eas.mjs')}" "$@"\n`);

    const resolvedCommands = execFileSync('sh', ['-c', 'command -v gh; command -v npx'], { env, encoding: 'utf8' });
    if (resolvedCommands !== `${join(binDirectory, 'gh')}\n${join(binDirectory, 'npx')}\n`) {
        throw new Error(`The fake gh and npx are not first on PATH:\n${resolvedCommands}`);
    }

    const state = {
        nextRunNumber: 1,
        runs: [],
        onPush: { testflight: RUN_THAT_SUCCEEDS, main: RUN_THAT_SUCCEEDS },
        // The real repository has this draft; the script must never treat it as a previous release.
        releases: [{ tagName: 'v1.0.0', target: first, isDraft: true, isPrerelease: false, isLatest: false, notes: '', createdOrder: 0 }],
        ghCalls: [],
        ghLoggedIn: true,
        easLoggedIn: true,
    };
    for (const commitHash of [first, second, third]) addRun(state, 'develop.yml', commitHash, ['SUCCESS']);
    addRun(state, 'testflight.yml', first, ['SUCCESS']);
    addRun(state, 'main.yml', first, ['SUCCESS']);
    writeState(state, statePath);

    return {
        commits: { first, second, third },
        workDirectory,

        readState: () => readState(statePath),
        updateState(change) {
            const currentState = readState(statePath);
            change(currentState);
            writeState(currentState, statePath);
        },
        addRun(workflowFileName, commitHash, statuses) {
            this.updateState((currentState) => addRun(currentState, workflowFileName, commitHash, statuses));
        },

        // Arranges origin without starting any run, the way a test needs it before the script runs.
        setBranch(branch, commitHash) {
            gitWithoutHook(seedDirectory, 'push', '--quiet', '--force', 'origin', `${commitHash}:refs/heads/${branch}`);
        },
        commitOnTopOf(parentHash, message) {
            git(seedDirectory, 'checkout', '--quiet', '--detach', parentHash);
            return commitInSeed(message);
        },
        tip: (branch) => git(originDirectory, 'rev-parse', `refs/heads/${branch}`),

        releaseWrites() {
            return readState(statePath).ghCalls.filter(([command, subcommand]) =>
                command === 'release' && (subcommand === 'create' || subcommand === 'edit'),
            );
        },
        release: (tagName) => readState(statePath).releases.find((candidate) => candidate.tagName === tagName),

        // Runs `node promote.mjs <args>` in the work clone, answering the confirmation prompt with `input`.
        // Asynchronous so the test runner's event loop stays free to print each result as it comes.
        promote(args, { input = 'y\n' } = {}) {
            return new Promise((resolve, reject) => {
                const child = spawn('node', [promoteScript, ...args], { cwd: workDirectory, env });
                let stdout = '';
                let stderr = '';
                child.stdout.setEncoding('utf8').on('data', (chunk) => (stdout += chunk));
                child.stderr.setEncoding('utf8').on('data', (chunk) => (stderr += chunk));
                child.on('error', reject);
                child.on('close', (exitCode) => resolve({ exitCode, stdout, stderr, output: stdout + stderr }));
                // A run that refuses early exits without reading stdin; writing to it then fails harmlessly.
                child.stdin.on('error', () => {});
                child.stdin.end(input);
            });
        },

        remove: () => rmSync(root, { recursive: true, force: true }),
    };
}
