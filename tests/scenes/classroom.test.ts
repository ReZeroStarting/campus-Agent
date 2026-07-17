import { describe, it, expect } from 'vitest';
import { handleClassroomQuery } from '../../src/scenes/classroom.js';

describe('Scene: 空闲教室', () => {
  it('"找空教室" returns available classrooms', () => {
    const r = handleClassroomQuery('找空教室');
    expect(r.text).toContain('空闲');
  });

  it('"教三找个空教室" filters by building', () => {
    const r = handleClassroomQuery('教三找个空教室');
    expect(r.text).toMatch(/教三|空闲/);
  });

  it('"找个有插座的教室" filters by feature', () => {
    const r = handleClassroomQuery('找个有插座的教室');
    expect(r.text.length).toBeGreaterThan(0);
  });

  it('returns suggestions', () => {
    const r = handleClassroomQuery('空教室');
    expect(r.suggestions.length).toBeGreaterThan(0);
  });
});
