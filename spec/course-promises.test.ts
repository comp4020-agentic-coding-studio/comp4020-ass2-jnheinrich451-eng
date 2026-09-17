// spec/course-promises.test.ts
//
// Promises this course makes that the build cannot check.
//
// Two files, not one. dist/api/index.json carries the node list, but only
// the scheduling keys reach its `meta` — `related`, `description`, `spec`
// and `title` sit at the top level of a node, and `body` is not in the
// index at all. Prose lives only in the per-entry JSON, at
// dist/api/<collection>/<slug>.json, which is what a node's id already
// spells. Reading body off an index node yields undefined, which makes a
// word-count assertion fail forever and a duplicate-prose assertion pass
// vacuously; the guard below is here so that mistake fails loudly rather
// than reporting a green suite that checked nothing.

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

type Node = {
  id: string;
  type: string;
  description?: string;
  related?: string[];
  meta?: Record<string, any>;
};

const api = JSON.parse(readFileSync(resolve("dist/api/index.json"), "utf8"));
const nodes: Node[] = api.nodes;
const sessions = nodes.filter((n) => n.type === "sessions");
const assessments = nodes.filter((n) => n.type === "assessments");

/** A node's id is `<collection>/<slug>`, which is also its per-entry path. */
const bodyOf = (n: Node): string => {
  const entry = JSON.parse(readFileSync(resolve("dist/api", `${n.id}.json`), "utf8"));
  return entry.body ?? "";
};
const bodies = new Map(nodes.map((n) => [n.id, bodyOf(n)]));

/** A course-wide rule belongs in one place. The policies page is an ordinary
 *  page copied into the API as its own collection, so it is addressed like
 *  any other node: its id is `policies/index`. */
const pageBody = (collection: string): string => {
  const node = nodes.find((n) => n.type === collection);
  if (!node) throw new Error(`no ${collection} node in the API to read`);
  return bodies.get(node.id) ?? "";
};

const assessmentsWithBody = assessments.map((a) => ({ ...a, body: bodies.get(a.id) ?? "" }));
const body = (n: Node) => bodies.get(n.id) ?? "";
const words = (s: string) => s.split(/\s+/).filter(Boolean).length;

const week = (n: Node) => Number(n.meta?.week);
const sessionIds = new Set(sessions.map((s) => s.id));
const firstSentence = (s: string) =>
  s.trim().split(/(?<=[.!?])\s/)[0]?.toLowerCase().replace(/\s+/g, " ") ?? "";

describe("the body loader", () => {
  // The one week whose prose is written. If this fails, every assertion
  // below that reads a body is meaningless, whatever colour it reports.
  it("reads week 5's prose, so the prose checks are testing something", () => {
    const n = words(bodies.get("sessions/05-the-bias") ?? "");
    expect(n, `sessions/05-the-bias body read as ${n} words`).toBeGreaterThan(400);
  });
});

describe("assessment", () => {
  it("adds up to exactly 100", () => {
    const total = assessments.reduce((sum, a) => sum + Number(a.meta?.weight ?? 0), 0);
    expect(total, `weights sum to ${total}`).toBe(100);
  });
});

describe("twelve weeks", () => {
  it("has exactly one session per week, 1 to 12", () => {
    const weeks = sessions.map(week).sort((a, b) => a - b);
    expect(weeks).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  });

  it("connects every session from week 3 on to a non-adjacent earlier week", () => {
    const byId = new Map(sessions.map((s) => [s.id, s]));
    for (const s of sessions.filter((s) => week(s) >= 3)) {
      const related: string[] = s.related ?? [];
      const earlier = related
        .filter((r) => sessionIds.has(r))
        .map((r) => week(byId.get(r)!))
        .filter((w) => week(s) - w >= 2);
      expect(earlier.length, `week ${week(s)} (${s.id}) has no non-adjacent backward edge`).toBeGreaterThan(0);
    }
  });
});

