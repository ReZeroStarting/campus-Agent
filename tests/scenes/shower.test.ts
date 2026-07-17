import { describe, it, expect } from 'vitest';
import { handleShowerIntent, handleShowerDone } from '../../src/scenes/shower.js';

describe('Scene: 洗澡助手', () => {
  it('"我要洗澡" returns balance and crowd info', async () => {
    const result = await handleShowerIntent();
    const r = result.response;
    expect(r.text).toContain('余额');
    expect(r.suggestions.length).toBeGreaterThan(0);
  });

  it('"洗完了" deducts balance', async () => {
    const result = await handleShowerDone();
    const r = result.response;
    expect(r.text).toMatch(/消费|扣|余额/);
    expect(r.suggestions).toBeDefined();
  });

  it('returns suggestions for follow-up', async () => {
    const result = await handleShowerIntent();
    const r = result.response;
    const hasActionable = r.suggestions.some((s: string) =>
      s.includes('洗澡') || s.includes('充值') || s.includes('洗')
    );
    expect(hasActionable).toBe(true);
  });
});
