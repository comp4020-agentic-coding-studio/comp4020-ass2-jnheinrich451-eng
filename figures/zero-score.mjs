import { writeFileSync } from 'node:fs';
// Same C as moments-only.py: equal mixture, means ±0.9, variance 0.19.
const a = 0.9, variance = 1 - a * a;
const normal = (x, mean = 0, v = 1) => Math.exp(-((x - mean) ** 2) / (2 * v)) / Math.sqrt(2 * Math.PI * v);
const points = Array.from({ length: 321 }, (_, i) => {
  const x = -4 + i / 40;
  return { x, r: normal(x), c: (normal(x, a, variance) + normal(x, -a, variance)) / 2 };
});
console.log(JSON.stringify({ a, componentVariance: variance, mean: 0, totalVariance: a * a + variance, fid: 0, points }));
const path = key => points.map((p, i) => `${i ? 'L' : 'M'}${(50 + (p.x + 4) * 62.5).toFixed(2)},${(265 - p[key] * 440).toFixed(2)}`).join(' ');
writeFileSync(new URL('../src/assets/figures/zero-score.svg', import.meta.url), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 320" role="img" aria-labelledby="zero-title zero-desc">
<title id="zero-title">Different shapes with identical first two moments</title>
<desc id="zero-desc">R has one peak at zero. C has two peaks near minus and plus 0.9. Both have mean zero and variance one. Their fitted Gaussian densities coincide.</desc>
<path class="axis" d="M50 265H550 M300 40V265"/>
<path class="reference" d="${path('r')}"/>
<path class="candidate" d="${path('c')}"/>
<path class="fitted" d="${path('r')}"/>
<g class="ticks"><text x="50" y="289">−4</text><text x="175" y="289">−2</text><text x="300" y="289">0</text><text x="425" y="289">2</text><text x="550" y="289">4</text><text x="300" y="313">Feature coordinate e₁</text></g>
</svg>\n`);
