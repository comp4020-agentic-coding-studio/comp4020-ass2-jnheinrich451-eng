# Process overview

## Motivation

SLOP8412, *Advanced Fréchet Inception Distance*: a twelve-week course that
audits one number, re-scored every week with that week's method.

I chose the topic for the brief's constraint, narrow enough that no real
university would run it. FID has three layers, the mathematics, an
implementation and a use in computer vision, so difficulty rises in that order
and the concepts stay related. Level 8 because it assumes probability and code.
Every score on the bench having a closed form is what let me tell whether the
agent's output was true.

The next step was to turn the spec into guidelines that both the agent and I could understand.

## Guidelines

Three rules went into `CLAUDE.md`:
Rule 1, argue instead of setting a mood; Rule 2, earn anything symbolic or cut it; and Rule 3, make
non-adjacent weeks need each other ([`3dde85d`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass2-jnheinrich451-eng/commit/3dde85d)). Later the course team's advice became one sentence every page is judged against ([`ca3e465`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass2-jnheinrich451-eng/commit/ca3e465)).

A rule I kept re-applying by hand became a check. A coined term never appears
before the week that coins it ([`390f6be`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass2-jnheinrich451-eng/commit/390f6be)); every week names its measurement-log entry
([`7772ffa`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass2-jnheinrich451-eng/commit/7772ffa)).

The rules are the skeleton. Some sections drifted after later edits, and manual verification brought them back. Some parts are exceptions: the week 12 session has no instrument.

The spec requires one real slide deck, so the week 2 lecture has one and the other lectures carry instruments. Twelve sessions and four formal lectures, three weeks apart in weeks 2, 5, 8 and 11, avoid twelve repetitive lectures.


## How I got here

My anchor was week 5: I read three papers and wrote that page myself ([`3dde85d`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass2-jnheinrich451-eng/commit/3dde85d)), and
everything else was written against it ([`c942868`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass2-jnheinrich451-eng/commit/c942868)).

I used the mathematics and the papers as the course's structure. Each session was an idea, paragraphs, then a check I accepted or pushed back on.

Four issues show how I worked, each ending in a change to the harness
rather than a one-off repair.

- **The text was wrong; a measurement caught it** ([`2b2ffc2`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass2-jnheinrich451-eng/commit/2b2ffc2)). Week 7
  claimed KID and coverage catch C, which FID scores as zero. Measured, C sits inside R-again's range in every strip: KID's cubic kernel
  stops at the third moment, where C still matches R. I took the argument the
  measurement supported, that nobody sees C.

![Week 7's instrument at the bench's 2048 dimensions after five presses: KID separates A, density and coverage separate B, and C's dots sit inside R-again's range in all three strips.](docs/process/week7-nobody-sees-c.png)

- **The checks were wrong; the harness caught it** ([`dbad4d6`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass2-jnheinrich451-eng/commit/dbad4d6)). Eight
  commits went out green while HEAD could not build, because every check ran
  on a working tree holding uncommitted files. The fix was a check that reads
  the git index, and a rule that a check proves only the tree it ran on. It paid
  before shipping: the same clean copy caught a template fingerprint that
  matched only on the machine that generated it ([`bc4849e`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass2-jnheinrich451-eng/commit/bc4849e)).

- **I asked what a panel did before calling it clear** ([`6d7e81e`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass2-jnheinrich451-eng/commit/6d7e81e)). Having
  the agent explain each instrument's arithmetic showed where a page leaned on
  what I already knew. Week 1 gained a key to R, A, B and C; week 11's
  verdict now names its instrument. The additions say what to press;
  the result still waits in the fold.

- **The agent was half right; I corrected it** ([`626b7b2`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass2-jnheinrich451-eng/commit/626b7b2)). It found that
  every page named its result before the reader could click, against my own
  sentence, and proposed reworking six pages. I objected that students need
  instructions first: only the observed outcome moved into an "Expected
  results" fold, held by a check.

Seventeen ungraded self-checks and their comics came last ([`4319e9d`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass2-jnheinrich451-eng/commit/4319e9d)): the same mistakes in a lighter voice. The course's own register does not change.
