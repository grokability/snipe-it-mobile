// Stands in for `gh` in the promote tests. Every call is recorded in the state's ghCalls, and
// releases live in the state's releases, so a test can check exactly what would have been
// published. Anything the script doesn't run fails loudly.
import { readFileSync } from 'node:fs';
import { readState, writeState } from './state.mjs';

const args = process.argv.slice(2);
const state = readState();
state.ghCalls.push(args);

function finish(output, exitCode = 0) {
    writeState(state);
    if (output) (exitCode === 0 ? process.stdout : process.stderr).write(`${output}\n`);
    process.exit(exitCode);
}

function flagValue(flag) {
    const index = args.indexOf(flag);
    return index === -1 ? undefined : args[index + 1];
}

function fieldValue(name) {
    const field = args.find((arg, index) => args[index - 1] === '-f' && arg.startsWith(`${name}=`));
    return field?.slice(name.length + 1);
}

function makeLatest(release) {
    for (const otherRelease of state.releases) otherRelease.isLatest = false;
    release.isLatest = true;
}

const [command, subcommand, tagName] = args;

if (command === 'auth' && subcommand === 'status') {
    finish('', state.ghLoggedIn ? 0 : 1);
}

if (command === 'release') {
    const release = state.releases.find((candidate) => candidate.tagName === tagName);

    if (subcommand === 'view') {
        if (!release) finish('release not found', 1);
        finish(JSON.stringify({ tagName }));
    }

    if (subcommand === 'list') {
        const listedReleases = state.releases
            .filter((candidate) => !(args.includes('--exclude-drafts') && candidate.isDraft))
            .filter((candidate) => !(args.includes('--exclude-pre-releases') && candidate.isPrerelease))
            .sort((first, second) => second.createdOrder - first.createdOrder);
        finish(listedReleases[0]?.tagName ?? '');
    }

    if (subcommand === 'create') {
        if (release) finish(`a release with tag ${tagName} already exists`, 1);
        const notesStartTag = flagValue('--notes-start-tag');
        const newRelease = {
            tagName,
            target: flagValue('--target'),
            isDraft: false,
            isPrerelease: args.includes('--prerelease'),
            isLatest: false,
            notes: args.includes('--generate-notes')
                ? `generated notes since ${notesStartTag ?? 'the first commit'}`
                : readFileSync(flagValue('--notes-file'), 'utf8'),
            createdOrder: Math.max(0, ...state.releases.map((candidate) => candidate.createdOrder)) + 1,
        };
        state.releases.push(newRelease);
        if (args.includes('--latest')) makeLatest(newRelease);
        finish(`https://github.com/grokability/snipe-it-mobile/releases/tag/${tagName}`);
    }

    if (subcommand === 'edit') {
        if (!release) finish('release not found', 1);
        if (args.includes('--prerelease=false')) release.isPrerelease = false;
        if (args.includes('--latest')) makeLatest(release);
        if (flagValue('--notes-file')) release.notes = readFileSync(flagValue('--notes-file'), 'utf8');
        finish(`https://github.com/grokability/snipe-it-mobile/releases/tag/${tagName}`);
    }
}

if (command === 'api' && subcommand === 'repos/{owner}/{repo}/releases/generate-notes') {
    finish(`notes for ${fieldValue('tag_name')} since ${fieldValue('previous_tag_name') ?? 'the first commit'}`);
}

finish(`fake gh: unexpected command: ${args.join(' ')}`, 2);
