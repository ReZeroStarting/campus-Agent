// ============================================================
// 服务卡片数据提供器
// 为鸿蒙 FormExtensionAbility 提供卡片数据
// ============================================================

import { fetchCoursesForDate } from '../services/scheduleData.js';
import { getWeatherToday } from '../data/mock.js';
import { getCardState } from '../data/mock.js';
import { getActivePackages } from '../data/mock.js';
import { getExamCountdown } from '../data/mock.js';
import { getActiveEvents } from '../data/mock.js';

const WEEKDAY_NAMES = ['日', '一', '二', '三', '四', '五', '六'];

export function getMorningBriefCard(): Record<string, unknown> {
  const now = new Date();
  const hour = now.getHours();

  let greeting = '';
  if (hour < 9) greeting = '☀️ 早上好！';
  else if (hour < 12) greeting = '🌤️ 上午好！';
  else if (hour < 14) greeting = '☀️ 中午好！';
  else if (hour < 18) greeting = '🌤️ 下午好！';
  else greeting = '🌙 晚上好！';

  const date = `${now.getMonth() + 1}月${now.getDate()}日 周${WEEKDAY_NAMES[now.getDay()]}`;

  // 天气
  let weatherEmoji = '⛅';
  let weatherText = '';
  let weatherTips = '';
  try {
    const w = getWeatherToday();
    weatherEmoji = w.condition.includes('雨') ? '🌧️' : w.condition.includes('晴') ? '☀️' : '⛅';
    weatherText = `${w.condition} ${w.tempLow}°C~${w.tempHigh}°C`;
    weatherTips = w.tips || '';
  } catch { /* ignore */ }

  // 课表
  let hasCourse = false;
  let courseSummary = '';
  try {
    const courses = fetchCoursesForDate(new Date());
    if (courses.length > 0) {
      hasCourse = true;
      courseSummary = `${courses[0].startTime} ${courses[0].name} @${courses[0].location || '待定'}`;
    }
  } catch { /* ignore */ }

  // 快递
  let hasPackage = false;
  let packageSummary = '';
  try {
    const pkgs = getActivePackages().filter(p => p.status === '已到站');
    if (pkgs.length > 0) {
      hasPackage = true;
      packageSummary = `${pkgs[0].carrier}-${pkgs[0].description || '快递'}已到站`;
    }
  } catch { /* ignore */ }

  // 活动
  let hasEvent = false;
  let eventSummary = '';
  try {
    const events = getActiveEvents();
    const todayEvent = events.find(e => e.detail.date === '今天');
    if (todayEvent) {
      hasEvent = true;
      eventSummary = todayEvent.summary;
    }
  } catch { /* ignore */ }

  // 余额
  let balanceLow = false;
  let balanceAlert = '';
  try {
    const card = getCardState();
    if (card.balance < 20) {
      balanceLow = true;
      balanceAlert = `余额${card.balance.toFixed(1)}元 ${card.balance < 10 ? '急需充值' : '建议充值'}`;
    }
  } catch { /* ignore */ }

  const tips = ['记得多喝水 💧', '久坐记得站起来活动活动', '今天也要加油呀 💪', '别忘了吃点水果 🍎', '有空去操场走走吧'];
  const dailyTip = `✨ ${tips[now.getDate() % tips.length]}`;

  return { greeting, date, weatherEmoji, weatherText, weatherTips, hasCourse, courseSummary, hasPackage, packageSummary, hasEvent, eventSummary, balanceLow, balanceAlert, dailyTip };
}

export function getScheduleCard(): Record<string, unknown> {
  const now = new Date();
  const dateLabel = `${now.getMonth() + 1}月${now.getDate()}日 周${WEEKDAY_NAMES[now.getDay()]}`;

  let courses: Record<string, unknown>[] = [];
  let noCourseMessage = '今天没有课，好好休息~';
  let summary = '';

  try {
    const raw = fetchCoursesForDate(new Date());
    if (raw.length > 0) {
      courses = raw.map(c => ({
        startTime: c.startTime,
        endTime: c.endTime,
        name: c.name,
        teacher: c.teacher,
        location: c.location || '待定',
      }));
      const isEarly8 = raw.some(c => c.startTime === '08:00');
      summary = isEarly8 ? `⏰ 早八！${raw.length} 节课` : `🟢 今日 ${raw.length} 节课`;
    }
  } catch { /* ignore */ }

  return { dateLabel, courses, noCourseMessage, summary };
}

export function getExamCard(): Record<string, unknown> {
  let exams: Record<string, unknown>[] = [];
  let summary = '';

  try {
    const countdowns = getExamCountdown();
    if (countdowns.length > 0) {
      const urgencyMap: Record<number, string> = {
        0: '🔴 今天', 1: '🟠 明天', 2: '🟡 2天', 3: '🟡 3天',
      };
      exams = countdowns.slice(0, 4).map(c => ({
        urgencyEmoji: urgencyMap[c.daysLeft] || (c.daysLeft <= 7 ? '🟡' : '🟢') + ` ${c.daysLeft}天`,
        label: `${c.exam.courseName} @${c.exam.location}`,
      }));

      const thisWeek = countdowns.filter(c => c.daysLeft <= 7).length;
      summary = thisWeek > 0 ? `📊 本周 ${thisWeek} 场考试，加油复习！` : '📊 考试临近，按计划复习';
    }
  } catch { /* ignore */ }

  return { exams, summary };
}

export function getBalanceCard(): Record<string, unknown> {
  let balanceText = '--';
  let balanceColor = '#999';
  let statusText = '';
  let statusColor = '#999';
  let todaySpent = '--';
  let weekSpent = '--';

  try {
    const card = getCardState();
    balanceText = `${card.balance.toFixed(1)} 元`;
    if (card.balance >= 50) { balanceColor = '#2ecc71'; statusText = '余额充足'; statusColor = '#2ecc71'; }
    else if (card.balance >= 20) { balanceColor = '#f39c12'; statusText = '余额偏低'; statusColor = '#f39c12'; }
    else if (card.balance >= 10) { balanceColor = '#e74c3c'; statusText = '余额不足'; statusColor = '#e74c3c'; }
    else { balanceColor = '#c0392b'; statusText = '急需充值'; statusColor = '#c0392b'; }

    // 消费统计
    const today = card.transactions.filter(t => {
      const tDate = new Date(t.time);
      const now = new Date();
      return tDate.toDateString() === now.toDateString();
    });
    todaySpent = today.reduce((s, t) => s + Math.abs(t.amount), 0).toFixed(1);

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const week = card.transactions.filter(t => new Date(t.time) >= weekAgo);
    weekSpent = week.reduce((s, t) => s + Math.abs(t.amount), 0).toFixed(1);
  } catch { /* ignore */ }

  return { balanceText, balanceColor, statusText, statusColor, todaySpent, weekSpent };
}

export function getPackageCard(): Record<string, unknown> {
  let summary = '';

  try {
    const pkgs = getActivePackages().filter(p => p.status === '已到站');
    if (pkgs.length > 0) {
      summary = pkgs.map(p => `${p.carrier}-${p.description || '快递'}\n取件码：${p.pickupCode} · 菜鸟驿站`).join('\n\n');
    }
  } catch { /* ignore */ }

  return { summary };
}
