// The running artefact, in every week.
//
// The measurement log is the one thing built across all twelve weeks, and its
// page promises "twelve entries, one per teaching week". That promise is only
// true if every week tells a student what its entry is. Before this check, five
// weeks never mentioned the log at all, and two others only in passing.
//
// Each session carries a `log` line naming its own contribution; the page
// renders it and links to the log. The log's requirements stay on the log page,
// so a session states what it contributes and never restates the rule.

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

interface Node {
  id: string;
  type: string;
  meta: Record<string, unknown>;
}
const { nodes } = JSON.parse(readFileSync(resolve("dist/api/index.json"), "utf8")) as { nodes: Node[] };
const sessions = nodes
  .filter((n) => n.type === "sessions")
  .sort((a, b) => Number(a.meta.week) - Number(b.meta.week));

describe("the measurement log is fed by every week", () => {
  it("has twelve weeks, each naming what its entry contains", () => {
    expect(sessions).toHaveLength(12);
    for (const session of sessions) {
      const line = session.meta.log;
      expect(typeof line, `week ${session.meta.week} has no log line`).toBe("string");
      expect(String(line).split(/\s+/).length, `week ${session.meta.week}'s log line`).toBeGreaterThan(5);
    }
  });

  it("says something different every week", () => {
    const lines = sessions.map((s) => String(s.meta.log ?? "").trim());
    expect(new Set(lines).size, "two weeks contribute the same entry").toBe(lines.length);
  });

  it("links every session page to the log, from the page itself", () => {
    // Two traps, both hit on the first attempt. The API's id carries its
    // collection ("sessions/08-video"), so the path needs the last segment
    // only. And the course navigation links to the log from every page, so a
    // whole-page search would pass with the section deleted: this looks inside
    // <main>.
    for (const session of sessions) {
      const slug = String(session.id).split("/").pop();
      const page = readFileSync(resolve(`dist/sessions/${slug}/index.html`), "utf8");
      const main = /<main[^>]*>([\s\S]*)<\/main>/.exec(page)?.[1] ?? "";
      expect(main, `week ${session.meta.week} has no log section of its own`).toContain("log-entry");
      expect(main, `week ${session.meta.week} does not link to the log`).toContain(
        "/assessments/measurement-log/",
      );
    }
  });

  it("keeps the log's own rules on the log page", () => {
    // The requirement is stated once, where it belongs; a session that
    // restated it would be the drift this check exists to catch.
    const log = readFileSync(resolve("src/content/assessments/measurement-log.md"), "utf8");
    expect(log).toMatch(/one per teaching week/i);
    const restating = sessions.filter((s) =>
      /twelve entries|one per teaching week/i.test(String(s.meta.log ?? "")),
    );
    expect(
      restating.map((s) => s.meta.week),
      "a session restates the log's rule",
    ).toEqual([]);
  });
});
