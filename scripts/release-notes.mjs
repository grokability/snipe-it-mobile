// Prints the plain-text notes for a promotion: one line per PR merged since the previous release,
// read from the merge commits. A PR merged into a feature branch first (a stacked PR) is listed
// under the PR that brought it into develop. testflight.yml's release_info job runs it and passes
// the result to TestFlight's "What to Test" and to the Slack message.
//
//   node scripts/release-notes.mjs <release number>
//
// It needs full history and tags (`git fetch --unshallow --tags`). The GitHub Release that
// promote.mjs publishes afterwards has the categorized version of the same list; these notes
// come from git so the run doesn't need a GitHub token.
import { execFileSync } from 'node:child_process';

const RELEASES_URL = 'https://github.com/grokability/snipe-it-mobile/releases/tag/';
// Slack rejects section text over 3,000 characters, and the message adds a heading and escapes
// &, < and > as entities. TestFlight's limit is 4,000.
const MAX_LENGTH = 2_500;
const PULL_REQUEST_MERGE = /^Merge pull request #(\d+) from /;
const RELEASE_TAG_PATTERN = 'v[0-9]*';

function runGit(args, options = {}) {
    return execFileSync('git', args, { encoding: 'utf8', ...options }).trim();
}

// The nearest release tag on develop's first-parent line before this commit, for the message
// when nothing was merged. HEAD^ skips a tag on the commit itself, which a re-run finds, and
// --first-parent skips hotfix tags, which reach develop only through a merge's second parent.
// Before the first promotion there is no tag, and git's "No names found" error is expected, so
// it isn't printed.
function previousReleaseTag() {
    try {
        return runGit(['describe', '--tags', '--abbrev=0', '--first-parent', '--match', RELEASE_TAG_PATTERN, 'HEAD^'], { stdio: ['ignore', 'pipe', 'ignore'] });
    } catch {
        return null;
    }
}

// Every release tag HEAD contains, except one on HEAD itself, which a re-run finds. A PR any of
// them reaches has shipped, including a hotfix PR whose tag reached develop through main.
function shippedReleaseTags() {
    const listTags = (filter) => runGit(['tag', '--list', RELEASE_TAG_PATTERN, filter, 'HEAD', '--format=%(refname)']).split('\n').filter(Boolean);
    const tagsOnHead = new Set(listTags('--points-at'));

    return listTags('--merged').filter((tag) => !tagsOnHead.has(tag));
}

// The commits on `include`'s first-parent line that none of `excludes` reach, newest first.
function firstParentLine(include, excludes) {
    const log = runGit(['log', '--first-parent', '--format=%H%x1f%P%x1f%s%x1f%b%x1e', include, '--not', ...excludes]);

    return log
        .split('\x1e')
        .map((entry) => entry.trim())
        .filter(Boolean)
        .map((entry) => {
            const [hash, parents, subject, body = ''] = entry.split('\x1f');

            return { hash, parents: parents.split(' '), subject, body };
        });
}

// The PRs along a first-parent line, newest first, each with the PRs its merge brought in: the
// ones on its second parent's first-parent line that its first parent doesn't have. GitHub
// writes "Merge pull request #N from <branch>" as the subject and the PR title as the body. A
// merge that isn't a PR, such as main merged back into develop, lists the PRs it brought in at
// its own level.
function pullRequestsAlong(commits, shippedTags) {
    return commits.flatMap((commit) => {
        if (commit.parents.length < 2) {
            return [];
        }
        const [firstParent, secondParent] = commit.parents;
        const mergedIn = pullRequestsAlong(firstParentLine(secondParent, [firstParent, ...shippedTags]), shippedTags);
        const pullRequestMatch = commit.subject.match(PULL_REQUEST_MERGE);

        if (!pullRequestMatch) {
            return mergedIn;
        }
        const title = commit.body.split('\n')[0].trim() || commit.subject;

        return [{ number: pullRequestMatch[1], title, stacked: mergedIn }];
    });
}

// A PR's line, with its stacked PRs indented under it.
function renderPullRequest(pullRequest, depth = 0) {
    const bullet = depth === 0 ? '•' : `${'  '.repeat(depth)}›`;
    const stackedLines = pullRequest.stacked.map((stackedPullRequest) => renderPullRequest(stackedPullRequest, depth + 1));

    return [`${bullet} ${pullRequest.title} (#${pullRequest.number})`, ...stackedLines].join('\n');
}

// Newest first, so a cut drops the oldest PRs, which the release page still lists. A group is a
// develop PR with its stacked PRs, and the cut keeps or drops a group whole.
function truncate(groups, releaseUrl) {
    const fullText = groups.join('\n');

    if (fullText.length <= MAX_LENGTH) {
        return fullText;
    }
    const moreLine = (count) => `…and ${count} more: ${releaseUrl}`;
    const kept = [];
    let length = 0;
    for (const group of groups) {
        const omittedAfterThis = groups.length - kept.length - 1;

        if (length + group.length + 1 + moreLine(omittedAfterThis).length > MAX_LENGTH) {
            break;
        }
        kept.push(group);
        length += group.length + 1;
    }

    return [...kept, moreLine(groups.length - kept.length)].join('\n');
}

const releaseNumber = process.argv[2];
if (!releaseNumber) {
    console.error('Usage: node scripts/release-notes.mjs <release number>');
    process.exit(2);
}

const shippedTags = shippedReleaseTags();
const pullRequests = pullRequestsAlong(firstParentLine('HEAD', shippedTags), shippedTags);
if (pullRequests.length === 0) {
    const previousTag = previousReleaseTag();
    console.log(previousTag ? `No pull requests merged since ${previousTag}.` : 'No pull requests merged yet.');
} else {
    const groups = pullRequests.map((pullRequest) => renderPullRequest(pullRequest));
    console.log(truncate(groups, `${RELEASES_URL}v${releaseNumber}`));
}
