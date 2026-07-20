import { describe, it, expect } from 'vitest';
import { processMessage, registerBuiltinTriggers, runScheduledCheck } from '../../src/agent.js';

describe('Agent Integration', () => {
  registerBuiltinTriggers();

  describe('processMessage — 基础场景', () => {
    const cases: { input: string; expectContains: string }[] = [
      { input: '我要洗澡', expectContains: '余额' },
      { input: '明天什么课', expectContains: '课' },
      { input: '卡里还有多少钱', expectContains: '余额' },
      { input: '今天天气', expectContains: '天气' },
      { input: '今天喝了多少水', expectContains: 'ml' },
    ];

    cases.forEach(({ input, expectContains }) => {
      it(`"${input}" → contains "${expectContains}"`, async () => {
        const r = await processMessage(input);
        expect(r.text).toContain(expectContains);
        expect(r.suggestions).toBeDefined();
      });
    });
  });

  describe('processMessage — 快递外卖', () => {
    it('"查快递" returns delivery info', async () => {
      const r = await processMessage('查快递');
      expect(r.text).toMatch(/快递|包裹|到站/);
    });
  });

  describe('processMessage — 论坛', () => {
    it('"论坛" returns forum posts', async () => {
      const r = await processMessage('论坛');
      expect(r.text).toContain('热帖');
    });
  });

  describe('processMessage — 地图', () => {
    it('"教三在哪" returns building info', async () => {
      const r = await processMessage('教三在哪');
      expect(r.text).toContain('教学楼');
    });
  });

  describe('processMessage — 新场景', () => {
    it('"早安" returns morning brief', async () => {
      const r = await processMessage('早安');
      expect(r.text).toMatch(/好|早安|天气/);
    });
    it('"考试倒计时" returns exam list', async () => {
      const r = await processMessage('考试倒计时');
      expect(r.text).toContain('考试');
    });
    it('"绩点多少" returns GPA', async () => {
      const r = await processMessage('绩点多少');
      expect(r.text).toContain('GPA');
    });
  });

  describe('多轮对话 — 指代消解', () => {
    it('can handle follow-up "够不够" after "我要洗澡"', async () => {
      await processMessage('我要洗澡');
      const r = await processMessage('够不够');
      expect(r.text).toMatch(/够|余额|元/);
    });

    it('can handle "穿什么" after "今天天气"', async () => {
      await processMessage('今天天气');
      const r = await processMessage('穿什么');
      expect(r.text.length).toBeGreaterThan(0);
    });
  });

  describe('快捷指令', () => {
    it('"取件码是多少" returns pickup codes', async () => {
      const r = await processMessage('取件码是多少');
      expect(r.text).toContain('取件码');
    });

    it('"洗完了" deducts balance after shower', async () => {
      await processMessage('我要洗澡');
      const r = await processMessage('洗完了');
      expect(r.text).toMatch(/消费|扣/);
    });
  });

  describe('主动触发', () => {
    it('runScheduledCheck returns array', async () => {
      const responses = await runScheduledCheck(new Date());
      expect(Array.isArray(responses)).toBe(true);
    });
  });

  describe('unknown query', () => {
    it('returns helpful fallback', async () => {
      const r = await processMessage('xyzrandomquery123');
      expect(r.text.length).toBeGreaterThan(20);
      expect(r.suggestions.length).toBeGreaterThan(0);
    });
  });

  describe('response structure', () => {
    it('all replies have text and suggestions', async () => {
      const queries = ['我要洗澡', '明天什么课', '论坛', '早安'];
      for (const q of queries) {
        const r = await processMessage(q);
        expect(r).toHaveProperty('text');
        expect(r).toHaveProperty('suggestions');
        expect(typeof r.text).toBe('string');
        expect(Array.isArray(r.suggestions)).toBe(true);
        expect(r.text.length).toBeGreaterThan(0);
      }
    });
  });
});