describe("the idea accumulates", () => {
  it("keeps N-honest in use after it is coined in week 5", () => {
    const later = sessions.filter((s) => week(s) > 5);
    const uses = later.filter((s) => /\bN-honest/.test(body(s)));
    expect(uses.length, "N-honest must recur in at least three later weeks").toBeGreaterThanOrEqual(3);
  });

  it("returns to the bench in most weeks", () => {
    const uses = sessions.filter((s) => /\bthe bench\b/i.test(body(s)));
    expect(uses.length, "the bench is the running artefact; it should appear in most weeks").toBeGreaterThanOrEqual(8);
  });
});

describe("twelve weeks that do not repeat one another", () => {
  it("never opens two sessions with the same sentence", () => {
    const openers = sessions.map((s) => firstSentence(body(s)));
    const dupes = openers.filter((o, i) => o && openers.indexOf(o) !== i);
    expect(dupes, `duplicate openers: ${dupes.join(" | ")}`).toEqual([]);
  });

  it("never gives two sessions the same description", () => {
    const descs = sessions.map((s) => String(s.description ?? "").trim());
    expect(new Set(descs).size).toBe(descs.length);
  });

  // The range the author sets in CLAUDE.md: 300 to 800 words. A week with no
  // lecture has to teach in the session, so the ceiling is generous, and the
  // floor refuses a stub. Both ends are checked: a session that quietly grows
  // past the ceiling is as much a drift as one that was never written.
  it("keeps every session inside the author's word range", () => {
    for (const s of sessions) {
      const n = words(body(s));
      expect(n, `week ${week(s)} (${s.id}) has ${n} words`).toBeGreaterThanOrEqual(300);
      expect(n, `week ${week(s)} (${s.id}) has ${n} words`).toBeLessThanOrEqual(800);
    }
  });
});

describe("a rule is stated in one place", () => {
  // A fact stated on three pages is a fact that can disagree with itself. The
  // build already refuses a link that points nowhere; this refuses a rule that
  // has been copied instead of linked.
  it("states course-wide rules once, on the policies page", () => {
    const rules = [/late submissions are not accepted/i, /grace period/i, /must be disclosed/i];
    const policies = pageBody("policies");
    for (const rule of rules) {
      expect(policies, `${rule} missing from policies`).toMatch(rule);
      for (const a of assessmentsWithBody) {
        expect(a.body, `${a.id} restates ${rule}`).not.toMatch(rule);
      }
    }
  });

  it("every assessment links to the policies page", () => {
    for (const a of assessmentsWithBody) {
      expect(a.body, `${a.id} does not link to /policies/`).toMatch(/\]\(\/policies\/?\)/);
    }
  });
});

describe("the course's vocabulary", () => {
  it("uses the course's coined terms consistently", () => {
    // Criterion names are prose a student reads on the page, so they belong to
    // the vocabulary even though they arrive through `meta` rather than through
    // the body. Reading only description and body left this assertion unable to
    // fail on the single instance of the phrase in the repo.
    const criteria = (n: Node): string =>
      (n.meta?.marking?.criteria ?? []).map((c: { name: string }) => c.name).join(" ");
    const everything = [...sessions, ...assessments]
      .map((n) => `${n.description ?? ""} ${criteria(n)} ${body(n)}`)
      .join("\n");
    // the two-layer distinction is always estimator / quantity
    expect(everything).not.toMatch(/estimator or the instrument/i);
    // "the instrument" is coined in week 3 and never before it
    for (const s of sessions.filter((s) => week(s) < 3)) {
      expect(body(s), `${s.id} uses "the instrument" before week 3 coins it`).not.toMatch(
        /\bthe instrument\b/i,
      );
    }
    // "N-honest" is coined in week 5 and never before it
    for (const s of sessions.filter((s) => week(s) < 5)) {
      expect(body(s), `${s.id} uses "N-honest" before week 5 coins it`).not.toMatch(/N-honest/);
    }
  });
});
