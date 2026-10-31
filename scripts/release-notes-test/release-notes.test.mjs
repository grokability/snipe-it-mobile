// Runs scripts/release-notes.mjs against throwaway repos whose merges look like GitHub's: subject
// "Merge pull request #N from grokability/<branch>", PR title as the body.
//
//   node --test scripts/release-notes-test/release-notes.test.mjs
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const releaseNotesScript = fileURLToPath(new URL('../release-notes.mjs', import.meta.url));

function createRepo(testContext) {
    const root = mkdtempSync(join(tmpdir(), 'release-notes-test-'));
    testContext.after(() => rmSync(root, { recursive: true, force: true }));
    const emptyGitConfig = join(root, 'gitconfig');
    writeFileSync(emptyGitConfig, '');
    const repoDirectory = join(root, 'repo');
    const env = {
        ...process.env,
        // The developer's own git config (signing, hooks, default branch) stays out of the repo.
        GIT_CONFIG_GLOBAL: emptyGitConfig,
        GIT_CONFIG_NOSYSTEM: '1',
        GIT_AUTHOR_NAME: 'Release Notes Test',
        GIT_AUTHOR_EMAIL: 'release-notes-test@example.com',
        GIT_COMMITTER_NAME: 'Release Notes Test',
        GIT_COMMITTER_EMAIL: 'release-notes-test@example.com',
    };
    const git = (...args) => execFileSync('git', args, { cwd: repoDirectory, env, encoding: 'utf8' }).trim();
    const runScript = (...args) => execFileSync('node', [releaseNotesScript, ...args], { cwd: repoDirectory, env, encoding: 'utf8' }).trim();
    execFileSync('git', ['init', '--quiet', '--initial-branch=develop', repoDirectory], { env });

    // Each commit adds its own file, so merging main back into develop never conflicts.
    let changeCount = 0;
    const commit = (message) => {
        changeCount += 1;
        writeFileSync(join(repoDirectory, `change-${changeCount}.txt`), `${message}\n`);
        git('add', '.');
        git('commit', '--quiet', '--message', message);
    };
    commit('Initial commit');

    return {
        git,
        commit,
        // Creates `branch` from `from` with one commit on it.
        startBranch(branch, from) {
            git('checkout', '--quiet', '-b', branch, from);
            commit(`Work on ${branch}`);
        },
        // Merges `branch` into `base` the way GitHub merges PR #number titled `title`.
        mergePullRequest(number, title, branch, base) {
            git('checkout', '--quiet', base);
            git('merge', '--quiet', '--no-ff', '--message', `Merge pull request #${number} from grokability/${branch}`, '--message', title, branch);
        },
        // Branches off develop and merges straight back as PR #number.
        pullRequestIntoDevelop(number, title) {
            this.startBranch(`feature/pr-${number}`, 'develop');
            this.mergePullRequest(number, title, `feature/pr-${number}`, 'develop');
        },
        tag: (name, revision = 'HEAD') => git('tag', name, revision),
        releaseNotes: (revision = 'develop') => {
            git('checkout', '--quiet', revision);

            return runScript('1.0.99');
        },
        mergeNotes: (revision = 'develop') => runScript('--merge', revision, '--format', 'slack'),
    };
}

const pullRequestLink = (number) => `<https://github.com/grokability/snipe-it-mobile/pull/${number}|#${number}>`;

test('lists PRs merged into develop since the previous release, newest first', (testContext) => {
    const repo = createRepo(testContext);
    repo.pullRequestIntoDevelop(1, 'Shipped already');
    repo.tag('v1.0.2');
    repo.pullRequestIntoDevelop(2, 'Login fixes');
    repo.commit('A commit straight on develop');
    repo.pullRequestIntoDevelop(3, 'Scanner fixes');

    assert.equal(repo.releaseNotes(), ['• Scanner fixes (#3)', '• Login fixes (#2)'].join('\n'));
});

test('lists a stacked PR under the PR that brought it into develop', (testContext) => {
    const repo = createRepo(testContext);
    repo.startBranch('feature/users-view', 'develop');
    repo.startBranch('feature/shared-routes', 'feature/users-view');
    repo.mergePullRequest(2, 'Implements Shared Routes', 'feature/shared-routes', 'feature/users-view');
    repo.mergePullRequest(3, 'Adds User Detail Screen', 'feature/users-view', 'develop');

    assert.equal(repo.releaseNotes(), ['• Adds User Detail Screen (#3)', '  › Implements Shared Routes (#2)'].join('\n'));
});

test('nests a two-deep stack twice', (testContext) => {
    const repo = createRepo(testContext);
    repo.startBranch('feature/outer', 'develop');
    repo.startBranch('feature/middle', 'feature/outer');
    repo.startBranch('feature/inner', 'feature/middle');
    repo.mergePullRequest(2, 'Inner', 'feature/inner', 'feature/middle');
    repo.mergePullRequest(3, 'Middle', 'feature/middle', 'feature/outer');
    repo.mergePullRequest(4, 'Outer', 'feature/outer', 'develop');

    assert.equal(repo.releaseNotes(), ['• Outer (#4)', '  › Middle (#3)', '    › Inner (#2)'].join('\n'));
});

test('a stacked PR already in develop through an earlier merge of its branch is not repeated', (testContext) => {
    const repo = createRepo(testContext);
    repo.startBranch('feature/users-view', 'develop');
    repo.startBranch('feature/shared-routes', 'feature/users-view');
    repo.mergePullRequest(2, 'Implements Shared Routes', 'feature/shared-routes', 'feature/users-view');
    repo.mergePullRequest(3, 'Users Index Screen', 'feature/users-view', 'develop');
    repo.git('checkout', '--quiet', 'feature/users-view');
    repo.commit('More users work');
    repo.mergePullRequest(4, 'Adds User Detail Screen', 'feature/users-view', 'develop');

    assert.equal(
        repo.releaseNotes(),
        ['• Adds User Detail Screen (#4)', '• Users Index Screen (#3)', '  › Implements Shared Routes (#2)'].join('\n'),
    );
});

