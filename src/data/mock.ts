// ============================================================
// 模拟数据
// 初赛阶段使用模拟数据跑通全流程，复赛再接入真实 API
// ============================================================

import type { Course, CardState, ShowerState, WeatherInfo } from '../models/index.js';

// ---- 课表模拟 ----

/** 获取当前学期课表 */
export function getMockSchedule(): Course[] {
  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay() + 1); // 本周一

  return [
    {
      courseId: 'DS101',
      name: '数据结构',
      teacher: '张明远',
      location: '教三401',
      weekday: 1, // 周一
      startTime: '08:00',
      endTime: '09:40',
      weeks: Array.from({ length: 16 }, (_, i) => i + 1),
    },
    {
      courseId: 'DS101',
      name: '数据结构',
      teacher: '张明远',
      location: '教三401',
      weekday: 3, // 周三
      startTime: '08:00',
      endTime: '09:40',
      weeks: Array.from({ length: 16 }, (_, i) => i + 1),
    },
    {
      courseId: 'DS101',
      name: '数据结构',
      teacher: '张明远',
      location: '教三401',
      weekday: 5, // 周五
      startTime: '10:00',
      endTime: '11:40',
      weeks: Array.from({ length: 16 }, (_, i) => i + 1),
    },
    {
      courseId: 'OS202',
      name: '操作系统',
      teacher: '李华',
      location: '教二305',
      weekday: 2, // 周二
      startTime: '14:00',
      endTime: '15:40',
      weeks: Array.from({ length: 16 }, (_, i) => i + 1),
    },
    {
      courseId: 'OS202',
      name: '操作系统',
      teacher: '李华',
      location: '教二305',
      weekday: 4, // 周四
      startTime: '14:00',
      endTime: '15:40',
      weeks: Array.from({ length: 16 }, (_, i) => i + 1),
    },
    {
      courseId: 'DB301',
      name: '数据库原理',
      teacher: '王芳',
      location: '教五201',
      weekday: 1, // 周一
      startTime: '10:00',
      endTime: '11:40',
      weeks: Array.from({ length: 16 }, (_, i) => i + 1),
    },
    {
      courseId: 'DB301',
      name: '数据库原理',
      teacher: '王芳',
      location: '教五201',
      weekday: 3, // 周三
      startTime: '10:00',
      endTime: '11:40',
      weeks: Array.from({ length: 16 }, (_, i) => i + 1),
    },
  ];
}

/** 获取指定日期的课程 */
export function getScheduleForDate(date: Date, schedule?: Course[]): Course[] {
  const courses = schedule || getMockSchedule();
  const weekday = date.getDay() === 0 ? 7 : date.getDay(); // 转换周日为 7
  return courses.filter((c) => c.weekday === weekday).sort((a, b) => a.startTime.localeCompare(b.startTime));
}

// ---- 一卡通模拟 ----

let cardState: CardState = {
  balance: 12.0,
  todaySpent: 15.5,
  weekSpent: 63.5,
  transactions: [
    { time: '2026-07-16T07:45:00+08:00', amount: 5.0, location: '二食堂一楼', category: '早餐' },
    { time: '2026-07-16T12:10:00+08:00', amount: 10.5, location: '二食堂二楼', category: '午餐' },
    { time: '2026-07-15T07:30:00+08:00', amount: 4.5, location: '一食堂', category: '早餐' },
    { time: '2026-07-15T12:05:00+08:00', amount: 12.0, location: '二食堂二楼', category: '午餐' },
    { time: '2026-07-15T17:35:00+08:00', amount: 2.5, location: '澡堂', category: '洗澡' },
    { time: '2026-07-15T18:20:00+08:00', amount: 8.0, location: '二食堂一楼', category: '晚餐' },
    { time: '2026-07-14T07:50:00+08:00', amount: 5.5, location: '一食堂', category: '早餐' },
    { time: '2026-07-14T12:00:00+08:00', amount: 13.0, location: '三食堂', category: '午餐' },
    { time: '2026-07-14T18:10:00+08:00', amount: 9.0, location: '二食堂一楼', category: '晚餐' },
  ],
};

export function getCardState(): CardState {
  return { ...cardState, transactions: [...cardState.transactions] };
}

export function deductCardBalance(amount: number, location: string, category: CardState['transactions'][0]['category']): CardState {
  cardState.balance -= amount;
  cardState.transactions.unshift({
    time: new Date().toISOString(),
    amount,
    location,
    category,
  });
  return getCardState();
}

export function resetCardState(): void {
  cardState = {
    balance: 12.0,
    todaySpent: 15.5,
    weekSpent: 63.5,
    transactions: [...cardState.transactions],
  };
}

// ---- 澡堂模拟 ----

let showerState: ShowerState = {
  balance: 3.2,
  pricePerShower: 2.5,
  crowdLevel: '空闲',
};

export function getShowerState(): ShowerState {
  // 根据时间动态调整拥挤度
  const hour = new Date().getHours();
  if (hour >= 17 && hour <= 19) {
    showerState.crowdLevel = '拥挤';
  } else if (hour >= 12 && hour <= 14) {
    showerState.crowdLevel = '适中';
  } else if (hour >= 20 && hour <= 22) {
    showerState.crowdLevel = '适中';
  } else {
    showerState.crowdLevel = '空闲';
  }
  return { ...showerState };
}

export function deductShowerBalance(): ShowerState {
  showerState.balance = Math.max(0, showerState.balance - showerState.pricePerShower);
  showerState.lastShowerTime = new Date().toISOString();
  return { ...showerState };
}

// ---- 天气模拟 ----

const weatherConditions = ['晴', '多云', '阴', '小雨', '中雨'];

export function getMockWeather(date: Date): WeatherInfo {
  const seed = date.getDate() + date.getMonth() * 31;
  const condition = weatherConditions[seed % weatherConditions.length];

  const baseTemp = 30; // 七月中旬基准温度
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

// ---- 饮水模拟 ----

let waterToday = 600; // 今日已饮水 ml

export function getWaterIntake(): { current: number; goal: number; percent: number } {
  return {
    current: waterToday,
    goal: 1500,
    percent: Math.round((waterToday / 1500) * 100),
  };
}

export function addWater(ml: number): { current: number; goal: number; percent: number } {
  waterToday += ml;
  return getWaterIntake();
}

export function resetWaterIntake(): void {
  waterToday = 0;
}
