// The committed tree must build by itself.
//
// Every other check in this repo runs against the working tree, and the
// working tree can hold files nobody has committed. On 15 September two
// commits imported layouts and a component that existed only on one machine:
// every local check passed, and the tree that would ship could not build.
//
// This suite reads the git index instead of the disk. With nothing staged the
// index is HEAD; with something staged it is exactly the next commit. Either
// way, every relative import in a tracked source file has to resolve to a
// tracked file, so a commit that depends on something uncommitted fails here
// before it is pushed, whatever else happens to be lying in the working tree.

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { posix } from "node:path";
import { describe, expect, it } from "vitest";

const git = (...args: string[]) =>
  execFileSync("git", args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
const lines = (text: string) => text.split("\n").map((line) => line.trim()).filter(Boolean);

const tracked = new Set(lines(git("ls-files")));
// Files whose working copy differs from the index are read from the index, so
// uncommitted edits can neither break this check nor hide a break from it.
const differs = new Set(lines(git("diff", "--name-only")));
const indexed = (path: string) =>
  differs.has(path) ? git("show", `:${path}`) : readFileSync(path, "utf8");

const SOURCE = /^(src\/.+\.(astro|ts|mjs|js|css|md|mdx)|astro\.config\.ts)$/;
const IMPORT = /(?:\bfrom\s*|\bimport\s*\(\s*|\bimport\s+|@import\s+(?:url\()?)["'](\.{1,2}\/[^"']+)["']/g;
const LAYOUT = /^layout:\s*(\.{1,2}\/\S+)\s*$/m;
const RESOLVE = ["", ".ts", ".astro", ".css", ".mjs", ".js", "/index.ts"];

function unresolvedImports(): string[] {
  const found: string[] = [];
  for (const file of [...tracked].sort()) {
    if (!SOURCE.test(file)) continue;
    const text = indexed(file);
    const specifiers = [...text.matchAll(IMPORT)].map((match) => match[1]);
    const layout = LAYOUT.exec(text);
    if (layout) specifiers.push(layout[1]);
    for (const specifier of specifiers) {
      const target = posix.normalize(posix.join(posix.dirname(file), specifier.split("?")[0]));
      if (!RESOLVE.some((suffix) => tracked.has(target + suffix))) {
        found.push(`${file} imports ${specifier}, which is not tracked`);
      }
    }
  }
  return found;
}

describe("the committed tree is self-contained", () => {
  it("resolves every relative import in a tracked source file to a tracked file", () => {
    expect(unresolvedImports()).toEqual([]);
  });
});
