# Process overview

## What I built

SLOP8412, *Advanced Fréchet Inception Distance*: a twelve-week course that
audits one number. It runs on a bench, one reference distribution and three
candidates in 2048 dimensions where every score has a closed form, re-scored
every week with that week's method. There is no separate curriculum document;
the site carries the whole course.

## How I got here

Assignment 1 lost most of its marks on response: the idea was in my head and
not on the page. So the harness came first this time. Three rules went into
`CLAUDE.md` before any content, and they outrank fluency: argue instead of
setting a mood, earn anything symbolic or cut it, and make non-adjacent weeks
need each other
([`3dde85d`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass2-jnheinrich451-eng/commit/3dde85d)).

My anchor was week 5. I read three papers first, Heusel, Chong and Forsyth,
and Bińkowski, kept the PDFs in the repo, and wrote that page myself before
anything else existed. It fixed the register, the bench, and the terms the
later checks look for. Everything else was written against it: I put the
structure in `build/SPINE.md` and the facts in `build/CONTENT.md`, and the
agent brought the repo into agreement with those files instead of inventing
content
([`c942868`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass2-jnheinrich451-eng/commit/c942868)).

From there the build was plain, and I would rather describe it honestly than
dress it up as breakthroughs. It was a loop. I gave instructions; the agent
built them and checked them against the spec; discrepancies came back; I
decided. Some decisions went into the instruction files, like the lateness
rule two pages stated differently, which became one sentence on the policies
page plus two agreement tests, run before the edit so we knew they could fail
([`0c29cbd`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass2-jnheinrich451-eng/commit/0c29cbd)).
Some I tolerated on purpose: week 5 stays at 589 words against a 350 to 500
range because it is the anchor, and its description says "four public
implementations" while the body hedges to "several", which I decided is fine.
The checking ran both ways too. The agent read my claims against the PDFs and
found my memory of Stein's method was right as a label and wrong as a design,
which would have sent students building the wrong study in week 9
([`0e76430`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass2-jnheinrich451-eng/commit/0e76430)).

Most of the bugs were one bug: a check that could not fail. A coherence test
was green because it read a field the API does not carry
([`224688b`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass2-jnheinrich451-eng/commit/224688b)).
A bias fit looked tidy and missed the true value by 35 times, because three
sample sizes sat below the dimension
([`3c9eb4b`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass2-jnheinrich451-eng/commit/3c9eb4b)).
The rule we settled on was to add the check, run it before the fix, and ask
what it has to see in order to fail. Even that was not enough: the deck check
compared a fixed box against its own height, and I found the clipped slides on
my own screen before any test did
([`1fc21a1`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass2-jnheinrich451-eng/commit/1fc21a1)).

No single step of this was hard. The real work was keeping my instructions,
the site, and the checks in agreement with each other, and that is mostly what
the commit history shows.
