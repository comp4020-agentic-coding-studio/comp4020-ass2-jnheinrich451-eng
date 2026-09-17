# Process overview

## What I built

SLOP8412, *Advanced Fréchet Inception Distance*: a twelve-week course that
audits one number. It runs on a bench, one reference distribution and three
candidates in 2048 dimensions where every score has a closed form, re-scored
every week with that week's method. There is no separate curriculum document;
the site carries the whole course.

## How I got here

Assignment 1 scored weakest on response: the idea was in my head and not on the
page. So the harness came first. Three rules went into `CLAUDE.md` before any
content, and they outrank fluency: argue instead of setting a mood, earn
anything symbolic or cut it, and make non-adjacent weeks need each other
([`3dde85d`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass2-jnheinrich451-eng/commit/3dde85d)).

My anchor was week 5. I read three papers first, logged each in `readings.ts`
with a verified date, and wrote that page myself before anything else existed.
It fixed the register, the bench, and the terms the later checks look for.
Everything else was written against it: structure in `build/SPINE.md`, facts in
`build/CONTENT.md`, and the agent brought the repo into agreement with them
instead of inventing content ([`c942868`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass2-jnheinrich451-eng/commit/c942868)).

From there the build was plain, and I would rather describe it honestly than
dress it up as breakthroughs. It was a loop. I gave instructions; the agent
built them and checked them against the spec; discrepancies came back; I
decided. Some decisions went into the instruction files: a lateness rule two pages
stated differently became one sentence on the policies page plus two agreement
tests, run before the edit so we knew they could fail
([`0c29cbd`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass2-jnheinrich451-eng/commit/0c29cbd)).

Most of the bugs were one bug: a check that could not fail. A coherence test was
green because it read a field the API does not carry ([`224688b`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass2-jnheinrich451-eng/commit/224688b)). A bias fit
looked tidy and missed the true value by 35 times ([`3c9eb4b`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass2-jnheinrich451-eng/commit/3c9eb4b)). The rule we settled on:
add the check, run it before the fix, and ask what it has to see in order to
fail. Even that was not enough: a deck check compared a fixed
box against its own height, and I found the clipped slides on my own screen
before any test did ([`1fc21a1`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass2-jnheinrich451-eng/commit/1fc21a1)).

FID is a number, and a number teaches nothing by itself. So the second half asked how to
make it visible, and how to let a student reach it alone, from the maths, from
code they run, and from real images. The labs and lecture instruments are that
experiment, runnable in the page, with indexes and a menu that jump from a
session to the week it needs ([`30f9e85`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass2-jnheinrich451-eng/commit/30f9e85)).

Building them added a step to the loop: measure first, pin the numbers, build
second. Week 5's ladder reports its own imprecision because that is what the
measurement showed ([`df3ef05`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass2-jnheinrich451-eng/commit/df3ef05)). Week 7 went further: the page claimed two
newer scores catch what FID misses, and measured, neither does. A cubic kernel
cannot see past the third moment, and the candidate matches three. The week's
argument changed to the true one ([`2b2ffc2`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass2-jnheinrich451-eng/commit/2b2ffc2)).

The worst failure was the same bug one level up. Every check ran on my working
tree, which held files nobody had committed, so eight commits went out green
while the tree that would ship could not build. The repair was at the harness
level: a check that reads the git index rather than the disk, and a rule that a
check proves the tree it ran on ([`dbad4d6`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass2-jnheinrich451-eng/commit/dbad4d6)).

No single step of this was hard. The real work was keeping my instructions, the
site, and the checks in agreement with each other, and that is mostly what the
commit history shows.
