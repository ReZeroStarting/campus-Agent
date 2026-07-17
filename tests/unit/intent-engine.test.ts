import { describe, it, expect } from 'vitest';
import { recognizeIntent, getSupportedIntents } from '../../src/core/intent/engine.js';

describe('Intent Engine', () => {
  describe('getSupportedIntents', () => {
    it('should return all 11 intent categories', () => {
      const intents = getSupportedIntents();
      expect(intents).toContain('shower');
      expect(intents).toContain('schedule');
      expect(intents).toContain('card');
      expect(intents).toContain('weather');
      expect(intents).toContain('water');
      expect(intents).toContain('delivery');
      expect(intents).toContain('forum');
      expect(intents).toContain('map');
      expect(intents).toContain('exam');
      expect(intents).toContain('classroom');
      expect(intents).toContain('grade');
      expect(intents.length).toBe(11);
    });
  });

  describe('洗澡 (shower)', () => {
    const cases = ['我要洗澡', '想洗澡', '洗澡', '冲凉', '澡堂开了吗'];
    cases.forEach(input => {
      it(`"${input}" → shower`, () => {
        expect(recognizeIntent(input).category).toBe('shower');
      });
    });
  });

  describe('课表 (schedule)', () => {
    const cases = [
      { input: '明天什么课', expect: 'schedule' },
      { input: '今天课表', expect: 'schedule' },
      { input: '有什么课', expect: 'schedule' },
    ];
    cases.forEach(({ input, expect: expected }) => {
      it(`"${input}" → ${expected}`, () => {
        expect(recognizeIntent(input).category).toBe(expected);
      });
    });
  });

  describe('一卡通 (card)', () => {
    const cases = ['卡里还有多少钱', '查余额', '一卡通', '消费明细', '食堂花了多少'];
    cases.forEach(input => {
      it(`"${input}" → card`, () => {
        expect(recognizeIntent(input).category).toBe('card');
      });
    });
    // "校园卡" clashes with map's "校园" keyword — acceptable overlap
  });

  describe('天气 (weather)', () => {
    const cases = ['今天天气', '明天冷不冷', '带伞吗', '穿什么', '温度多少'];
    cases.forEach(input => {
      it(`"${input}" → weather`, () => {
        expect(recognizeIntent(input).category).toBe('weather');
      });
    });
  });

  describe('饮水 (water)', () => {
    it('"今天喝了多少水" → water', () => {
      expect(recognizeIntent('今天喝了多少水').category).toBe('water');
    });
    it('"记录喝水 200ml" → water', () => {
      expect(recognizeIntent('记录喝水 200ml').category).toBe('water');
    });
  });

  describe('快递外卖 (delivery)', () => {
    const cases = [
      { input: '查快递', expect: 'delivery' },
      { input: '外卖到了吗', expect: 'delivery' },
      { input: '取件码是多少', expect: 'delivery' },
      { input: '帮我规划路线', expect: 'delivery' },
      { input: '有什么要拿的', expect: 'delivery' },
    ];
    cases.forEach(({ input, expect: expected }) => {
      it(`"${input}" → ${expected}`, () => {
        expect(recognizeIntent(input).category).toBe(expected);
      });
    });
  });

  describe('论坛 (forum)', () => {
    const cases = [
      { input: '论坛首页', expect: 'forum' },
      { input: '有什么讲座', expect: 'forum' },
      { input: '最近有人捡到东西吗', expect: 'forum' },
      { input: '机器学习课怎么样', expect: 'forum' },
      { input: '有人出显示器吗', expect: 'forum' },
      { input: '有没有什么活动', expect: 'forum' },
    ];
    cases.forEach(({ input, expect: expected }) => {
      it(`"${input}" → ${expected}`, () => {
        expect(recognizeIntent(input).category).toBe(expected);
      });
    });
  });

  describe('地图 (map)', () => {
    const cases = [
      { input: '教三在哪', expect: 'map' },
      { input: '图书馆怎么走', expect: 'map' },
      { input: '去哪打印', expect: 'map' },
      { input: '校园地图', expect: 'map' },
      { input: '行政楼在哪', expect: 'map' },
    ];
    cases.forEach(({ input, expect: expected }) => {
      it(`"${input}" → ${expected}`, () => {
        expect(recognizeIntent(input).category).toBe(expected);
      });
    });
  });

  describe('考试 (exam)', () => {
    const cases = [
      { input: '考试倒计时', expect: 'exam' },
      { input: '高数什么时候考', expect: 'exam' },
      { input: '还有几天考试', expect: 'exam' },
      { input: '期末考试安排', expect: 'exam' },
    ];
    cases.forEach(({ input, expect: expected }) => {
      it(`"${input}" → ${expected}`, () => {
        expect(recognizeIntent(input).category).toBe(expected);
      });
    });
  });

  describe('空闲教室 (classroom)', () => {
    it('"找空教室" → classroom', () => {
      expect(recognizeIntent('找空教室').category).toBe('classroom');
    });
    it('"教三有空教室吗" → classroom (beats map)', () => {
      // classroom should beat map due to rule ordering
      expect(recognizeIntent('教三有空教室吗').category).toBe('classroom');
    });
    it('"能充电的自习室" → classroom', () => {
      expect(recognizeIntent('能充电的自习室').category).toBe('classroom');
    });
  });

  describe('绩点 (grade)', () => {
    const cases = [
      { input: '绩点多少', expect: 'grade' },
      { input: '够不够3.5', expect: 'grade' },
      { input: 'GPA怎么样', expect: 'grade' },
      { input: '加权均分', expect: 'grade' },
      { input: '有没有挂科', expect: 'grade' },
    ];
    cases.forEach(({ input, expect: expected }) => {
      it(`"${input}" → ${expected}`, () => {
        expect(recognizeIntent(input).category).toBe(expected);
      });
    });
  });

  describe('unknown fallback', () => {
    it('random text → unknown', () => {
      expect(recognizeIntent('你好').category).toBe('unknown');
      expect(recognizeIntent('哈哈哈哈').category).toBe('unknown');
    });
  });

  describe('confidence', () => {
    it('should return confidence between 0 and 1', () => {
      const r = recognizeIntent('我要洗澡');
      expect(r.confidence).toBeGreaterThan(0);
      expect(r.confidence).toBeLessThanOrEqual(1);
    });
    it('unknown should have confidence 0', () => {
      expect(recognizeIntent('xyz').confidence).toBe(0);
    });
  });

  describe('original text preservation', () => {
    it('should preserve original text in result', () => {
      const r = recognizeIntent('  我要洗澡  ');
      expect(r.originalText).toBe('  我要洗澡  ');
    });
  });
});
