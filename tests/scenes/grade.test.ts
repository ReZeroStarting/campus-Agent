import { describe, it, expect } from 'vitest';
import { handleGradeQuery } from '../../src/scenes/grade.js';

describe('Scene: 绩点计算器', () => {
  it('"绩点多少" returns GPA overview', () => {
    const r = handleGradeQuery('绩点多少');
    expect(r.text).toContain('GPA');
    expect(r.text).toContain('学分');
    expect(r.suggestions.length).toBeGreaterThan(0);
  });

  it('"够不够3.5" returns target analysis', () => {
    const r = handleGradeQuery('够不够3.5');
    expect(r.text).toContain('3.5');
  });

  it('"有没有挂科" checks failing grades', () => {
    const r = handleGradeQuery('有没有挂科');
    expect(r.text.length).toBeGreaterThan(0);
  });

  it('"绩点趋势" returns trend chart', () => {
    const r = handleGradeQuery('绩点趋势');
    expect(r.text).toMatch(/上升|下降|持平|趋势/);
  });

  it('"高数成绩" returns specific course', () => {
    const r = handleGradeQuery('高数成绩');
    expect(r.text).toMatch(/高等数学|高数/);
  });
});
