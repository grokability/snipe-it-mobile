// Runs scripts/release-number.mjs against throwaway repos built the way develop's history is:
// PR branches merged with --no-ff, plus the odd commit straight on develop.
//
//   node --test scripts/release-number-test/release-number.test.mjs
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const releaseNumberScript = fileURLToPath(new URL('../release-number.mjs', import.meta.url));

function createRepo(testContext) {
    const root = mkdtempSync(join(tmpdir(), 'release-number-test-'));
    testContext.after(() => rmSync(root, { recursive: true, force: true }));
    const emptyGitConfig = join(root, 'gitconfig');
    writeFileSync(emptyGitConfig, '');
    const repoDirectory = join(root, 'repo');
    const env = {
        ...process.env,
        // The developer's own git config (signing, hooks, default branch) stays out of the repo.
        GIT_CONFIG_GLOBAL: emptyGitConfig,
        GIT_CONFIG_NOSYSTEM: '1',
        GIT_AUTHOR_NAME: 'Release Number Test',
        GIT_AUTHOR_EMAIL: 'release-number-test@example.com',
        GIT_COMMITTER_NAME: 'Release Number Test',
        GIT_COMMITTER_EMAIL: 'release-number-test@example.com',
    };
    const git = (...args) => execFileSync('git', args, { cwd: repoDirectory, env, encoding: 'utf8' }).trim();
    execFileSync('git', ['init', '--quiet', '--initial-branch=develop', repoDirectory], { env });

    let appJson = { expo: { version: '1.0.0' } };
    let changeCount = 0;
    // A commit on the current branch. `version` rewrites app.json's version; `appJsonEdit` changes
    // another app.json field.
    const commit = (message, { version, appJsonEdit = false } = {}) => {
        if (version || appJsonEdit) {
            appJson = { expo: { ...appJson.expo, ...(version && { version }), ...(appJsonEdit && { name: message }) } };
        }
        changeCount += 1;
        writeFileSync(join(repoDirectory, 'app.json'), JSON.stringify(appJson));
        writeFileSync(join(repoDirectory, 'history.txt'), `${changeCount}\n`);
        git('add', '.');
        git('commit', '--quiet', '--message', message);

        return git('rev-parse', 'HEAD');
    };
    // A PR branch with one commit, merged into develop the way GitHub merges a PR.
    const mergePullRequest = (name, commitOptions = {}) => {
        git('checkout', '--quiet', '-b', name);
        const branchCommit = commit(`Work on ${name}`, commitOptions);
        git('checkout', '--quiet', 'develop');
        git('merge', '--quiet', '--no-ff', '--message', `Merge pull request from ${name}`, name);

        return { branchCommit, merge: git('rev-parse', 'HEAD') };
    };
    const releaseNumber = (...args) =>
        execFileSync('node', [releaseNumberScript, ...args], { cwd: repoDirectory, env, encoding: 'utf8' }).trim();

    commit('Initial commit');

    return { commit, mergePullRequest, releaseNumber };
}

test('with no major.minor change, the patch is the full first-parent count', (testContext) => {
    const repo = createRepo(testContext);
    repo.mergePullRequest('first-feature');
    const middle = repo.commit('Straight on develop');
    repo.mergePullRequest('second-feature');

    assert.equal(repo.releaseNumber(), '1.0.4');
    assert.equal(repo.releaseNumber(middle), '1.0.3');
    assert.equal(repo.releaseNumber('HEAD~3'), '1.0.1');
});

test('the merge that bumps the minor is .0, and the next merge is .1', (testContext) => {
    const repo = createRepo(testContext);
    repo.mergePullRequest('first-feature');
    const bump = repo.mergePullRequest('bump-version', { version: '1.1.0' });
    repo.mergePullRequest('next-feature');

    assert.equal(repo.releaseNumber(bump.merge), '1.1.0');
    assert.equal(repo.releaseNumber(), '1.1.1');
    assert.equal(repo.releaseNumber('HEAD~2'), '1.0.2');
});

test('a bump on a PR branch resets at the merge into develop, not at the branch commit', (testContext) => {
    const repo = createRepo(testContext);
    repo.mergePullRequest('first-feature');
    const bump = repo.mergePullRequest('bump-version', { version: '1.1.0' });

    assert.equal(repo.releaseNumber(bump.merge), '1.1.0');
    // The branch commit isn't on develop's first-parent line, so its own number is counted along
    // its own first-parent line, where it is the bump.
    assert.equal(repo.releaseNumber(bump.branchCommit), '1.1.0');
    assert.equal(repo.releaseNumber(`${bump.merge}^1`), '1.0.2');
});

test('a bump committed straight on develop is .0', (testContext) => {
    const repo = createRepo(testContext);
    repo.mergePullRequest('first-feature');
    repo.commit('Bump to 1.1', { version: '1.1.0' });
    repo.commit('Straight on develop');

    assert.equal(repo.releaseNumber('HEAD^'), '1.1.0');
    assert.equal(repo.releaseNumber(), '1.1.1');
});

test('an app.json edit that keeps the version does not reset the count', (testContext) => {
    const repo = createRepo(testContext);
    repo.mergePullRequest('first-feature');
    repo.mergePullRequest('edit-app-json', { appJsonEdit: true });

    assert.equal(repo.releaseNumber(), '1.0.3');
});

test('a patch-only bump does not reset the count', (testContext) => {
    const repo = createRepo(testContext);
    repo.mergePullRequest('first-feature');
    repo.mergePullRequest('patch-bump', { version: '1.0.1' });

    assert.equal(repo.releaseNumber(), '1.0.3');
});

test('every major.minor change resets, including a major bump', (testContext) => {
    const repo = createRepo(testContext);
    repo.mergePullRequest('minor-bump', { version: '1.1.0' });
    repo.mergePullRequest('feature');
    repo.mergePullRequest('major-bump', { version: '2.0.0' });
    repo.mergePullRequest('next-feature');

    assert.equal(repo.releaseNumber('HEAD~2'), '1.1.1');
    assert.equal(repo.releaseNumber('HEAD^'), '2.0.0');
    assert.equal(repo.releaseNumber(), '2.0.1');
});
