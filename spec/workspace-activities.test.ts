import {readFileSync, existsSync} from 'node:fs';
import {describe, it, expect} from 'vitest';
import {workspaceActivities} from '../src/data/workspace-activities';

const read = (path: string) => readFileSync(path, 'utf8');
describe('contextual workspace activities', () => {
  it('keeps the intended teaching and assessment coverage explicit', () => {
    expect(Object.keys(workspaceActivities).sort()).toEqual([
      'sessions/02-frechet-distance', 'sessions/03-the-instrument',
      'sessions/04-getting-it-right', 'sessions/05-the-bias', 'sessions/06-blind-spots',
      'lectures/week-02', 'lectures/week-05', 'lectures/week-08', 'lectures/week-11',
      'assessments/measurement-log', 'assessments/a1-reproduce-the-number',
      'assessments/a2-break-the-number', 'assessments/final-report',
    ].sort());
  });
  for (const [route, activity] of Object.entries(workspaceActivities)) {
    it(`renders five steps and working, base-aware links on ${route}`, () => {
      expect(existsSync(`src/content/${route}.md`)).toBe(true);
      const html = read(`dist/${route}/index.html`);
      const block = html.match(/<section\b[^>]*id="workspace-activity"[\s\S]*?<\/section>/)?.[0];
      expect(block).toBeDefined();
      expect(html.match(/id="workspace-activity"/g)).toHaveLength(1);
      expect(html).toContain('href="#workspace-activity"');
      const headings = [...block!.matchAll(/<h3\b[^>]*>([\s\S]*?)<\/h3>/g)]
        .map(m => m[1].replace(/<[^>]+>/g, '').replace(/^\d+\s*/, '').trim());
      expect(headings).toEqual(['Predict', 'Open the lab', 'Record', 'Result', 'Explain the limitation']);
      for (const key of ['predict', 'open', 'record', 'result', 'limitation'] as const) {
        expect(activity[key].length).toBeGreaterThan(30);
      }
      // The built canonical URL tells us the actual deployment prefix in local and CI builds.
      const canonical = html.match(/<link\b[^>]*rel="canonical"[^>]*href="([^"]+)"/)?.[1];
      expect(canonical).toBeDefined();
      const prefix = new URL(canonical!).pathname.slice(0, -`${route}/`.length);
      expect(block).toContain(`href="${prefix}${activity.lab.href.slice(1)}"`);
      expect(block).toContain(`href="${prefix}policies/#browser-workspaces"`);
      const [path, anchor] = activity.lab.href.split('#');
      const target = read(`dist${path}index.html`);
      if (anchor) expect(target).toContain(`id="${anchor}"`);
    });
  }
  it('does not offer the covariance lab as human-ranking correlation or claim image shuffle tests FVD', () => {
    expect(workspaceActivities['sessions/10-correlation']).toBeUndefined();
    expect(workspaceActivities['lectures/week-08'].limitation).toContain('does not establish that FVD ignores frame order');
    expect(workspaceActivities['sessions/04-getting-it-right'].limitation).toContain('does not compare resize filters');
  });
  it('preserves the boundary between supplementary practice and assessed evidence', () => {
    expect(workspaceActivities['assessments/measurement-log'].limitation).toContain('does not replace the twelve weekly entries');
    expect(workspaceActivities['assessments/measurement-log'].limitation).toContain('FID∞ as not computed');
    expect(workspaceActivities['assessments/a1-reproduce-the-number'].limitation).toContain('not a reproduction of a published result');
    expect(workspaceActivities['assessments/a2-break-the-number'].limitation).toContain('Shuffling alone is not an A2 counterexample');
    expect(workspaceActivities['assessments/final-report'].limitation).toContain('do not replace the final report');
    const policy = read('dist/policies/index.html');
    expect(policy).toContain('id="browser-workspaces"');
    for (const path of ['/math-lab/', '/workspace/', '/image-lab/']) expect(policy).toContain(`${path}"`);
    expect(policy).toContain('code you run can access the network');
  });
});
