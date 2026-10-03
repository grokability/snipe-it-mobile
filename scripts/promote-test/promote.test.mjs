// Runs scripts/promote.mjs against a throwaway origin with fake EAS and GitHub (see fixture.mjs)
// and checks, for each path through the script, whether it pushed and what it published.
//
//   node scripts/promote-test/run.mjs                   # with a spinner on the test in progress
//   node --test scripts/promote-test/promote.test.mjs   # Node's plain output
import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { createFixture } from './fixture.mjs';

function fixtureFor(testContext, options) {
    const fixture = createFixture(options);
    testContext.after(() => fixture.remove());
    return fixture;
}

function assertRefused(fixture, result, expectedMessage) {
    assert.equal(result.exitCode, 1, result.output);
    assert.match(result.stderr, expectedMessage);
    assert.equal(fixture.tip('testflight'), fixture.commits.first, 'testflight must not move');
    assert.equal(fixture.tip('main'), fixture.commits.first, 'main must not move');
    assert.deepEqual(fixture.releaseWrites(), [], 'nothing may be published');
}

describe('refuses before pushing', () => {
    test('an unknown track', async (testContext) => {
        const fixture = fixtureFor(testContext);
        assertRefused(fixture, await fixture.promote(['staging']), /Usage: node scripts\/promote\.mjs <beta\|production>/);
    });

    test('when gh is not logged in', async (testContext) => {
        const fixture = fixtureFor(testContext);
        fixture.updateState((state) => (state.ghLoggedIn = false));
        assertRefused(fixture, await fixture.promote(['beta']), /gh is not logged in/);
    });

    test('when eas is not logged in', async (testContext) => {
        const fixture = fixtureFor(testContext);
        fixture.updateState((state) => (state.easLoggedIn = false));
        assertRefused(fixture, await fixture.promote(['beta']), /eas is not logged in/);
    });

    test('a sha that is not in the repository', async (testContext) => {
        const fixture = fixtureFor(testContext);
        assertRefused(fixture, await fixture.promote(['beta', 'deadbeef']), /deadbeef is not a commit/);
    });

    test('a commit that is not on develop', async (testContext) => {
        const fixture = fixtureFor(testContext);
        const featureCommit = fixture.commitOnTopOf(fixture.commits.third, 'Unmerged feature');
        fixture.setBranch('feature', featureCommit);
        fixture.addRun('develop.yml', featureCommit, ['SUCCESS']);
        assertRefused(fixture, await fixture.promote(['beta', featureCommit]), /is not on develop/);
    });

    test('when testflight has a commit develop lacks', async (testContext) => {
        const fixture = fixtureFor(testContext);
        const hotfixCommit = fixture.commitOnTopOf(fixture.commits.first, 'Hotfix on testflight');
        fixture.setBranch('testflight', hotfixCommit);
        const result = await fixture.promote(['beta']);
        assert.equal(result.exitCode, 1, result.output);
        assert.match(result.stderr, /would not be a fast-forward/);
        assert.equal(fixture.tip('testflight'), hotfixCommit);
        assert.deepEqual(fixture.releaseWrites(), []);
    });

    test('an older commit than testflight already has', async (testContext) => {
        const fixture = fixtureFor(testContext);
        fixture.setBranch('testflight', fixture.commits.third);
        const result = await fixture.promote(['beta', fixture.commits.second]);
        assert.equal(result.exitCode, 1, result.output);
        assert.match(result.stderr, /testflight already contains/);
        assert.equal(fixture.tip('testflight'), fixture.commits.third);
        assert.deepEqual(fixture.releaseWrites(), []);
    });

    test('a commit develop.yml never ran on', async (testContext) => {
        const fixture = fixtureFor(testContext);
        fixture.updateState((state) => {
            state.runs = state.runs.filter((run) => run.gitCommitHash !== fixture.commits.third);
        });
        assertRefused(fixture, await fixture.promote(['beta']), /develop\.yml never ran on/);
    });

    test('a commit whose develop run failed', async (testContext) => {
        const fixture = fixtureFor(testContext);
        fixture.addRun('develop.yml', fixture.commits.third, ['FAILURE']);
        assertRefused(fixture, await fixture.promote(['beta']), /The develop run for .* did not succeed/);
    });

    test('a commit whose develop run fails while the script waits for it', async (testContext) => {
        const fixture = fixtureFor(testContext);
        fixture.addRun('develop.yml', fixture.commits.third, ['IN_PROGRESS', 'IN_PROGRESS', 'FAILURE']);
        const result = await fixture.promote(['beta']);
        assert.match(result.stdout, /waiting: develop\.yml IN_PROGRESS/);
        assertRefused(fixture, result, /The develop run for .* did not succeed/);
    });

    for (const status of ['NEW', 'IN_PROGRESS', 'WAITING', 'ACTION_REQUIRED']) {
        test(`while a testflight run is ${status}`, async (testContext) => {
            const fixture = fixtureFor(testContext);
            fixture.addRun('testflight.yml', fixture.commits.first, [status]);
            assertRefused(fixture, await fixture.promote(['beta']), /A testflight run is still going/);
        });

        test(`while another develop run is ${status}`, async (testContext) => {
            const fixture = fixtureFor(testContext);
            fixture.addRun('develop.yml', fixture.commits.third, [status]);
            assertRefused(fixture, await fixture.promote(['beta', fixture.commits.second]), /Another develop run is still going/);
        });
    }

    test('when the confirmation is answered no', async (testContext) => {
        const fixture = fixtureFor(testContext);
        assertRefused(fixture, await fixture.promote(['beta'], { input: 'n\n' }), /Not pushed/);
    });

    for (const shallow of ['all-branches', 'single-branch']) {
        test(`in a shallow ${shallow} clone`, async (testContext) => {
            const fixture = fixtureFor(testContext, { shallow });
            assertRefused(fixture, await fixture.promote(['beta']), /This clone is shallow/);
        });
    }
});

