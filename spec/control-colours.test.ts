// A form control takes both its colours from the theme, or neither.
//
// Four panels (week 1's workbench and the week 7, 9 and 10 instruments) gave
// their selects and number inputs a hard-coded white background while the
// text colour came from the theme. In light mode that looked right; in dark
// mode the theme's text turned near-white on the same white field, and the
// values vanished. A static accessibility scan passed throughout, because it
// ran in the light theme. The week 5 extrapolator had it right: background
// from --at-bg, text from the theme, so both switch together.
//
// This holds the source to that: no rule that styles a select or an input may
// set a fixed white background.

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const FIXED_WHITE = /background(?:-color)?\s*:\s*(?:var\(--at-white[^)]*\)|#fff(?:fff)?\b|white\b)/i;

function components(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? components(path) : path.endsWith(".astro") ? [path] : [];
  });
}

describe("form controls switch with the theme", () => {
  it("never gives a select or input a fixed white background", () => {
    const findings: string[] = [];
    for (const file of components("src/components")) {
      const source = readFileSync(file, "utf8");
      for (const style of source.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)) {
        for (const rule of style[1].matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
          const selector = rule[1].trim();
          if (/\b(select|input)\b/.test(selector) && FIXED_WHITE.test(rule[2])) {
            findings.push(`${file.replace(/\\/g, "/")}: ${selector.replace(/\s+/g, " ")}`);
          }
        }
      }
    }
    expect(findings).toEqual([]);
  });
});
