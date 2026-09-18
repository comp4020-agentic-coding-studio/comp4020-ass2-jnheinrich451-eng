// No name on a page without a verified reading behind it.
//
// The rule in CLAUDE.md once said never to write an author or a year into a
// page. The pages did it twenty times, and all but one of those names had a
// verified entry in readings.ts, so the rule's wording was broken everywhere
// while its purpose was broken once: session 2 credited the closed form to
// "Dowson and Landau ... in 1982", a source from the author's own notes that
// never became an entry. This check holds the purpose instead of the wording.
//
// A surname a page names, as "X and colleagues" or "X and Y", has to belong to
// a reading. A year in the same sentence as a named author has to be that
// author's reading year. A year with no author beside it ("open one from 2019")
// is not a citation and is left alone.
//
// A token counts as a person's name only when it has lowercase letters and no
// digits, so an acronym ("FID and FID∞") or a dataset ("Kinetics-400 and
// Kinetics-600") never does. That is a rule, not a stoplist.

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { readings } from "../src/data/readings";

/** Surnames in an authors string: every "Surname," before the initials. */
export function surnames(authors: string): string[] {
  return [...authors.matchAll(/(\p{Lu}[\p{L}'’-]+),/gu)].map((m) => m[1]);
}

const yearsBySurname = new Map<string, Set<number>>();
for (const entry of Object.values(readings)) {
  for (const name of surnames(entry.authors)) {
    if (!yearsBySurname.has(name)) yearsBySurname.set(name, new Set());
    yearsBySurname.get(name)!.add(entry.year);
  }
}

const isName = (token: string) => /\p{Ll}/u.test(token) && !/\d/.test(token) && /^\p{Lu}/u.test(token);

function markdownFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    return statSync(path).isDirectory() ? markdownFiles(path) : path.endsWith(".md") ? [path] : [];
  });
}

interface Finding {
  file: string;
  problem: string;
}

function audit(): Finding[] {
  const findings: Finding[] = [];
  for (const file of markdownFiles("src/content")) {
    const prose = readFileSync(file, "utf8").split(/^---$/m).slice(2).join("---");
    for (const sentence of prose.split(/(?<=[.!?])\s+/)) {
      const named = new Set<string>();
      for (const m of sentence.matchAll(/\b([\p{L}][\p{L}'’-]{2,}) and colleagues\b/gu)) {
        if (isName(m[1])) named.add(m[1]);
      }
      for (const m of sentence.matchAll(/\b([\p{L}][\p{L}\d'’-]{2,}) and ([\p{L}][\p{L}\d'’-]{2,})\b/gu)) {
        if (m[2] !== "colleagues" && isName(m[1]) && isName(m[2])) {
          named.add(m[1]);
          named.add(m[2]);
        }
      }
      for (const name of named) {
        if (!yearsBySurname.has(name)) {
          findings.push({ file, problem: `names ${name}, who has no entry in readings.ts` });
        }
      }
      if (named.size === 0) continue;
      const allowed = new Set([...named].flatMap((name) => [...(yearsBySurname.get(name) ?? [])]));
      for (const m of sentence.matchAll(/\b(19\d\d|20[0-2]\d)\b/g)) {
        if (!allowed.has(Number(m[1]))) {
          findings.push({
            file,
            problem: `gives ${m[1]} beside ${[...named].join(" and ")}, which no reading of theirs carries`,
          });
        }
      }
    }
  }
  return findings;
}

describe("citations on the page are backed by readings.ts", () => {
  it("reads surnames out of every authors string, accents included", () => {
    expect(surnames("Chong, M. J. and Forsyth, D.")).toEqual(["Chong", "Forsyth"]);
    expect(surnames("Kynkäänniemi, T. et al.")).toEqual(["Kynkäänniemi"]);
    expect(surnames("Parmar, G., Zhang, R. and Zhu, J.-Y")).toEqual(["Parmar", "Zhang", "Zhu"]);
  });

  it("names no author, and dates no author, that readings.ts does not carry", () => {
    const findings = audit().map((f) => `${f.file.replace(/\\/g, "/")}: ${f.problem}`);
    expect(findings).toEqual([]);
  });

  it("gives every reading a verified date", () => {
    for (const [key, entry] of Object.entries(readings)) {
      expect(entry.verified, `${key} has no verified date`).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });
});
