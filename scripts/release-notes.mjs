// Prints the notes for a promotion: one line per PR merged since the previous release, read from
// the merge commits. A PR merged into a feature branch first (a stacked PR) is listed under the
// PR that brought it into develop. testflight.yml's release_info job runs it and passes the
// result to TestFlight's "What to Test" and to the Slack message.
//
//   node scripts/release-notes.mjs <release number>                  # since the previous release
//   node scripts/release-notes.mjs --merge <commit> [--format slack]  # what one develop commit brought in
//
// --merge lists the commit's own PR with its stacked PRs, or the subject of a commit that brought
// in no PR, for develop.yml's Slack message. --format slack writes Slack mrkdwn: &, < and >
// escaped, and each PR number linked.
//
// It needs full history, and tags unless --merge is given (`git fetch --unshallow --tags`). The
// GitHub Release that promote.mjs publishes afterwards has the categorized version of the same
// list; these notes come from git so the run doesn't need a GitHub token.
import { execFileSync } from 'node:child_process';
import { parseArgs } from 'node:util';

const RELEASES_URL = 'https://github.com/grokability/snipe-it-mobile/releases/tag/';
const PULL_REQUEST_URL = 'https://github.com/grokability/snipe-it-mobile/pull/';
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

function logCommits(args) {
    const log = runGit(['log', '--format=%H%x1f%P%x1f%s%x1f%b%x1e', ...args]);

    return log
        .split('\x1e')
        .map((entry) => entry.trim())
        .filter(Boolean)
        .map((entry) => {
            const [hash, parents, subject, body = ''] = entry.split('\x1f');

            return { hash, parents: parents.split(' '), subject, body };
        });
}

// The commits on `include`'s first-parent line that none of `excludes` reach, newest first.
function firstParentLine(include, excludes) {
    return logCommits(['--first-parent', include, '--not', ...excludes]);
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

function escapeMrkdwn(text) {
    return text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

function bulletFor(depth) {
    return depth === 0 ? '•' : `${'  '.repeat(depth)}›`;
}

// A PR's line, with its stacked PRs indented under it. Slack doesn't render nested lists, so a
// stacked PR is a line of its own that starts with ›.
function renderPullRequest(pullRequest, format, depth = 0) {
    const line = format === 'slack'
        ? `${escapeMrkdwn(pullRequest.title)} (<${PULL_REQUEST_URL}${pullRequest.number}|#${pullRequest.number}>)`
        : `${pullRequest.title} (#${pullRequest.number})`;
    const stackedLines = pullRequest.stacked.map((stackedPullRequest) => renderPullRequest(stackedPullRequest, format, depth + 1));

    return [`${bulletFor(depth)} ${line}`, ...stackedLines].join('\n');
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

// The PRs since the previous release, cut to fit Slack and TestFlight.
function releaseNotes(releaseNumber, format) {
    const shippedTags = shippedReleaseTags();
    const pullRequests = pullRequestsAlong(firstParentLine('HEAD', shippedTags), shippedTags);

    if (pullRequests.length === 0) {
        const previousTag = previousReleaseTag();

        return previousTag ? `No pull requests merged since ${previousTag}.` : 'No pull requests merged yet.';
    }
    const groups = pullRequests.map((pullRequest) => renderPullRequest(pullRequest, format));

    return truncate(groups, `${RELEASES_URL}v${releaseNumber}`);
}

// The PRs one commit brought in: its own PR with its stacked PRs, or, for a merge that isn't a
// PR, the PRs on its second parent. A commit that brought in no PR, such as a commit straight on
// develop, shows its subject.
function mergeNotes(revision, format) {
    const [commit] = logCommits(['-1', revision]);
    const pullRequests = pullRequestsAlong([commit], []);

    if (pullRequests.length === 0) {
        return `• ${format === 'slack' ? escapeMrkdwn(commit.subject) : commit.subject}`;
    }

    return pullRequests.map((pullRequest) => renderPullRequest(pullRequest, format)).join('\n');
}

const USAGE = 'Usage: node scripts/release-notes.mjs <release number> | --merge <commit> [--format text|slack]';
let options;
let releaseNumber;
try {
    const parsedArgs = parseArgs({
        options: { merge: { type: 'string' }, format: { type: 'string', default: 'text' } },
        allowPositionals: true,
    });
    options = parsedArgs.values;
    [releaseNumber] = parsedArgs.positionals;
} catch (error) {
    console.error(`${error.message}\n${USAGE}`);
    process.exit(2);
}

if (!['text', 'slack'].includes(options.format) || (!options.merge && !releaseNumber)) {
    console.error(USAGE);
    process.exit(2);
}

if (options.merge) {
    console.log(mergeNotes(options.merge, options.format));
} else {
    console.log(releaseNotes(releaseNumber, options.format));
}
