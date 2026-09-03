// spec/course-promises.test.ts
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const api = JSON.parse(readFileSync(resolve("dist/api/index.json"), "utf8"));
const nodes = api.nodes as { id: string; type: string; meta?: any; body?: string }[];
const sessions = nodes.filter((n) => n.type === "sessions");
const assessments = nodes.filter((n) => n.type === "assessments");

describe("the course's own promises", () => {
  it("assesses exactly 100%", () => {
    const total = assessments.reduce((s, a) => s + Number(a.meta?.weight ?? 0), 0);
    expect(total, `assessment weights sum to ${total}`).toBe(100);
  });

  it("teaches twelve weeks, one page each", () => {
    const weeks = sessions.map((s) => Number(s.meta?.week)).sort((a, b) => a - b);
    expect(weeks).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  });

  it("keeps its own vocabulary in use", () => {
    const later = sessions.filter((s) => Number(s.meta?.week) >= 5);
    const uses = later.filter((s) => /N-honest/.test(s.body ?? ""));
    expect(uses.length, "N-honest is coined in week 5 and must recur").toBeGreaterThan(2);
  });
});