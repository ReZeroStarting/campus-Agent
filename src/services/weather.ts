// ============================================================
// 天气服务适配层 (v2 — 和风天气 API + 模拟 fallback)
// ============================================================

import { getMockWeather } from '../data/mock.js';
import type { WeatherInfo } from '../models/index.js';

/** 和风天气 API 配置 */
interface QWeatherConfig {
  apiKey: string;              // 和风天气 API Key
  city: string;                // 城市名称，如 "北京"、"南京"
  useMock: boolean;            // 强制使用模拟数据
}

// 默认配置（通过环境变量覆盖）
let config: QWeatherConfig = {
  apiKey: process.env.QWEATHER_KEY || '',
  city: process.env.QWEATHER_CITY || '北京',
  useMock: process.env.QWEATHER_MOCK === 'true' || false,
};

/** 城市 LocationID 缓存 */
const cityCache = new Map<string, string>();

// ---- 公开 API ----

/**
 * 配置天气服务
 * @example setWeatherConfig({ apiKey: 'your-key', city: '南京' })
 */
export function setWeatherConfig(partial: Partial<QWeatherConfig>): void {
  config = { ...config, ...partial };
}

/**
 * 获取当前配置（查看是否已配置 key）
 */
export function getWeatherConfig(): Readonly<QWeatherConfig> {
  return { ...config };
}

/**
 * 获取指定日期的天气信息
 * - 有 API key → 调用和风天气真实 API
 * - 无 key 或 API 失败 → 降级为模拟数据
 */
export async function fetchWeather(date: Date): Promise<WeatherInfo> {
  // 模拟模式
  if (config.useMock || !config.apiKey) {
    return getMockWeather(date);
  }

  try {
    return await fetchQWeather(date);
  } catch (err: any) {
    console.warn(`[Weather] API 调用失败：${err.message}，降级为模拟数据`);
    return getMockWeather(date);
  }
}

// ---- 内部：和风天气 API ----

const QWEATHER_BASE = 'https://devapi.qweather.com/v7';
const QWEATHER_GEO = 'https://geoapi.qweather.com/v2';

async function fetchQWeather(date: Date): Promise<WeatherInfo> {
  // 1. 获取城市 LocationID（带缓存）
  const locationId = await getCityLocationId(config.city);

  // 2. 获取 3 天天气预报
  const url = `${QWEATHER_BASE}/weather/3d?location=${locationId}&key=${config.apiKey}`;
  const resp = await fetch(url, { signal: AbortSignal.timeout(5000) });

  if (!resp.ok) {
    const body = await resp.text();
    if (resp.status === 403) throw new Error('API Key 无效或未开通免费订阅');
    if (resp.status === 429) throw new Error('API 调用次数超限');
    throw new Error(`HTTP ${resp.status}: ${body}`);
  }

  const data: any = await resp.json();
  if (data.code !== '200') throw new Error(`和风天气错误：${data.code}`);

  // 3. 找到目标日期的预报
  const targetDateStr = date.toISOString().slice(0, 10); // "2026-07-17"
  const dailyList = data.daily || [];
  const forecast = dailyList.find((d: any) => d.fxDate === targetDateStr)
    || dailyList[0];

  if (!forecast) throw new Error('未找到目标日期的预报数据');

  // 4. 转换为统一 WeatherInfo 格式
  return {
    date: targetDateStr,
    condition: mapWeatherText(forecast.textDay),
    tempHigh: parseInt(forecast.tempMax),
    tempLow: parseInt(forecast.tempMin),
    humidity: parseInt(forecast.humidity) || 60,
    windLevel: windSpeedToLevel(forecast.windSpeedDay),
    tips: buildWeatherTip(forecast.textDay, parseInt(forecast.tempMax)),
  };
}

async function getCityLocationId(city: string): Promise<string> {
  if (cityCache.has(city)) return cityCache.get(city)!;

  const url = `${QWEATHER_GEO}/city/lookup?location=${encodeURIComponent(city)}&key=${config.apiKey}`;
  const resp = await fetch(url, { signal: AbortSignal.timeout(5000) });

  if (!resp.ok) throw new Error(`城市查询失败：HTTP ${resp.status}`);

  const data: any = await resp.json();
  if (data.code !== '200' || !data.location || data.location.length === 0) {
    throw new Error(`未找到城市"${city}"`);
  }

  const id = data.location[0].id;
  cityCache.set(city, id);
  return id;
}

// ---- 数据转换 ----

function mapWeatherText(text: string): string {
  const map: Record<string, string> = {
    '晴': '晴',
    '少云': '晴',
    '晴间多云': '多云',
    '多云': '多云',
    '阴': '阴',
    '小雨': '小雨',
    '中雨': '中雨',
    '大雨': '大雨',
    '阵雨': '阵雨',
    '雷阵雨': '雷阵雨',
    '小雪': '小雪',
    '中雪': '中雪',
    '大雪': '大雪',
    '雾': '雾',
    '霾': '霾',
  };
  // 模糊匹配
  for (const [key, val] of Object.entries(map)) {
    if (text.includes(key)) return val;
  }
  return text || '未知';
}

function windSpeedToLevel(speedKmh: string): number {
  const spd = parseFloat(speedKmh) || 0;
  if (spd < 1) return 0;
  if (spd < 6) return 1;
  if (spd < 12) return 2;
  if (spd < 20) return 3;
  if (spd < 29) return 4;
  if (spd < 39) return 5;
  return 6;
}

function buildWeatherTip(condition: string, temp: number): string {
  if (condition.includes('雨')) return '出门记得带伞';
  if (condition.includes('雪')) return '路面可能结冰，注意安全';
  if (temp > 35) return '高温天气，注意防暑降温';
  if (temp > 30) return '天气较热，注意防晒补水';
  if (temp < 10) return '天气较凉，注意保暖';
  if (temp < 0) return '非常冷，多穿衣服';
  if (condition.includes('雾') || condition.includes('霾')) return '能见度低，出行注意安全';
  return '适合户外活动';
}
