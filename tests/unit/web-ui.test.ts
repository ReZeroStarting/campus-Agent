import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('Web Chat UI', () => {
  it('index.html has required structure', () => {
    const html = readFileSync(resolve(__dirname, '../../public/index.html'), 'utf-8');
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('校园搭子');
    expect(html).toContain('app.js');
    expect(html).toContain('chat');
    expect(html).toContain('input');
    expect(html).toContain('send');
  });

  it('style.css has mobile-first layout', () => {
    const css = readFileSync(resolve(__dirname, '../../public/style.css'), 'utf-8');
    expect(css).toContain('.msg');
    expect(css).toContain('#suggestions');
    expect(css).toContain('.welcome');
    expect(css).toContain('max-width:560px');
  });

  it('app.js has chat engine and welcome quick-starts', () => {
    const js = readFileSync(resolve(__dirname, '../../public/app.js'), 'utf-8');
    expect(js).toContain('/api/chat');
    expect(js).toContain('addBubble');
    expect(js).toContain('quickStart');
    expect(js).toContain('setSuggestions');
    // Welcome screen quick-start buttons
    for (const btn of ['早安', '课表', '快递', '考试', '绩点', '论坛', '地图', '找空教室']) {
      expect(js).toContain(btn);
    }
  });

  it('manifest.json is PWA-valid', () => {
    const raw = readFileSync(resolve(__dirname, '../../public/manifest.json'), 'utf-8');
    const m = JSON.parse(raw);
    expect(m.name).toBe('校园搭子 Campus Buddy');
    expect(m.display).toBe('standalone');
    expect(m.icons.length).toBeGreaterThanOrEqual(2);
  });
});
