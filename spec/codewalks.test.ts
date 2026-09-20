// The codewalk and its assessment cannot drift apart.
//
// Each assessment names a week for its in-person part ("Ten minutes, week 6").
// The codewalk page for that assessment has to sit in that week, two days
// after its session, and the two pages have to point at each other. Before
// this, the codewalk existed only as a sentence on the assessment page: a
// student reading week 6 had no way to know the week held a ten-minute
// examination, and a moved teaching week would have left the sentence behind.
//
// The capacity the page states is also checked against the grid it prints,
// so "fifty appointments" can never be a number nobody recomputed.

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { BLOCKS, CAPACITY, ROOMS, SLOTS_PER_BLOCK } from "../src/lib/codewalk-grid";

interface Node {
  id: string;
  type: string;
  meta: Record<string, unknown>;
}
const { nodes } = JSON.parse(readFileSync(resolve("dist/api/index.json"), "utf8")) as { nodes: Node[] };
const sessionDate = (week: number) => {
  const session = nodes.find((n) => n.type === "sessions" && Number(n.meta.week) === week);
  if (!session) throw new Error(`no session for week ${week}`);
  return new Date(String(session.meta.date));
};

const WALKS = [
  { id: "codewalk-a1", assessment: "a1-reproduce-the-number", week: 6 },
  { id: "codewalk-a2", assessment: "a2-break-the-number", week: 10 },
];

const html = (path: string) => readFileSync(resolve(path), "utf8");

describe("each codewalk stays tied to its assessment and its week", () => {
  it("prints a grid that adds up to the capacity it claims", () => {
    expect(CAPACITY).toBe(BLOCKS.length * SLOTS_PER_BLOCK * ROOMS.length);
    for (const walk of WALKS) {
      const page = html(`dist/sessions/${walk.id}/index.html`);
      expect(page, `${walk.id} does not state its capacity`).toContain(String(CAPACITY));
      for (const block of BLOCKS) expect(page).toContain(`${block.start}`);
      for (const room of ROOMS) expect(page).toContain(room);
    }
  });

  it("runs two days after the session of the week its assessment names", () => {
    for (const walk of WALKS) {
      const assessment = readFileSync(resolve(`src/content/assessments/${walk.assessment}.md`), "utf8");
      expect(assessment, `${walk.assessment} no longer names week ${walk.week}`).toContain(
        `Ten minutes, week ${walk.week}`,
      );
      const expected = new Date(sessionDate(walk.week));
      expected.setUTCDate(expected.getUTCDate() + 2);
      const page = html(`dist/sessions/${walk.id}/index.html`);
      expect(page, `${walk.id} is not dated two days after week ${walk.week}`).toContain(
        expected.toISOString().slice(0, 10),
      );
    }
  });

  it("links the assessment, its week's session and the policies page", () => {
    for (const walk of WALKS) {
      const page = html(`dist/sessions/${walk.id}/index.html`);
      const main = /<main[^>]*>([\s\S]*)<\/main>/.exec(page)?.[1] ?? "";
      expect(main, `${walk.id} does not link its assessment`).toContain(`/assessments/${walk.assessment}/`);
      expect(main, `${walk.id} does not link the policies page`).toContain("/policies/");
      // The assessment sends the reader back, so neither page is a dead end.
      const assessmentPage = html(`dist/assessments/${walk.assessment}/index.html`);
      expect(assessmentPage, `${walk.assessment} does not link its codewalk`).toContain(
        `/sessions/${walk.id}/`,
      );
    }
  });

  it("keeps the course-wide rules on the policies page", () => {
    // One statement per fact: a codewalk page explains its own day, never
    // lateness, extensions or re-marks.
    for (const walk of WALKS) {
      const main = /<main[^>]*>([\s\S]*)<\/main>/.exec(html(`dist/sessions/${walk.id}/index.html`))?.[1] ?? "";
      for (const rule of [/grace period/i, /late penalt/i, /re-?mark/i]) {
        expect(main, `${walk.id} restates a policy`).not.toMatch(rule);
      }
    }
  });

  it("shows the codewalk in the week listing, with its own date", () => {
    const listing = html("dist/sessions/index.html");
    for (const walk of WALKS) {
      expect(listing, `week ${walk.week} does not offer its codewalk`).toContain(`/sessions/${walk.id}/`);
    }
  });

  it("names the codewalk on the session page of the week that holds it", () => {
    // The listing is not enough: a reader who lands on week 6 from anywhere
    // else has to meet the examination on that page, where they are standing.
    for (const walk of WALKS) {
      const session = nodes.find((n) => n.type === "sessions" && Number(n.meta.week) === walk.week)!;
      const slug = String(session.id).split("/").pop();
      const main = /<main[^>]*>([\s\S]*)<\/main>/.exec(html(`dist/sessions/${slug}/index.html`))?.[1] ?? "";
      expect(main, `week ${walk.week}'s session page does not link its codewalk`).toContain(
        `/sessions/${walk.id}/`,
      );
    }
  });
});
