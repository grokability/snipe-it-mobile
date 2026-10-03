// Node's spec reporter, plus a spinner on the line of the test that is running. The spec reporter
// prints a test only once it finishes, and a promote scenario takes about a second, so without
// this nothing moves while one runs. The spinner is drawn only when stdout is a terminal.
//
// It starts on test:dequeue, which Node emits right before a test runs. test:start would be the
// obvious event, but Node emits it in declaration order when the test reports, not when it begins.
// Every dequeue starts the spinner, suites included: a suite's is replaced at once by its first
// test's. The event's `type` can't tell them apart, since Node 24 reports later tests as "suite".
// The test file itself is dequeued first, named by its path, and gets a label instead.
import { Transform } from 'node:stream';
import { spec as SpecReporter } from 'node:test/reporters';

const FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
const FRAME_INTERVAL_MS = 80;
const CLEAR_LINE = '\r\x1b[2K';
const CYAN = '\x1b[36m';
const RESET = '\x1b[0m';

export default class SpinnerReporter extends Transform {
    #specReporter = new SpecReporter();
    #drawsSpinner = Boolean(process.stdout.isTTY);
    #runningTest = null;
    #frameIndex = 0;
    #frameTimer = null;

    constructor() {
        super({ writableObjectMode: true });
        this.#specReporter.on('data', (chunk) => {
            this.#clearSpinner();
            this.push(chunk);
            this.#drawSpinner();
        });
    }

    _transform(event, encoding, callback) {
        if (event.type === 'test:dequeue') {
            this.#startSpinner(event.data);
        } else if ((event.type === 'test:pass' || event.type === 'test:fail') && this.#isRunningTest(event.data)) {
            this.#stopSpinner();
        }
        this.#specReporter.write(event, callback);
    }

    _flush(callback) {
        this.#stopSpinner();
        this.#specReporter.once('end', callback);
        this.#specReporter.end();
    }

    #isRunningTest(test) {
        return this.#runningTest?.name === test.name && this.#runningTest?.nesting === test.nesting;
    }

    #startSpinner(test) {
        if (!this.#drawsSpinner) return;
        this.#stopSpinner();
        const label = test.file?.endsWith(test.name) ? 'Starting the promote tests' : test.name;
        this.#runningTest = { name: test.name, nesting: test.nesting, label };
        this.#drawSpinner();
        this.#frameTimer = setInterval(() => {
            this.#frameIndex = (this.#frameIndex + 1) % FRAMES.length;
            this.#drawSpinner();
        }, FRAME_INTERVAL_MS);
        this.#frameTimer.unref();
    }

    #stopSpinner() {
        clearInterval(this.#frameTimer);
        this.#clearSpinner();
        this.#runningTest = null;
    }

    #drawSpinner() {
        if (!this.#runningTest) return;
        const indent = '  '.repeat(this.#runningTest.nesting);
        this.push(`${CLEAR_LINE}${indent}${CYAN}${FRAMES[this.#frameIndex]}${RESET} ${this.#runningTest.label}`);
    }

    #clearSpinner() {
        if (this.#runningTest) this.push(CLEAR_LINE);
    }
}