test('a tagged hotfix merged back into develop is left out', (testContext) => {
    const repo = createRepo(testContext);
    repo.git('branch', 'main');
    repo.startBranch('hotfix/crash', 'main');
    repo.mergePullRequest(2, 'Hotfix crash', 'hotfix/crash', 'main');
    repo.tag('v1.0.3');
    repo.pullRequestIntoDevelop(3, 'Login fixes');
    repo.git('merge', '--quiet', '--no-ff', '--message', 'Merge main into develop', 'main');

    assert.equal(repo.releaseNotes(), '• Login fixes (#3)');
});

test('an untagged PR that reached develop through a merge that is not a PR is listed at the top level', (testContext) => {
    const repo = createRepo(testContext);
    repo.git('branch', 'main');
    repo.startBranch('hotfix/crash', 'main');
    repo.mergePullRequest(2, 'Hotfix crash', 'hotfix/crash', 'main');
    repo.pullRequestIntoDevelop(3, 'Login fixes');
    repo.git('merge', '--quiet', '--no-ff', '--message', 'Merge main into develop', 'main');

    assert.equal(repo.releaseNotes(), ['• Hotfix crash (#2)', '• Login fixes (#3)'].join('\n'));
});

test('a re-run on a tagged commit lists the same PRs', (testContext) => {
    const repo = createRepo(testContext);
    repo.pullRequestIntoDevelop(1, 'Shipped already');
    repo.tag('v1.0.2');
    repo.pullRequestIntoDevelop(2, 'Login fixes');
    repo.tag('v1.0.3');

    assert.equal(repo.releaseNotes(), '• Login fixes (#2)');
});

test('a newer release tag does not hide an older commit\'s PRs', (testContext) => {
    const repo = createRepo(testContext);
    repo.pullRequestIntoDevelop(1, 'Shipped already');
    repo.tag('v1.0.2');
    repo.pullRequestIntoDevelop(2, 'Login fixes');
    const olderCommit = repo.git('rev-parse', 'HEAD');
    repo.pullRequestIntoDevelop(3, 'Scanner fixes');
    repo.tag('v1.0.4');

    assert.equal(repo.releaseNotes(olderCommit), '• Login fixes (#2)');
});

test('says so when nothing was merged since the previous release', (testContext) => {
    const repo = createRepo(testContext);
    repo.pullRequestIntoDevelop(1, 'Shipped already');
    repo.tag('v1.0.2');
    repo.commit('A commit straight on develop');

    assert.equal(repo.releaseNotes(), 'No pull requests merged since v1.0.2.');
});

test('a cut that would fall inside a group drops the whole group', (testContext) => {
    const repo = createRepo(testContext);
    const olderTitle = 'B'.repeat(1_000);
    const stackedTitle = 'C'.repeat(1_000);
    const newerTitle = 'A'.repeat(1_000);
    repo.startBranch('feature/older', 'develop');
    repo.startBranch('feature/stacked', 'feature/older');
    repo.mergePullRequest(2, stackedTitle, 'feature/stacked', 'feature/older');
    repo.mergePullRequest(3, olderTitle, 'feature/older', 'develop');
    repo.pullRequestIntoDevelop(4, newerTitle);

    assert.equal(
        repo.releaseNotes(),
        [`• ${newerTitle} (#4)`, '…and 1 more: https://github.com/grokability/snipe-it-mobile/releases/tag/v1.0.99'].join('\n'),
    );
});

test('--merge lists a develop merge with its stacked PRs, as linked Slack mrkdwn', (testContext) => {
    const repo = createRepo(testContext);
    repo.pullRequestIntoDevelop(1, 'An earlier PR');
    repo.startBranch('feature/users-view', 'develop');
    repo.startBranch('feature/shared-routes', 'feature/users-view');
    repo.mergePullRequest(2, 'Implements <Shared> Routes & more', 'feature/shared-routes', 'feature/users-view');
    repo.mergePullRequest(3, 'Adds User Detail Screen', 'feature/users-view', 'develop');

    assert.equal(
        repo.mergeNotes(),
        [`• Adds User Detail Screen (${pullRequestLink(3)})`, `  › Implements &lt;Shared&gt; Routes &amp; more (${pullRequestLink(2)})`].join('\n'),
    );
});

test('--merge on a merge that is not a PR lists the PRs it brought in, tagged or not', (testContext) => {
    const repo = createRepo(testContext);
    repo.git('branch', 'main');
    repo.startBranch('hotfix/crash', 'main');
    repo.mergePullRequest(2, 'Hotfix crash', 'hotfix/crash', 'main');
    repo.tag('v1.0.3');
    repo.pullRequestIntoDevelop(3, 'Login fixes');
    repo.git('merge', '--quiet', '--no-ff', '--message', 'Merge main into develop', 'main');

    assert.equal(repo.mergeNotes(), `• Hotfix crash (${pullRequestLink(2)})`);
});

test('--merge on a commit that brought in no PR shows its escaped subject', (testContext) => {
    const repo = createRepo(testContext);
    repo.pullRequestIntoDevelop(1, 'An earlier PR');
    repo.commit('Fix <Footer> & version');

    assert.equal(repo.mergeNotes(), '• Fix &lt;Footer&gt; &amp; version');
});
