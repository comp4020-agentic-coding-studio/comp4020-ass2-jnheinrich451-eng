// The reader produces the failure before the prose names it.
//
// The author's sentence in CLAUDE.md promises instruments that let the reader
// produce each failure with their own clicks before the prose names it. The
// panels render after the whole prose body, so any page that stated its
// outcome in the prose had already told the reader before they could click:
// week 7 carried a heading, "What none of them catches", above the strips
// built to show exactly that.
//
// Instructions stay in the prose, because a student needs to know what to
// press. The outcome goes in a closed "Expected results" fold, between the
// instructions and the panel, for checking a reading after the run. This
// check holds the order, and holds that the outcome is stated nowhere else in
// the page's main content.

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

interface PanelPage {
  path: string;
  panel: string;
  /** Sentences that state the outcome, and may appear only inside the fold. */
  outcome: RegExp[];
}

const PAGES: PanelPage[] = [
  {
    path: "dist/sessions/07-dropping-the-gaussian/index.html",
    panel: "data-ts",
    outcome: [/both score it 0/, /do no better on this bench/, /has lost it by sixteen/],
  },
  {
    path: "dist/lectures/week-08/index.html",
    panel: "data-xi",
    outcome: [/rank F higher/, /rank E higher/],
  },
];

const FOLD = /<details class="expected-results"([^>]*)>([\s\S]*?)<\/details>/;

describe("a panel's outcome waits in a fold until the reader has run it", () => {
  for (const page of PAGES) {
    const html = readFileSync(page.path, "utf8");
    const main = /<main[^>]*>([\s\S]*)<\/main>/.exec(html)?.[1] ?? "";
    const fold = FOLD.exec(main);

    it(`${page.path}: has one closed Expected results fold`, () => {
      expect(fold, "no Expected results fold").not.toBeNull();
      expect(main.match(new RegExp(FOLD.source, "g"))).toHaveLength(1);
      expect(fold![1], "the fold must start closed").not.toMatch(/\bopen\b/);
      expect(fold![2]).toMatch(/<summary>\s*Expected results\s*<\/summary>/);
    });

    it(`${page.path}: puts instructions, then the fold, then the panel`, () => {
      const foldAt = main.indexOf(fold![0]);
      const panelAt = main.search(new RegExp(`<section[^>]*\\b${page.panel}\\b`));
      expect(panelAt, "panel not found").toBeGreaterThan(-1);
      expect(foldAt).toBeLessThan(panelAt);
      expect(main.slice(0, foldAt), "no instruction before the fold").toMatch(/write down/i);
    });

    it(`${page.path}: states the outcome only inside the fold`, () => {
      const inside = fold![2];
      const outside = main.replace(fold![0], "");
      for (const sentence of page.outcome) {
        expect(inside, `the fold lost ${sentence}`).toMatch(sentence);
        expect(outside, `${sentence} is stated outside the fold`).not.toMatch(sentence);
      }
    });
  }
});
