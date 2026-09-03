// spec/course-promises.test.ts
//
// Promises this course makes that the build cannot check.
// Runs against dist/api/index.json, like data-integrity.test.ts.

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

type Node = { id: string; type: string; meta?: Record<string, any>; body?: string };

const api = JSON.parse(readFileSync(resolve("dist/api/index.json"), "utf8"));
const nodes: Node[] = api.nodes;
const sessions = nodes.filter((n) => n.type === "sessions");
const assessments = nodes.filter((n) => n.type === "assessments");

const week = (n: Node) => Number(n.meta?.week);
const sessionIds = new Set(sessions.map((s) => s.id));
const firstSentence = (s: string) =>
  s.trim().split(/(?<=[.!?])\s/)[0]?.toLowerCase().replace(/\s+/g, " ") ?? "";

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
      const related: string[] = s.meta?.related ?? [];
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
    const uses = later.filter((s) => /\bN-honest/.test(s.body ?? ""));
    expect(uses.length, "N-honest must recur in at least three later weeks").toBeGreaterThanOrEqual(3);
  });

  it("returns to the bench in most weeks", () => {
    const uses = sessions.filter((s) => /\bthe bench\b/i.test(s.body ?? ""));
    expect(uses.length, "the bench is the running artefact; it should appear in most weeks").toBeGreaterThanOrEqual(8);
  });
});

describe("twelve weeks that do not repeat one another", () => {
  it("never opens two sessions with the same sentence", () => {
    const openers = sessions.map((s) => firstSentence(s.body ?? ""));
    const dupes = openers.filter((o, i) => o && openers.indexOf(o) !== i);
    expect(dupes, `duplicate openers: ${dupes.join(" | ")}`).toEqual([]);
  });

  it("never gives two sessions the same description", () => {
    const descs = sessions.map((s) => String(s.meta?.description ?? "").trim());
    expect(new Set(descs).size).toBe(descs.length);
  });

  it("has no stub weeks", () => {
    for (const s of sessions) {
      const words = (s.body ?? "").split(/\s+/).filter(Boolean).length;
      expect(words, `week ${week(s)} (${s.id}) has ${words} words`).toBeGreaterThanOrEqual(250);
    }
  });
});
