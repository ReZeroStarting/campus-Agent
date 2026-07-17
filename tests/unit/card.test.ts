import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { getMorningBriefCard, getScheduleCard, getExamCard, getBalanceCard, getPackageCard } from '../../src/services/cardData.js';

describe('服务卡片', () => {
  describe('卡片配置完整性', () => {
    it('widget-config.json has 5 cards', () => {
      const raw = readFileSync(resolve(__dirname, '../../card/widget-config.json'), 'utf-8');
      const config = JSON.parse(raw);
      expect(config.widgets.length).toBe(5);
    });

    it('all card configs have dataSource and clickAction', () => {
      const raw = readFileSync(resolve(__dirname, '../../card/widget-config.json'), 'utf-8');
      const config = JSON.parse(raw);
      for (const w of config.widgets) {
        expect(w.dataSource).toBeTruthy();
        expect(w.clickAction).toBeTruthy();
      }
    });

    it('all 5 card templates exist', () => {
      const templates = ['morning-brief', 'schedule', 'exam-countdown', 'balance', 'package-notification'];
      for (const t of templates) {
        const raw = readFileSync(resolve(__dirname, `../../card/templates/${t}.json`), 'utf-8');
        const tmpl = JSON.parse(raw);
        expect(tmpl.cardId).toBeTruthy();
        expect(tmpl.template).toBeDefined();
      }
    });
  });

  describe('卡片数据提供器', () => {
    it('getMorningBriefCard returns required fields', () => {
      const data = getMorningBriefCard();
      expect(data.greeting).toBeTruthy();
      expect(data.date).toBeTruthy();
      expect(data.weatherEmoji).toBeTruthy();
      expect(typeof data.hasCourse).toBe('boolean');
      expect(typeof data.hasPackage).toBe('boolean');
    });

    it('getScheduleCard returns courses array', () => {
      const data = getScheduleCard();
      expect(data.dateLabel).toBeTruthy();
      expect(Array.isArray(data.courses)).toBe(true);
    });

    it('getExamCard returns exams array', () => {
      const data = getExamCard();
      expect(Array.isArray(data.exams)).toBe(true);
    });

    it('getBalanceCard returns balance fields', () => {
      const data = getBalanceCard();
      expect(data.balanceText).toBeTruthy();
      expect(data.balanceColor).toBeTruthy();
      expect(data.todaySpent).toBeTruthy();
    });

    it('getPackageCard returns summary', () => {
      const data = getPackageCard();
      expect(data).toHaveProperty('summary');
    });
  });
});