describe('dry runs push and publish nothing', () => {
    test('--dry-run before a push', async (testContext) => {
        const fixture = fixtureFor(testContext);
        const result = await fixture.promote(['beta', '--dry-run']);
        assert.equal(result.exitCode, 0, result.output);
        assert.match(result.stdout, /Dry run: would push/);
        assert.equal(fixture.tip('testflight'), fixture.commits.first);
        assert.deepEqual(fixture.releaseWrites(), []);
    });

    test('--dry-run on a commit testflight already has, where nothing would ask before publishing', async (testContext) => {
        const fixture = fixtureFor(testContext);
        fixture.setBranch('testflight', fixture.commits.third);
        fixture.addRun('testflight.yml', fixture.commits.third, ['SUCCESS']);
        const result = await fixture.promote(['beta', '--dry-run']);
        assert.equal(result.exitCode, 0, result.output);
        assert.match(result.stdout, /Dry run: would publish v1\.0\.3 \(prerelease\)/);
        assert.deepEqual(fixture.releaseWrites(), []);
    });
});

describe('beta', () => {
    test('promotes the develop tip and publishes a prerelease', async (testContext) => {
        const fixture = fixtureFor(testContext);
        const result = await fixture.promote(['beta']);
        assert.equal(result.exitCode, 0, result.output);
        assert.match(result.stdout, /Promoting [0-9a-f]{7} \(1\.0\.3\) from develop to testflight/);
        assert.match(result.stdout, /waiting: testflight\.yml IN_PROGRESS/);
        assert.equal(fixture.tip('testflight'), fixture.commits.third);
        assert.deepEqual(fixture.releaseWrites(), [
            ['release', 'create', 'v1.0.3', '--target', fixture.commits.third, '--prerelease', '--generate-notes'],
        ]);
        assert.equal(fixture.release('v1.0.3').isLatest, false);
    });

    test('promotes the requested commit, not the tip', async (testContext) => {
        const fixture = fixtureFor(testContext);
        const result = await fixture.promote(['beta', fixture.commits.second.slice(0, 7)]);
        assert.equal(result.exitCode, 0, result.output);
        assert.equal(fixture.tip('testflight'), fixture.commits.second);
        assert.equal(fixture.release('v1.0.2').target, fixture.commits.second);
    });

    test('--yes pushes without asking', async (testContext) => {
        const fixture = fixtureFor(testContext);
        const result = await fixture.promote(['beta', '--yes'], { input: '' });
        assert.equal(result.exitCode, 0, result.output);
        assert.doesNotMatch(result.stdout, /\[y\/N\]/);
        assert.equal(fixture.tip('testflight'), fixture.commits.third);
    });

    test('waits for the develop run of the commit before pushing', async (testContext) => {
        const fixture = fixtureFor(testContext);
        fixture.addRun('develop.yml', fixture.commits.third, ['IN_PROGRESS', 'IN_PROGRESS', 'SUCCESS']);
        const result = await fixture.promote(['beta']);
        assert.equal(result.exitCode, 0, result.output);
        assert.match(result.stdout, /waiting: develop\.yml IN_PROGRESS/);
        assert.equal(fixture.tip('testflight'), fixture.commits.third);
    });

    test('notes of the next beta start at the previous beta', async (testContext) => {
        const fixture = fixtureFor(testContext);
        assert.equal((await fixture.promote(['beta', fixture.commits.second])).exitCode, 0);
        const result = await fixture.promote(['beta']);
        assert.equal(result.exitCode, 0, result.output);
        assert.deepEqual(fixture.releaseWrites().at(-1), [
            'release', 'create', 'v1.0.3', '--target', fixture.commits.third, '--prerelease', '--generate-notes', '--notes-start-tag', 'v1.0.2',
        ]);
    });

    test('running it again after a promotion changes nothing', async (testContext) => {
        const fixture = fixtureFor(testContext);
        assert.equal((await fixture.promote(['beta'])).exitCode, 0);
        const writesAfterFirstRun = fixture.releaseWrites();
        const result = await fixture.promote(['beta']);
        assert.equal(result.exitCode, 0, result.output);
        assert.match(result.stdout, /testflight is already at [0-9a-f]{7}; nothing to push/);
        assert.match(result.stdout, /Release v1\.0\.3 already exists; left as it is/);
        assert.deepEqual(fixture.releaseWrites(), writesAfterFirstRun);
    });

    test('a failed testflight run publishes nothing, and a successful retry publishes on the next run', async (testContext) => {
        const fixture = fixtureFor(testContext);
        fixture.updateState((state) => (state.onPush.testflight = ['IN_PROGRESS', 'FAILURE']));
        const failedResult = await fixture.promote(['beta']);
        assert.equal(failedResult.exitCode, 1, failedResult.output);
        assert.match(failedResult.stderr, /The testflight run did not succeed, so no release was published/);
        assert.equal(fixture.tip('testflight'), fixture.commits.third);
        assert.deepEqual(fixture.releaseWrites(), []);

        fixture.addRun('testflight.yml', fixture.commits.third, ['SUCCESS']);
        const retriedResult = await fixture.promote(['beta']);
        assert.equal(retriedResult.exitCode, 0, retriedResult.output);
        assert.match(retriedResult.stdout, /nothing to push/);
        assert.equal(fixture.release('v1.0.3').isPrerelease, true);
    });

    test('a testflight run that never starts publishes nothing, and the next run publishes once it has', async (testContext) => {
        const fixture = fixtureFor(testContext);
        fixture.updateState((state) => (state.onPush.testflight = null));
        const timedOutResult = await fixture.promote(['beta']);
        assert.equal(timedOutResult.exitCode, 1, timedOutResult.output);
        assert.match(timedOutResult.stderr, /Pushed, but no testflight\.yml run started within 3 minutes\. No release was published/);
        assert.equal(fixture.tip('testflight'), fixture.commits.third);
        assert.deepEqual(fixture.releaseWrites(), []);

        fixture.addRun('testflight.yml', fixture.commits.third, ['IN_PROGRESS', 'SUCCESS']);
        const laterResult = await fixture.promote(['beta']);
        assert.equal(laterResult.exitCode, 0, laterResult.output);
        assert.equal(fixture.release('v1.0.3').isPrerelease, true);
    });
});

