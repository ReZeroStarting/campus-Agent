// ============================================================
// 智能早报 — 每日聚合推送 V2
// 使用编排器并行查询所有数据源，超时降级不阻断
// ============================================================

import { orchestrate } from '../core/orchestrator/engine.js';
import { fetchCoursesForDate } from '../services/scheduleData.js';
import { getWeatherToday } from '../data/mocks/index.js';
import { getCardState } from '../data/mocks/index.js';
import { getActivePackages, getActiveOrders, getUpcomingExams, getExamCountdown } from '../data/mocks/index.js';
import { getActiveEvents } from '../data/mocks/index.js';
import type { CardState, Course, WeatherInfo } from '../models/index.js';
import type { ExtractedInfo, Package, DeliveryOrder } from '../models/index.js';

const WEEKDAY_NAMES = ['日', '一', '二', '三', '四', '五', '六'];

export async function handleMorningBrief(): Promise<{ text: string; suggestions: string[] }> {
  const now = new Date();
  const hour = now.getHours();
  const weekday = WEEKDAY_NAMES[now.getDay()];

  // 问候
  let greeting = '';
  if (hour < 9) greeting = '☀️ 早上好';
  else if (hour < 12) greeting = '🌤️ 上午好';
  else if (hour < 14) greeting = '☀️ 中午好';
  else if (hour < 18) greeting = '🌤️ 下午好';
  else greeting = '🌙 晚上好';

  const header = `${greeting}！今天是${now.getMonth() + 1}月${now.getDate()}日 周${weekday}`;

  // ── 使用编排器并行获取数据 ──
  const task = await orchestrate(
    'schedule',
    'morning_brief',
    [
      {
        mode: 'parallel',
        actions: [
          {
            name: 'fetchWeather',
            execute: async () => getWeatherToday(),
            fallback: '天气数据暂不可用',
          },
          {
            name: 'fetchCourses',
            execute: async () => fetchCoursesForDate(now),
            fallback: '课表暂不可用',
          },
          {
            name: 'fetchExams',
            execute: async () => ({
              countdowns: getExamCountdown(),
              upcoming: getUpcomingExams(3),
            }),
            fallback: null,
          },
          {
            name: 'fetchPackages',
            execute: async () => getActivePackages().filter(p => p.status === '已到站'),
            fallback: null,
          },
          {
            name: 'fetchOrders',
            execute: async () => getActiveOrders().filter(o => o.status === '已送达'),
            fallback: null,
          },
          {
            name: 'fetchEvents',
            execute: async () => getActiveEvents(),
            fallback: null,
          },
          {
            name: 'fetchCardState',
            execute: async () => getCardState(),
            fallback: null,
          },
        ],
      },
    ],
    (results) => {
      const weather = results.get('fetchWeather') as WeatherInfo | undefined;
      const courses = results.get('fetchCourses') as Course[] | undefined;
      const examsData = results.get('fetchExams') as
        | { countdowns: ReturnType<typeof getExamCountdown>; upcoming: ReturnType<typeof getUpcomingExams> }
        | undefined;
      const packages = results.get('fetchPackages') as Package[] | undefined;
      const orders = results.get('fetchOrders') as DeliveryOrder[] | undefined;
      const events = results.get('fetchEvents') as ExtractedInfo[] | undefined;
      const card = results.get('fetchCardState') as CardState | undefined;

      return buildBriefText({
        header,
        hour,
        now,
        weather,
        courses,
        examsData,
        packages,
        orders,
        events,
        card,
      });
    },
  );

  // 编排结果作为早报文本
  const text = task.result.summary;
  const suggestions: string[] = [];

  // 从文本中提取建议
  if (text.includes('雨')) suggestions.push('穿什么');
  if (text.includes('课')) suggestions.push('今天天气');
  if (text.includes('考试')) suggestions.push('考试倒计时');
  if (text.includes('快递')) suggestions.push('帮我规划路线');
  if (text.includes('活动')) suggestions.push('有什么活动');
  if (text.includes('余额')) suggestions.push('充值');

  return {
    text,
    suggestions: suggestions.slice(0, 4).length > 0
      ? suggestions.slice(0, 4)
      : ['查课表', '论坛首页', '考试倒计时', '绩点'],
  };
}

// ── 早报文本构建（纯数据 → 文本，无副作用）──

