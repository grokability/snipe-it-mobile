// Rewrites the deployments gist: which store build listens on which channel, and which JS it
// actually runs. The EAS workflows call this after every run, and it rebuilds the whole table
// from EAS each time, so two workflows finishing close together cannot leave it half-updated.
//
//   node scripts/update-deployments-gist.mjs            # PATCH the gist
//   node scripts/update-deployments-gist.mjs --dry-run  # print the markdown instead
//
// Needs DEPLOYMENTS_GIST_TOKEN (a GitHub token that can write gists) and DEPLOYMENTS_GIST_ID,
// and an eas-cli login (automatic inside EAS workflows). WORKFLOW_NAME is optional and only
// shows up in the header.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const GIST_FILENAME = 'snipe-it-mobile-deployments.md';
const PLATFORMS = ['ios', 'android'];
const PLATFORM_LABELS = { ios: 'iOS', android: 'Android' };
const isDryRun = process.argv.includes('--dry-run');

function runEas(args) {
    const output = execFileSync('npx', ['--yes', 'eas-cli@latest', ...args, '--json'], {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'inherit'],
        maxBuffer: 64 * 1024 * 1024,
    });
    return JSON.parse(output);
}

function runGit(args) {
    return execFileSync('git', args, { encoding: 'utf8' }).trim();
}

// The same number the release_info job computes: app.json's major.minor plus the commit's
// position in the first-parent history. Only commits on that line get one; the testflight
// merge commits from before promotion became a fast-forward return null.
function loadReleaseNumbers() {
    // eas/checkout clones with --depth 1, which would leave only the newest commit.
    if (runGit(['rev-parse', '--is-shallow-repository']) === 'true') {
        runGit(['fetch', '--unshallow', '--quiet']);
    }
    const appVersion = JSON.parse(readFileSync(new URL('../app.json', import.meta.url), 'utf8')).expo.version;
    const majorMinor = appVersion.split('.').slice(0, 2).join('.');
    const commits = runGit(['rev-list', '--first-parent', '--reverse', 'HEAD']).split('\n');
    return new Map(commits.map((commit, index) => [commit, `${majorMinor}.${index + 1}`]));
}

function shortHash(hash) {
    return hash ? hash.slice(0, 7) : '—';
}

function shortRuntime(runtimeVersion) {
    return runtimeVersion ? `\`${runtimeVersion.slice(0, 8)}\`` : '—';
}

function formatTime(isoTime) {
    return isoTime ? `${isoTime.slice(0, 16).replace('T', ' ')} UTC` : '—';
}

function newestFirst(first, second) {
    return second.createdAt.localeCompare(first.createdAt);
}

async function loadDeployments() {
    const channels = runEas(['channel:list', '--limit', '25', '--non-interactive']).currentPage;
    const branchByChannel = new Map(
        channels.map((channel) => [channel.name, channel.updateBranches[0]?.name ?? null]),
    );

    // update:list omits createdAt and the commit, so only the newest group for each platform and
    // runtime is looked up in full. An older update on the same runtime can never be the one a
    // build runs: expo-updates launches the newest update it has for its runtime.
    const newestUpdates = [];
    for (const branchName of new Set(branchByChannel.values())) {
        if (!branchName) continue;
        const groups = runEas(['update:list', '--branch', branchName, '--limit', '50', '--non-interactive']).currentPage;
        const seenKeys = new Set();
        for (const group of groups) {
            const groupPlatforms = group.platforms.split(',').map((platform) => platform.trim());
            const unseenPlatforms = groupPlatforms.filter((platform) => !seenKeys.has(`${platform}:${group.runtimeVersion}`));
            if (unseenPlatforms.length === 0) continue;
            unseenPlatforms.forEach((platform) => seenKeys.add(`${platform}:${group.runtimeVersion}`));
            const updates = runEas(['update:view', group.group]);
            newestUpdates.push(...updates.filter((update) => unseenPlatforms.includes(update.platform)));
        }
    }

    const builds = runEas(['build:list', '--status', 'finished', '--distribution', 'store', '--limit', '30', '--non-interactive']);
    const newestBuildByKey = new Map();
    for (const build of builds.sort(newestFirst)) {
        // Builds from before the store profiles had channels cannot receive an OTA at all.
        if (!build.updateChannel) continue;
        const key = `${build.updateChannel?.name}:${build.platform.toLowerCase()}`;
        if (!newestBuildByKey.has(key)) newestBuildByKey.set(key, build);
    }

    return {
        channels,
        branchByChannel,
        newestUpdates,
        builds: [...newestBuildByKey.values()],
        releaseNumbers: loadReleaseNumbers(),
    };
}

// A build launches an OTA only when it is newer than the bundle embedded at build time. An update
// published before the build finished — which happens when the same workflow run both builds and
// publishes — loses to the embedded bundle, and Sentry tags those events "(none)".
function findRunningUpdate(build, branchName, newestUpdates) {
    const platform = build.platform.toLowerCase();
    return newestUpdates.find((update) =>
        update.branch === branchName &&
        update.platform === platform &&
        update.runtimeVersion === build.runtime?.version &&
        !update.isRollBackToEmbedded &&
        update.createdAt > build.completedAt,
    ) ?? null;
}

