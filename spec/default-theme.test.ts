import {readFileSync} from 'node:fs';
import {describe,it,expect} from 'vitest';

describe('first-visit dark theme',()=>{
  it('applies the default in the head while retaining the native theme toggle',()=>{
    for(const route of ['', 'lectures', 'lectures/week-01', 'sessions/01-the-number', 'assessments/final-report', 'workspace', 'math-lab', 'image-lab', 'memes', 'self-checks', 'people', 'policies']){
      const html=readFileSync(`dist/${route?route+'/':''}index.html`,'utf8');
      const head=html.slice(0,html.indexOf('</head>'));
      expect(head,route).toContain('data-course-default-theme');
      expect(head,route).toContain("var theme = 'dark'");
      expect(head,route).toContain("saved === 'light' || saved === 'dark'");
      expect(html,route).toContain('at-footer-theme-toggle');
    }
  });
});
