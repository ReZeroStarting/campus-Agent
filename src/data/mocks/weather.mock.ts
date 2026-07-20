// ============================================================
// 天气模拟数据
// ============================================================

import type { WeatherInfo } from '../../models/index.js';

const weatherConditions = ['晴', '多云', '阴', '小雨', '中雨'];

export function getMockWeather(date: Date): WeatherInfo {
  const seed = date.getDate() + date.getMonth() * 31;
  const condition = weatherConditions[seed % weatherConditions.length];
  const baseTemp = 30;
  const variation = (seed % 5) - 2;

  const tipsMap: Record<string, string> = {
    '晴': '天气炎热，注意防晒和补水',
    '多云': '适合户外活动',
    '阴': '可能有雨，建议带伞',
    '小雨': '记得带伞',
    '中雨': '出门记得带伞，路面湿滑注意安全',
  };

  return {
    date: date.toISOString().slice(0, 10),
    condition,
    tempHigh: baseTemp + variation + 2,
    tempLow: baseTemp + variation - 5,
    humidity: 60 + (seed % 30),
    windLevel: 1 + (seed % 3),
    tips: tipsMap[condition] || '注意天气变化',
  };
}

export function getWeatherToday(): WeatherInfo {
  return getMockWeather(new Date());
}
