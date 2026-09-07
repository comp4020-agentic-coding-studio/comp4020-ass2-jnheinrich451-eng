import { writeFileSync } from 'node:fs';

// Orthogonal projection onto the all-ones direction and a perpendicular axis.
const d = 2048;
const cases = [
  { id: 'R', x: 400, y: 145, mean: 0, variance: 1, score: 0 },
  { id: 'A', x: 200, y: 410, mean: 0.05 * Math.sqrt(d), variance: 1, score: d * 0.05 ** 2 },
  { id: 'B', x: 600, y: 410, mean: 0, variance: 1.1, score: d * (Math.sqrt(1.1) - 1) ** 2 },
];
const radii = [0.5, 1, 1.5, 2, 2.5, 3];
const unit = 31;
console.log(JSON.stringify({ d, unit, radii, cases }, null, 2));
const groups = cases.map(({id, x, y, mean, variance}) => {
  const cx = x + mean * unit;
  return `<g data-distribution="${id}">
    <path class="axes" d="M${x-120} ${y}h240 M${x} ${y-115}v230"/>
    <circle class="origin" cx="${x}" cy="${y}" r="3"/>
    ${radii.map(r => `<circle class="contour" cx="${cx}" cy="${y}" r="${r * Math.sqrt(variance) * unit}"/>`).join('\n')}
    <circle class="mean-halo" cx="${cx}" cy="${y}" r="12"/>
    <circle class="mean" cx="${cx}" cy="${y}" r="4"/>
    <text x="${x-110}" y="${y-105}" class="label">${id}</text>
    <text x="${x}" y="${y+133}" class="condition">${id === 'R' ? 'REFERENCE' : id === 'A' ? 'MEAN SHIFT' : 'WIDER SPREAD'}</text>
  </g>`;
}).join('\n');
writeFileSync(new URL('../src/assets/figures/hero-benchmark.svg', import.meta.url), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 570" role="img" aria-labelledby="hero-bench-title hero-bench-desc">
<title id="hero-bench-title">Reference and candidate Gaussian contours</title>
<desc id="hero-bench-desc">Separate panels on the same scale. R is centred at zero. A shifts 2.263 units along the all-ones direction. B stays centred and has standard deviation 1.049. Contours run from 0.5 to 3 standard deviations.</desc>
${groups}
</svg>\n`);