describe('production', () => {
    async function fixtureWithBetaAndProduction(testContext) {
        const fixture = fixtureFor(testContext);
        fixture.updateState((state) => {
            state.releases.push({
                tagName: 'v1.0.1', target: fixture.commits.first, isDraft: false, isPrerelease: false, isLatest: true, notes: 'first release', createdOrder: 1,
            });
        });
        assert.equal((await fixture.promote(['beta'])).exitCode, 0);
        return fixture;
    }

    test('fast-forwards main to the beta commit and makes its prerelease the Latest release', async (testContext) => {
        const fixture = await fixtureWithBetaAndProduction(testContext);
        const result = await fixture.promote(['production']);
        assert.equal(result.exitCode, 0, result.output);
        assert.match(result.stdout, /from testflight to main/);
        assert.equal(fixture.tip('main'), fixture.commits.third);
        const [editCommand, editSubcommand, editedTag, ...editFlags] = fixture.releaseWrites().at(-1);
        assert.deepEqual([editCommand, editSubcommand, editedTag], ['release', 'edit', 'v1.0.3']);
        assert.deepEqual(editFlags.slice(0, 2), ['--prerelease=false', '--latest']);
        const productionRelease = fixture.release('v1.0.3');
        assert.equal(productionRelease.isPrerelease, false);
        assert.equal(productionRelease.isLatest, true);
        assert.equal(productionRelease.notes, 'notes for v1.0.3 since v1.0.1');
        assert.equal(fixture.release('v1.0.1').isLatest, false);
    });

    test('running it again changes nothing', async (testContext) => {
        const fixture = await fixtureWithBetaAndProduction(testContext);
        assert.equal((await fixture.promote(['production'])).exitCode, 0);
        const writesAfterFirstRun = fixture.releaseWrites();
        const result = await fixture.promote(['production']);
        assert.equal(result.exitCode, 0, result.output);
        assert.match(result.stdout, /Release v1\.0\.3 is already the production release/);
        assert.deepEqual(fixture.releaseWrites(), writesAfterFirstRun);
    });

    test('creates the release as Latest when no beta release exists', async (testContext) => {
        const fixture = fixtureFor(testContext);
        fixture.setBranch('testflight', fixture.commits.third);
        fixture.addRun('testflight.yml', fixture.commits.third, ['SUCCESS']);
        const result = await fixture.promote(['production']);
        assert.equal(result.exitCode, 0, result.output);
        assert.deepEqual(fixture.releaseWrites()[0].slice(0, 7), ['release', 'create', 'v1.0.3', '--target', fixture.commits.third, '--latest', '--title']);
        const productionRelease = fixture.release('v1.0.3');
        assert.equal(productionRelease.isPrerelease, false);
        assert.equal(productionRelease.isLatest, true);
        assert.equal(productionRelease.notes, 'notes for v1.0.3 since the first commit');
    });

    test('refuses a commit whose testflight run failed', async (testContext) => {
        const fixture = fixtureFor(testContext);
        fixture.setBranch('testflight', fixture.commits.third);
        fixture.addRun('testflight.yml', fixture.commits.third, ['FAILURE']);
        const result = await fixture.promote(['production']);
        assert.equal(result.exitCode, 1, result.output);
        assert.match(result.stderr, /The testflight run for .* did not succeed/);
        assert.equal(fixture.tip('main'), fixture.commits.first);
        assert.deepEqual(fixture.releaseWrites(), []);
    });
});
