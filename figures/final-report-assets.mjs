// Reuse the installed Slop shield; generate the exact bitmap used by pdfLaTeX.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {join} from 'node:path';
import sharp from 'sharp';
const output=process.argv[2];
if(!output)throw new Error('Pass the template staging directory.');
await mkdir(output,{recursive:true});
const source=await readFile('node_modules/astro-theme-slop/assets/slop-crest.svg');
await writeFile(join(output,'slop-crest.svg'),source);
await sharp(source,{density:600}).resize(384,384).png().toFile(join(output,'slop-crest.png'));
await writeFile(join(output,'SLOP-BRAND-LICENSE.txt'),await readFile('node_modules/astro-theme-slop/LICENSE'));
console.log('Slop shield: original 46 × 46 viewbox; generated 384 × 384 transparent PNG. No measurement data.');