function renderMarkdown({ channels, branchByChannel, newestUpdates, builds, releaseNumbers }) {
    const workflowName = process.env.WORKFLOW_NAME;
    const releaseFor = (commitHash) => releaseNumbers.get(commitHash) ?? '—';
    const lines = [
        '# Snipe-IT Mobile deployments',
        '',
        `Updated ${formatTime(new Date().toISOString())}${workflowName ? ` by \`${workflowName}\`` : ''}.`,
        '',
        '## Builds',
        '',
        'The newest store build on each channel. **Runs** is the JS that build launches, and **Release** is that JS\'s release.',
        '',
        '| Platform | Build | Channel | Release | Runtime | Built from | Finished | Runs |',
        '| --- | --- | --- | --- | --- | --- | --- | --- |',
    ];

    const sortedBuilds = builds.sort((first, second) =>
        first.updateChannel.name.localeCompare(second.updateChannel.name) ||
        first.platform.localeCompare(second.platform),
    );
    for (const build of sortedBuilds) {
        const channelName = build.updateChannel.name;
        const runningUpdate = findRunningUpdate(build, branchByChannel.get(channelName), newestUpdates);
        const runs = runningUpdate
            ? `OTA ${shortHash(runningUpdate.gitCommitHash)} (${formatTime(runningUpdate.createdAt)})`
            : 'embedded bundle (no newer OTA)';
        const runningCommit = runningUpdate ? runningUpdate.gitCommitHash : build.gitCommitHash;
        lines.push(
            `| ${PLATFORM_LABELS[build.platform.toLowerCase()]} | ${build.appBuildVersion} | ${channelName} | ${releaseFor(runningCommit)} | ` +
            `${shortRuntime(build.runtime?.version)} | ${shortHash(build.gitCommitHash)} | ${formatTime(build.completedAt)} | ${runs} |`,
        );
    }

    lines.push(
        '',
        '## Channels',
        '',
        'The newest OTA on each channel\'s branch. It only reaches builds with the same runtime.',
        '',
        '| Channel | Branch | Platform | Release | Newest OTA | Runtime | Published |',
        '| --- | --- | --- | --- | --- | --- | --- |',
    );
    for (const channel of [...channels].sort((first, second) => first.name.localeCompare(second.name))) {
        const branchName = branchByChannel.get(channel.name);
        const channelLabel = channel.isPaused ? `${channel.name} (paused)` : channel.name;
        for (const platform of PLATFORMS) {
            const newestUpdate = newestUpdates
                .filter((update) => update.branch === branchName && update.platform === platform)
                .sort(newestFirst)[0];
            lines.push(
                `| ${channelLabel} | ${branchName ?? '—'} | ${PLATFORM_LABELS[platform]} | ` +
                `${newestUpdate ? releaseFor(newestUpdate.gitCommitHash) : '—'} | ` +
                `${newestUpdate ? shortHash(newestUpdate.gitCommitHash) : '—'} | ${shortRuntime(newestUpdate?.runtimeVersion)} | ` +
                `${formatTime(newestUpdate?.createdAt)} |`,
            );
        }
    }

    lines.push(
        '',
        '## Reading this',
        '',
        '- **Release** matches the first line of the app footer and Sentry\'s `release` (`snipe-it-mobile@1.0.104`). It is the same for the same commit on every channel and platform, and a higher number is newer code. `—` means a commit that is not on develop\'s first-parent history, such as a testflight merge commit from before promotions became fast-forwards.',
        '- **Build** matches Sentry\'s `dist` (`ios-43`). iOS and Android count build numbers separately, so the same number on both platforms is two different binaries.',
        '- **Embedded bundle** means the build is running the JS it shipped with. It picks up the next OTA published for its runtime.',
        '',
    );
    return lines.join('\n');
}

async function updateGist(markdown) {
    const { DEPLOYMENTS_GIST_TOKEN: token, DEPLOYMENTS_GIST_ID: gistId } = process.env;
    if (!token || !gistId) {
        throw new Error('DEPLOYMENTS_GIST_TOKEN and DEPLOYMENTS_GIST_ID must both be set.');
    }
    const response = await fetch(`https://api.github.com/gists/${gistId}`, {
        method: 'PATCH',
        headers: {
            Accept: 'application/vnd.github+json',
            Authorization: `Bearer ${token}`,
            'X-GitHub-Api-Version': '2022-11-28',
        },
        body: JSON.stringify({ files: { [GIST_FILENAME]: { content: markdown } } }),
    });
    if (!response.ok) {
        throw new Error(`GitHub rejected the gist update: ${response.status} ${await response.text()}`);
    }
    const gist = await response.json();
    console.log(`Updated ${gist.html_url}`);
}

const markdown = renderMarkdown(await loadDeployments());
if (isDryRun) {
    console.log(markdown);
} else {
    await updateGist(markdown);
}
