# Process overview

## What I built

SLOP8412, *Advanced Fréchet Inception Distance*: twelve weeks spent auditing
one number. The course runs on a bench, a reference distribution and three
candidates in 2048 dimensions chosen so that every score on them has a closed
form, and re-scores it every week with that week's method. There is no separate
curriculum document. The site is the course.

## How I got here

Assignment 1 came back at 86 for process, 84 for artefact and 77 for response.
The gap was response, and the marker named it exactly: the connection between
the two halves of my page was legible to me and invisible to a reader. So
before writing a word of content I turned that into three rules in `CLAUDE.md`,
which outrank fluency: argue rather than set a mood, earn anything symbolic or
cut it, and make non-adjacent weeks depend on one another
([`3dde85d`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass2-jnheinrich451-eng/commit/3dde85d)).

What I did not plan was that the course's own subject would start describing my
process. FID is a number that is precise, repeatable and wrong. Three weeks in,
so were my checks.

The clearest case was week 12's figure. I fitted the finite-sample bias against
1/N across seven sample sizes and got a tidy line whose intercepts were 180.6
and 188.8, against true values of 5.12 and 4.88. Wrong by a factor of 35, and
nothing in the picture said so. Three of the seven points sat below d = 2048,
where the sample covariance is rank-deficient and the 1/N law has not started;
fitting only N > d returns 5.145 and 4.882
([`3c9eb4b`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass2-jnheinrich451-eng/commit/3c9eb4b)).
I caught it only because every figure script prints its values and a different
script had already printed 5.12.

The same shape kept turning up in `spec/`. A test asserting that no two weeks
open with the same sentence was green because it read `body` from an API node
that carries no `body`: twelve undefined values and nothing to compare. I fixed
the loader and added a guard asserting that the one written week reads over 400
words, so a broken loader now fails louder than the assertions it feeds
([`224688b`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass2-jnheinrich451-eng/commit/224688b)).
Later a vocabulary pin could not reach the one stale phrase in the repo,
because the phrase lives in `meta` and the test read descriptions and bodies. I
widened it, then proved it by reverting the data and watching it go red
([`390f6be`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass2-jnheinrich451-eng/commit/390f6be)).

That is the rule I now work by, and it changed what I accept back from the
agent: add the check, run it *before* the fix, and ask what it would have to see
in order to fail. Two agreement tests were built that way and reported failing
before anything was edited
([`0c29cbd`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass2-jnheinrich451-eng/commit/0c29cbd)).

It did not save me. My deck check compared a section's `scrollHeight` against
720, on a section that is a fixed 720-pixel box, so it could never exceed the
limit it was tested against. Two slides shipped at 98% of the canvas and clipped
on a screen that was not mine, and my reader found it before I did
([`1fc21a1`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass2-jnheinrich451-eng/commit/1fc21a1)).

I would rather submit that than a tidy account. The course argues that a green
number is not evidence. The thing I actually learned building it is that I trust
my own checks for the same reason the field trusts FID: they are cheap, they are
repeatable, and nobody looks past them.
