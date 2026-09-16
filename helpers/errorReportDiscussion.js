// Where a user goes to turn a shared error report into something a maintainer can act on.
//
// Bug reports start as a Discussion rather than an Issue, and are promoted once a maintainer
// confirms they are reproducible — so this points at the issue-triage category, not /issues/new.

export const ISSUE_TRIAGE_DISCUSSION_URL =
    'https://github.com/grokability/snipe-it-mobile/discussions/new?category=issue-triage';

// The id of the "Error Report Reference" input in .github/DISCUSSION_TEMPLATE/issue-triage.yml.
// GitHub's form schema makes a field's id the name it answers to in a URL prefill, so this
// string has to keep matching the template — renaming the field there silently stops the
// prefill working here.
//
// A field rather than the body: that category has a discussion form, so the new-discussion page
// renders labelled inputs and has no free-text body for a `body=` parameter to land in.
const REFERENCE_FIELD_ID = 'error-report-reference';

// Returns the plain category URL when there is no reference, so callers can hand this a
// possibly-null id without branching.
export function buildErrorReportDiscussionUrl(eventId) {
    if (!eventId) return ISSUE_TRIAGE_DISCUSSION_URL;

    return `${ISSUE_TRIAGE_DISCUSSION_URL}&${REFERENCE_FIELD_ID}=${encodeURIComponent(eventId)}`;
}
