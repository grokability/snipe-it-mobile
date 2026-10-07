// Prints the plain-text notes for a promotion: one line per PR merged on develop since the
// previous release tag, read from the merge commits. testflight.yml's release_info job runs it
// and passes the result to TestFlight's "What to Test" and to the Slack message.
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

function runGit(args, options = {}) {
    return execFileSync('git', args, { encoding: 'utf8', ...options }).trim();
}

// The nearest release tag on develop's first-parent line before this commit. HEAD^ skips a tag on
// the commit itself, which a re-run finds, and --first-parent skips hotfix tags, which reach
// develop only through a merge's second parent. Before the first promotion there is no tag, and
// git's "No names found" error is expected, so it isn't printed.
function previousReleaseTag() {
    try {
        return runGit(['describe', '--tags', '--abbrev=0', '--first-parent', '--match', 'v[0-9]*', 'HEAD^'], { stdio: ['ignore', 'pipe', 'ignore'] });
    } catch {
        return null;
    }
}

// GitHub writes "Merge pull request #N from <branch>" as the subject and the PR title as the
// body. Other first-parent commits, such as merging main back into develop, aren't PRs and are
// left out, as they are from GitHub's generated notes.
function mergedPullRequests(range) {
    const log = runGit(['log', '--first-parent', '--format=%s%x1f%b%x1e', range]);
    return log
        .split('\x1e')
        .map((entry) => entry.trim())
        .filter(Boolean)
        .flatMap((entry) => {
            const [subject, body = ''] = entry.split('\x1f');
            const pullRequestMatch = subject.match(PULL_REQUEST_MERGE);
            if (!pullRequestMatch) return [];
            const title = body.split('\n')[0].trim() || subject;
            return [`• ${title} (#${pullRequestMatch[1]})`];
        });
}

// Newest first, so a cut drops the oldest PRs, which the release page still lists.
function truncate(lines, releaseUrl) {
    const fullText = lines.join('\n');
    if (fullText.length <= MAX_LENGTH) return fullText;
    const moreLine = (count) => `…and ${count} more: ${releaseUrl}`;
    const kept = [];
    let length = 0;
    for (const line of lines) {
        const omittedAfterThis = lines.length - kept.length - 1;
        if (length + line.length + 1 + moreLine(omittedAfterThis).length > MAX_LENGTH) break;
        kept.push(line);
        length += line.length + 1;
    }
    return [...kept, moreLine(lines.length - kept.length)].join('\n');
}

const releaseNumber = process.argv[2];
if (!releaseNumber) {
    console.error('Usage: node scripts/release-notes.mjs <release number>');
    process.exit(2);
}

const previousTag = previousReleaseTag();
const pullRequests = mergedPullRequests(previousTag ? `${previousTag}..HEAD` : 'HEAD');
if (pullRequests.length === 0) {
    console.log(previousTag ? `No pull requests merged since ${previousTag}.` : 'No pull requests merged yet.');
} else {
    console.log(truncate(pullRequests, `${RELEASES_URL}v${releaseNumber}`));
}
