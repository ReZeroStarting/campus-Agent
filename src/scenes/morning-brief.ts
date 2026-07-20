// ============================================================
// 智能早报 — 每日聚合推送
// 聚合天气/课表/考试/快递/活动/余额，一键早安
// ============================================================

import { fetchCoursesForDate } from '../services/scheduleData.js';
import { getWeatherToday } from '../data/mocks/index.js';
import { getCardState } from '../data/mocks/index.js';
import { getActivePackages, getActiveOrders, getUpcomingExams, getExamCountdown } from '../data/mocks/index.js';
import { getActiveEvents } from '../data/mocks/index.js';

const WEEKDAY_NAMES = ['日', '一', '二', '三', '四', '五', '六'];

export function handleMorningBrief(): { text: string; suggestions: string[] } {
  const now = new Date();
  const hour = now.getHours();
  const weekday = WEEKDAY_NAMES[now.getDay()];

  const lines: string[] = [];
  const suggestions: string[] = [];

  // 问候
  let greeting = '';
  if (hour < 9) greeting = '☀️ 早上好';
  else if (hour < 12) greeting = '🌤️ 上午好';
  else if (hour < 14) greeting = '☀️ 中午好';
  else if (hour < 18) greeting = '🌤️ 下午好';
  else greeting = '🌙 晚上好';
  lines.push(`${greeting}！今天是${now.getMonth() + 1}月${now.getDate()}日 周${weekday}`);

  // ═══ 天气 ═══
  try {
    const weather = getWeatherToday();
    if (weather) {
      const weatherIcon = weather.condition.includes('雨') ? '🌧️' : weather.condition.includes('晴') ? '☀️' : '⛅';
      lines.push(`\n${weatherIcon} 天气：${weather.condition} ${weather.tempLow}°C~${weather.tempHigh}°C`);
      if (weather.humidity) lines.push(`   湿度 ${weather.humidity}%${weather.windLevel ? ' · 风力 ' + weather.windLevel + ' 级' : ''}`);
      if (weather.tips) lines.push(`   💡 ${weather.tips}`);
      if (weather.condition.includes('雨')) suggestions.push('穿什么');
    }
  } catch { /* weather might fail */ }

  // ═══ 课表 ═══
  try {
    const courses = fetchCoursesForDate(new Date());
    if (courses && courses.length > 0) {
      const firstCourse = courses[0];
      const isEarly8 = firstCourse.startTime === '08:00';
      const courseList = courses.map(c => `   ${c.startTime}-${c.endTime} ${c.name} @${c.location || '待定'}`).join('\n');
      lines.push(`\n📚 今日 ${courses.length} 节课：`);
      lines.push(courseList);
      if (isEarly8 && hour < 8) {
        lines.push('   ⏰ 第一节是早八，该起床了！');
      }
      suggestions.push('今天天气');
    } else {
      const weekend = now.getDay() === 0 || now.getDay() === 6;
      lines.push(`\n📚 今天${weekend ? '是周末' : ''}没课，${weekend ? '好好休息吧~' : '可以自由安排时间'}`);
    }
  } catch { lines.push('\n📚 课表暂不可用'); }

  // ═══ 考试 ═══
  try {
    const countdowns = getExamCountdown();
    if (countdowns.length > 0 && countdowns[0].daysLeft <= 7) {
      const urgent = countdowns.filter(c => c.daysLeft <= 3);
      const upcoming = countdowns.filter(c => c.daysLeft > 3 && c.daysLeft <= 7);
      if (urgent.length > 0) {
        lines.push(`\n📝 ⚠️ 近期考试：`);
        urgent.forEach(c => {
          const label = c.daysLeft === 0 ? '🔴 今天！' : c.daysLeft === 1 ? '🟠 明天' : `🟡 ${c.daysLeft}天后`;
          lines.push(`   ${label} ${c.exam.courseName} ${c.exam.time} @${c.exam.location}`);
        });
      }
      if (upcoming.length > 0) {
        upcoming.forEach(c => {
          lines.push(`   📅 ${c.daysLeft}天后 ${c.exam.courseName} ${c.exam.time} @${c.exam.location}`);
        });
      }
      suggestions.push('考试倒计时');
    }
  } catch { /* exams might fail */ }

  // ═══ 快递 & 外卖 ═══
  try {
    const packages = getActivePackages().filter(p => p.status === '已到站');
    const orders = getActiveOrders().filter(o => o.status === '已送达');
    if (packages.length > 0) {
      lines.push(`\n📦 ${packages.length} 个快递已到站：`);
      packages.forEach(p => lines.push(`   ${p.carrier} - ${p.description || '快递'} · 取件码 ${p.pickupCode}`));
      suggestions.push('帮我规划路线');
    }
    if (orders.length > 0) {
      lines.push(`\n🍔 外卖已送达，记得去拿`);
      suggestions.push('查外卖');
    }
  } catch { /* delivery data might fail */ }

  // ═══ 活动 ═══
  try {
    const events = getActiveEvents();
    if (events.length > 0) {
      const todayEvents = events.filter(e => e.detail.date === '今天');
      const tomorrowEvents = events.filter(e => e.detail.date.includes('明'));
      if (todayEvents.length > 0) {
        lines.push(`\n🎪 今日活动：`);
        todayEvents.forEach(e => lines.push(`   ${e.summary}`));
      }
      if (tomorrowEvents.length > 0) {
        tomorrowEvents.forEach(e => lines.push(`   📅 明天：${e.summary}`));
      }
      suggestions.push('有什么活动');
    }
  } catch { /* events might fail */ }

  // ═══ 一卡通 ═══
  try {
    const card = getCardState();
    if (card.balance < 20) {
      const level = card.balance < 10 ? '🔴 余额不足' : '🟡 余额偏低';
      lines.push(`\n💳 ${level}：${card.balance.toFixed(1)} 元，建议充值`);
      suggestions.push('充值');
    }
  } catch { /* card might fail */ }

  // ═══ 今日寄语 ═══
  const tips = ['记得多喝水 💧', '久坐记得站起来活动活动', '今天也要加油呀 💪', '别忘了吃点水果 🍎', '有空去操场走走吧'];
  const tip = tips[now.getDate() % tips.length];
  lines.push(`\n✨ ${tip}`);

  return {
    text: lines.join('\n'),
    suggestions: suggestions.length > 0 ? suggestions.slice(0, 4) : ['查课表', '论坛首页', '考试倒计时', '绩点'],
  };
}
