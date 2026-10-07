// Loaded with --import into every process the promote tests start. The script polls every 20 s
// and gives a new run 3 minutes to start; this returns each wait at once and moves Date.now()
// forward by the time the wait would have taken, so deadlines still expire.
const realNow = Date.now.bind(Date);
const realSetTimeout = globalThis.setTimeout;
let elapsedMilliseconds = 0;

Date.now = () => realNow() + elapsedMilliseconds;
globalThis.setTimeout = (callback, milliseconds = 0, ...args) => {
    elapsedMilliseconds += milliseconds;
    return realSetTimeout(callback, 0, ...args);
};
