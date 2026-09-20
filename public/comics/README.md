# Teaching comic web assets

Seventeen approved AI-generated comics, using the author's supplied character
references and directed storyboards. These are scripted fictional conversations,
not live model responses or official character endorsements. They supplement
the course explanations, not measured experimental figures.

`src/data/comic-artwork.json` maps stable quiz IDs to the approved PNG versions
and accessible scene descriptions. Core dialogue and mathematical caveats are
in `src/data/teaching-comics.ts`; Lecture 1 has an expanded transcript in the
artwork manifest. Session 1 uses the corrected opaque v2, not transparent v1.

The author keeps full PNG masters and generation prompts in the locally ignored
`assets/comics/` folder. Run `node figures/prepare-teaching-comics.mjs` manually
when updating approved art. It emits 640px previews and 1024px reading copies
without modifying the masters. Commit these WebP derivatives with the manifest;
the website build never needs the ignored originals or an image-generation API.

Cards load previews only after they are available and expanded. Full-size files
load when the reader opens. Unlocks are playful local flags, not access control.
Do not put sensitive material in these publicly served files.
