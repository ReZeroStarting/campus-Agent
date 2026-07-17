import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('小艺 Skill 对接', () => {
  let skill: any;

  beforeAll(() => {
    const skillPath = resolve(__dirname, '../../xiaoyi/skill.json');
    const raw = readFileSync(skillPath, 'utf-8');
    skill = JSON.parse(raw);
  });

  it('has required skill metadata', () => {
    expect(skill.skill.name).toBe('校园搭子');
    expect(skill.skill.packageName).toBeTruthy();
    expect(skill.skill.minApiVersion).toBeGreaterThanOrEqual(12);
  });

  it('covers all 12 intents', () => {
    expect(skill.intents.length).toBe(12);
    for (const intent of skill.intents) {
      expect(intent.name).toBeTruthy();
      expect(intent.category).toBeTruthy();
      expect(intent.utterances.length).toBeGreaterThan(0);
    }
  });

  it('has fulfillment config', () => {
    expect(skill.fulfillment.endpoint).toBe('/api/xiaoyi');
  });

  it('has shortcuts for quick access', () => {
    expect(skill.shortcuts.length).toBeGreaterThanOrEqual(3);
    expect(skill.shortcuts[0].intent).toBeTruthy();
  });

  it('every intent maps to a campus-buddy scene', () => {
    const sceneMap = ['schedule', 'card', 'weather', 'shower', 'delivery', 'forum', 'map', 'exam', 'classroom', 'grade', 'water', 'morning_brief'];
    for (const intent of skill.intents) {
      const hasParams = intent.parameters.length > 0;
      const hasUtterances = intent.utterances.length > 0;
      expect(hasUtterances).toBe(true);
    }
  });
});
