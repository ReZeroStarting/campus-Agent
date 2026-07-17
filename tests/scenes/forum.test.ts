import { describe, it, expect } from 'vitest';
import { handleForumQuery } from '../../src/scenes/forum.js';

describe('Scene: 校园论坛', () => {
  it('"论坛首页" returns hot posts', () => {
    const r = handleForumQuery('论坛首页');
    expect(r.text).toContain('热帖');
    expect(r.suggestions.length).toBeGreaterThan(0);
  });

  it('"有什么讲座" returns events', () => {
    const r = handleForumQuery('有什么讲座');
    expect(r.text).toContain('活动');
    expect(r.suggestions).toBeDefined();
  });

  it('"最近有人捡到东西吗" returns lost & found', () => {
    const r = handleForumQuery('最近有人捡到东西吗');
    expect(r.text).toMatch(/捡到|拾到|失物|寻找/);
  });

  it('"机器学习怎么样" returns course reviews', () => {
    const r = handleForumQuery('机器学习怎么样');
    expect(r.text).toContain('机器学习');
  });

  it('"有人出显示器吗" returns secondhand posts', () => {
    const r = handleForumQuery('有人出显示器吗');
    expect(r.text).toMatch(/二手|显示器|出/);
  });

  it('returns suggestions for next action', () => {
    const r = handleForumQuery('论坛');
    expect(r.suggestions.length).toBeGreaterThanOrEqual(2);
  });
});