interface BriefData {
  header: string;
  hour: number;
  now: Date;
  weather?: WeatherInfo;
  courses?: Course[];
  examsData?: {
    countdowns: ReturnType<typeof getExamCountdown>;
    upcoming: ReturnType<typeof getUpcomingExams>;
  };
  packages?: Package[];
  orders?: DeliveryOrder[];
  events?: ExtractedInfo[];
  card?: CardState;
}

function buildBriefText(data: BriefData): string {
  const lines: string[] = [data.header];

  // 天气
  if (data.weather) {
    const w = data.weather;
    const icon = w.condition.includes('雨') ? '🌧️' : w.condition.includes('晴') ? '☀️' : '⛅';
    lines.push(`\n${icon} 天气：${w.condition} ${w.tempLow}°C~${w.tempHigh}°C`);
    if (w.humidity) lines.push(`   湿度 ${w.humidity}%${w.windLevel ? ' · 风力 ' + w.windLevel + ' 级' : ''}`);
    if (w.tips) lines.push(`   💡 ${w.tips}`);
  }

  // 课表
  if (data.courses && data.courses.length > 0) {
    const courseList = data.courses
      .map(c => `   ${c.startTime}-${c.endTime} ${c.name} @${c.location || '待定'}`)
      .join('\n');
    lines.push(`\n📚 今日 ${data.courses.length} 节课：`);
    lines.push(courseList);
    if (data.courses[0].startTime === '08:00' && data.hour < 8) {
      lines.push('   ⏰ 第一节是早八，该起床了！');
    }
  } else {
    const weekend = data.now.getDay() === 0 || data.now.getDay() === 6;
    lines.push(`\n📚 今天${weekend ? '是周末' : ''}没课，${weekend ? '好好休息吧~' : '可以自由安排时间'}`);
  }

  // 考试
  if (data.examsData) {
    const { countdowns } = data.examsData;
    if (countdowns.length > 0 && countdowns[0].daysLeft <= 7) {
      const urgent = countdowns.filter(c => c.daysLeft <= 3);
      const upcoming = countdowns.filter(c => c.daysLeft > 3 && c.daysLeft <= 7);
      if (urgent.length > 0) {
        lines.push('\n📝 ⚠️ 近期考试：');
        urgent.forEach(c => {
          const label = c.daysLeft === 0 ? '🔴 今天！' : c.daysLeft === 1 ? '🟠 明天' : `🟡 ${c.daysLeft}天后`;
          lines.push(`   ${label} ${c.exam.courseName} ${c.exam.time} @${c.exam.location}`);
        });
      }
      upcoming.forEach(c => {
        lines.push(`   📅 ${c.daysLeft}天后 ${c.exam.courseName} ${c.exam.time} @${c.exam.location}`);
      });
    }
  }

  // 快递 & 外卖
  if (data.packages && data.packages.length > 0) {
    lines.push(`\n📦 ${data.packages.length} 个快递已到站：`);
    data.packages.forEach(p => lines.push(`   ${p.carrier} - ${p.description || '快递'} · 取件码 ${p.pickupCode}`));
  }
  if (data.orders && data.orders.length > 0) {
    lines.push('\n🍔 外卖已送达，记得去拿');
  }

  // 活动
  if (data.events && data.events.length > 0) {
    const todayEvents = data.events.filter(e => e.detail.date === '今天');
    const tomorrowEvents = data.events.filter(e => e.detail.date.includes('明'));
    if (todayEvents.length > 0) {
      lines.push('\n🎪 今日活动：');
      todayEvents.forEach(e => lines.push(`   ${e.summary}`));
    }
    if (tomorrowEvents.length > 0) {
      tomorrowEvents.forEach(e => lines.push(`   📅 明天：${e.summary}`));
    }
  }

  // 一卡通
  if (data.card && data.card.balance < 20) {
    const level = data.card.balance < 10 ? '🔴 余额不足' : '🟡 余额偏低';
    lines.push(`\n💳 ${level}：${data.card.balance.toFixed(1)} 元，建议充值`);
  }

  // 寄语
  const tips = ['记得多喝水 💧', '久坐记得站起来活动活动', '今天也要加油呀 💪', '别忘了吃点水果 🍎', '有空去操场走走吧'];
  lines.push(`\n✨ ${tips[data.now.getDate() % tips.length]}`);

  return lines.join('\n');
}
