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
const bodies = new Map(sessions.map((s) => [s.id, bodyOf(s)]));
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

  it("has no stub weeks", () => {
    for (const s of sessions) {
      const n = words(body(s));
      expect(n, `week ${week(s)} (${s.id}) has ${n} words`).toBeGreaterThanOrEqual(250);
    }
  });
});
