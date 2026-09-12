import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { validatePlot, plotBounds } from '../src/lib/workspace-plot';
import { validateCells, exportCells, importCells } from '../src/lib/workspace-notebook';

describe('notebook persistence',()=>{
  it('round-trips multiple code cells through a Python export',()=>{
    const cells=['x = 6','print(x * 7)',''];
    expect(importCells(exportCells(cells))).toEqual(cells);
    expect(importCells('print(42)')).toEqual(['print(42)']);
    expect(importCells(exportCells(cells).replace(/\n/g,'\r\n'))).toEqual(cells);
  });
  it('rejects invalid or oversized notebook data',()=>{
    for(const input of [null,[],[42],Array(51).fill(''),['x'.repeat(200001)]])expect(()=>validateCells(input)).toThrow();
  });
});

const plot={title:'A measurement',xLabel:'N',yLabel:'Distance',series:[{name:'A',points:[[16,0.2],[128,0.04]]}]};
describe('workspace plot contract',()=>{
  it('accepts finite numeric data and no-plot runs',()=>{expect(validatePlot(plot)).toEqual(plot);expect(validatePlot(null)).toBeNull();});
  it('rejects nonfinite, oversized and malformed data',()=>{
    for(const value of [{}, {...plot,series:[]}, {...plot,series:[{name:'bad',points:[[1,NaN]]}]}, {...plot,series:[{name:'bad',points:Array(2001).fill([1,2])}]}])expect(()=>validatePlot(value)).toThrow();
  });
  it('gives constant and negative series finite nonzero axes',()=>{
    const bounds=plotBounds(validatePlot({...plot,series:[{name:'same',points:[[-2,0],[-2,0]]}]})!);
    expect(bounds.x[1]).toBeGreaterThan(bounds.x[0]);expect(bounds.y[1]).toBeGreaterThan(bounds.y[0]);
  });
  it('ships a static page, a readable starter and a local worker route',()=>{
    const html=readFileSync('dist/workspace/index.html','utf8');
    expect(html).toContain('workspace/python.worker.mjs');expect(html).toContain('default_rng(seed)');
    expect(html).toContain('not image-based FID');expect(html).toContain('No execution yet.');
    expect(readFileSync('dist/workspace/python.worker.mjs','utf8')).toContain('v0.27.7');
  });
});
