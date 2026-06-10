# Contributing

This document describes the process of contributing to this project. It is intended
for anyone considering opening an **issue**, **discussion** or **pull request**.
For people who are interested in developing this project and technical details behind
it.

## The Critical Rule

**The most important rule: you must understand your code.** If you can't
explain what your changes do and how they interact with the greater system
without the aid of AI tools, do not contribute to this project.

Using AI to write code is fine. You can gain understanding by interrogating an
agent with access to the codebase until you grasp all edge cases and effects
of your changes. What's not fine is submitting agent-generated slop without
that understanding. Be sure to read the [AI Usage Policy](AI_POLICY.md).

## AI Usage

This project has strict rules for AI usage. Please see
the [AI Usage Policy](AI_POLICY.md). **This is very important.**

## First-Time Contributors

We use a vouch system for first-time contributors:

1. Open a
   [discussion in the "Vouch Request"](https://github.com/grokability/snipe-it-mobile/discussions/new?category=vouch-request)
   category describing what you want to change and why. Follow the template.
2. Keep it concise
3. Write in your own voice, don't have an AI write this
4. A maintainer will comment `!vouch` if approved
5. Once approved, you can submit PRs

If you aren't vouched, any pull requests you open will be
automatically closed. This system exists because open source works
on a system of trust, and AI has unfortunately made it so we can no
longer trust-by-default because it makes it too trivial to generate
plausible-looking but actually low-quality contributions.

## Denouncement System

If you repeatedly break the rules of this document or repeatedly
submit low quality work, you will be **denounced.** This adds your
username to a public list of bad actors who have wasted our time. All
future interactions on this project will be automatically closed by
bots.

The denouncement list is public, so other projects who trust our
maintainer judgement can also block you automatically.

## Quick Guide

### I'd like to contribute

[All issues are actionable](#issues-are-actionable). Pick one and start
working on it. Thank you. If you need help or guidance, comment on the issue.
Issues that are extra friendly to new contributors are tagged with
["good first issue"].

### Translations

If you're not a coder but want to give back to the project and you're fluent in other languages, consider helping out with the translations.

We use the CrowdIn localization platform to manage translations, and it makes it super-simple for you to add translations to the project without messing with code. Check out the [Snipe-IT CrowdIn translation project](https://crowdin.com/project/snipe-it/) to see current translation progress and all available languages.

If you'd like to translate Snipe-IT into a language that we don't currently offer, simply let us know via the CrowdIn platform or by [creating an issue](https://github.com/snipe/snipe-it/issues) on Github and we'll get that set up for you.

### I have a bug! / Something isn't working

First, search the issue tracker and discussions for similar issues. Tip: also
search for [closed issues] and [discussions] — your issue might have already
been fixed!

If your issue hasn't been reported already, open an ["Issue Triage"] discussion
and make sure to fill in the template **completely**. They are vital for
maintainers to figure out important details about your setup.

> [!WARNING]
>
> A _very_ common mistake is to file a bug report either as a Q&A or a Feature
> Request. **Please don't do this.** Otherwise, maintainers would have to ask
> for your system information again manually, and sometimes they will even ask
> you to create a new discussion because of how few detailed information is
> required for other discussion types compared to Issue Triage.
>
> Because of this, please make sure that you _only_ use the "Issue Triage"
> category for reporting bugs — thank you!

[closed issues]: https://github.com/grokability/snipe-it-mobile/issues?q=is%3Aissue%20state%3Aclosed
[discussions]: https://github.com/grokability/snipe-it-mobile/discussions?discussions_q=is%3Aclosed
["Issue Triage"]: https://github.com/grokability/snipe-it-mobile/discussions/new?category=issue-triage

### I have an idea for a feature

Like bug reports, first search through both issues and discussions and try to
find if your feature has already been requested. Otherwise, open a discussion
in the ["Feature Requests, Ideas"] category.

["Feature Requests, Ideas"]: https://github.com/grokability/snipe-it-mobile/discussions/new?category=feature-requests-ideas

### I've implemented a feature

1. If there is an issue for the feature, open a pull request straight away and link to the issue (once you've been Vouched, of course).
2. If there is no issue, open a discussion and link to your branch.
3. If you want to live dangerously, open a pull request and
   [hope for the best](#pull-requests-implement-an-issue).

### I have a question which is neither a bug report nor a feature request

Open an [Q&A discussion], or join our [Discord Server] and ask away in the
`#official-mobile-app` forum channel.

> [!NOTE]
> If your question is about a missing feature, please open a discussion under
> the ["Feature Requests, Ideas"] category. If this project is behaving
> unexpectedly, use the ["Issue Triage"] category.
>
> The "Q&A" category is strictly for other kinds of discussions and do not
> require detailed information unlike the two other categories, meaning that
> maintainers would have to spend the extra effort to ask for basic information
> if you submit a bug report under this category.
>
> Therefore, please **pay attention to the category** before opening
> discussions to save us all some time and energy. Thank you!

[Q&A discussion]: https://github.com/grokability/snipe-it-mobile/discussions/new?category=q-a
[Discord Server]: https://discord.gg/yZFtShAcKk

## General Patterns

### Issues are Actionable

The Snipe-IT Mobile [issue tracker](https://github.com/grokability/snipe-it-mobile/issues)
is for _*actionable items_.

Unlike some other projects, this project **does not use the issue tracker for
discussion or feature requests**. Instead, we use GitHub
[discussions](https://github.com/grokability/snipe-it-mobile/discussions) for that.
Once a discussion reaches a point where a well-understood, actionable
item is identified, it is moved to the issue tracker. **This pattern
makes it easier for maintainers or contributors to find issues to work on
since _every issue_ is ready to be worked on.**

### Pull Requests Implement an Issue

Pull requests should be associated with a previously accepted issue.
**If you open a pull request for something that wasn't previously discussed,**
it may be closed or remain stale for an indefinite period of time. I'm not
saying it will never be accepted, but the odds are stacked against you.

Issues tagged with "feature" represent accepted, well-scoped feature requests.
If you implement an issue tagged with feature as described in the issue, your
pull request will be accepted with a high degree of certainty.

> [!NOTE]
>
> **Pull requests are NOT a place to discuss feature design.** Please do
> not open a WIP pull request to discuss a feature. Instead, use a discussion
> and link to your branch.