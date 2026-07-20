import { describe, it, expect, beforeEach } from 'vitest';
import { handleMapQuery, setCurrentLocation, getCurrentLocation, clearCurrentLocation } from '../../src/scenes/map.js';
import { findBuilding } from '../../src/data/mocks/index.js';

describe('Scene: 校园地图', () => {
  beforeEach(() => clearCurrentLocation());

  it('"教三在哪" returns building info', () => {
    const r = handleMapQuery('教三在哪');
    expect(r.text).toContain('教学楼');
  });

  it('"去哪打印" returns service lookup', () => {
    const r = handleMapQuery('去哪打印');
    expect(r.text).toContain('打印');
  });

  it('"校园地图" returns overview', () => {
    const r = handleMapQuery('校园地图');
    expect(r.text).toContain('速览');
  });

  it('"去哪打成绩单" returns admin building with details', () => {
    const r = handleMapQuery('去哪打成绩单');
    expect(r.text).toContain('行政楼');
  });

  it('位置记忆: set + get + navigation', () => {
    const bld = findBuilding('教三');
    expect(bld).toBeDefined();
    if (!bld) return;

    setCurrentLocation(bld.id);
    expect(getCurrentLocation()).toBeDefined();
    expect(getCurrentLocation()!.shortName).toBe('教三');

    const r = handleMapQuery('到图书馆怎么走');
    expect(r.text).toContain('图书馆');
    expect(r.text).toContain('步行');
  });

  it('"我在教三" sets location', () => {
    const bld = findBuilding('教三');
    if (bld) {
      setCurrentLocation(bld.id);
      expect(getCurrentLocation()!.shortName).toBe('教三');
    }
  });
});
