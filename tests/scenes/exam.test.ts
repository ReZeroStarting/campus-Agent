import { describe, it, expect } from 'vitest';
import { handleExamQuery } from '../../src/scenes/exam.js';

describe('Scene: 考试倒计时', () => {
  it('"考试倒计时" returns countdown list', () => {
    const r = handleExamQuery('考试倒计时');
    expect(r.text).toContain('考试');
    expect(r.suggestions.length).toBeGreaterThan(0);
  });

  it('"高数什么时候考" finds by alias', () => {
    const r = handleExamQuery('高数什么时候考');
    expect(r.text).toContain('高等数学');
  });

  it('"今天考试" returns today exams or no-exam message', () => {
    const r = handleExamQuery('今天考试');
    expect(r.text.length).toBeGreaterThan(0);
  });

  it('returns urgency indicators', () => {
    const r = handleExamQuery('考试倒计时');
    // should contain day counts or urgency markers
    expect(r.text).toMatch(/天|今天|明天/);
  });
});
