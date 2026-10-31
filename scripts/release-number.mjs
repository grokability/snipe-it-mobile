// The release number: app.json's major.minor plus a patch that counts develop's first-parent
// commits. The first-parent commit that changes app.json's major.minor is `.0`, and each commit
// after it adds one, so each merged PR adds one. Before any major.minor change, the patch is the
// full first-parent count, which is how every 1.0 number was made. app.json's own patch digit is
// ignored. testflight and main are fast-forwarded to develop commits, so the same commit gets the
// same number on every track. It is computed rather than written to app.json because `version`
// is part of the fingerprint.
//
//   node scripts/release-number.mjs [rev]     # prints rev's release number (default HEAD)
//
// develop.yml and testflight.yml run it in release_info, promote.mjs names the GitHub Release
// after it, and update-deployments-gist.mjs labels each row with it. It needs full history: the
// callers unshallow first. It uses only Node's built-ins because release_info doesn't install
// node_modules, and it runs git in the current directory, so it reads the repo it is run in.
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

function runGit(args) {
    return execFileSync('git', args, { encoding: 'utf8' }).trim();
}

function majorMinorAt(commit) {
    const appVersion = JSON.parse(runGit(['show', `${commit}:app.json`])).expo.version;

    return appVersion.split('.').slice(0, 2).join('.');
}

// A Map of every commit on head's first-parent line to its release number. With a path, rev-list
// --first-parent lists the commits whose app.json differs from their first parent, which for a PR
// merge is the merge itself, so app.json is only read at those commits.
export function loadReleaseNumbers(head = 'HEAD') {
    const commits = runGit(['rev-list', '--first-parent', '--reverse', head]).split('\n');
    const appJsonCommits = new Set(runGit(['rev-list', '--first-parent', head, '--', 'app.json']).split('\n'));
    const releaseNumbers = new Map();
    let majorMinor = null;
    let anchorIndex = null;
    commits.forEach((commit, index) => {
        if (appJsonCommits.has(commit)) {
            const commitMajorMinor = majorMinorAt(commit);

            if (majorMinor !== null && commitMajorMinor !== majorMinor) {
                anchorIndex = index;
            }
            majorMinor = commitMajorMinor;
        }

        if (majorMinor === null) {
            return;
        }
        const patch = anchorIndex === null ? index + 1 : index - anchorIndex;
        releaseNumbers.set(commit, `${majorMinor}.${patch}`);
    });

    return releaseNumbers;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    const commit = runGit(['rev-parse', '--verify', `${process.argv[2] ?? 'HEAD'}^{commit}`]);
    const releaseNumber = loadReleaseNumbers(commit).get(commit);

    if (!releaseNumber) {
        console.error(`${commit} has no app.json, so it has no release number.`);
        process.exit(1);
    }
    console.log(releaseNumber);
}
