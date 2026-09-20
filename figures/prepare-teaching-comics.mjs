// Publishing derivatives only. Never edits the approved PNG masters.
// Run manually after artwork approval; builds use the checked-in WebP files.
import {readFile, mkdir} from 'node:fs/promises';
import sharp from 'sharp';
const root = new URL('../', import.meta.url);
const manifest = JSON.parse(await readFile(new URL('src/data/comic-artwork.json', root), 'utf8'));
await mkdir(new URL('public/comics/', root), {recursive: true});
for (const {id, source} of manifest) {
  const input = new URL(`assets/comics/${source}`, root);
  const stats = await sharp(await readFile(input)).stats();
  if (!stats.isOpaque) throw new Error(`${id}: select an approved opaque master before publishing`);
  for (const [suffix, width, quality] of [['preview', 640, 82], ['full', 1024, 92]]) {
    const output = new URL(`public/comics/${id}-${suffix}.webp`, root);
    const info = await sharp(await readFile(input)).resize({width, withoutEnlargement:true}).webp({quality}).toFile(output.pathname.replace(/^\/(\w:)/, '$1'));
    console.log(`${id} ${suffix}: ${info.width}x${info.height}, ${info.size} bytes; source ${source}`);
  }
}
