// ============================================================
// Agent 主入口 —— 校园搭子核心
// 负责：接收用户输入 → 意图识别 → 场景路由 → 编排执行 → 返回回复
// ============================================================

import { recognizeIntent } from './core/intent/engine.js';
import { recordMessage, updateSessionContext, getSession, resetSession, learnPattern } from './core/memory/engine.js';
import { checkTriggers, registerTrigger, resetCooldowns } from './core/triggers/engine.js';
import { handleShowerIntent, handleShowerDone } from './scenes/shower.js';
import { handleScheduleQuery } from './scenes/schedule.js';
import { handleCardQuery, checkLowBalance } from './scenes/card.js';
import {
  handlePackageQuery,
  handleDeliveryQuery,
  handleDeliverySummary,
  handleRoutePlan,
  handlePickupComplete,
} from './scenes/delivery.js';
import { handleForumQuery } from './scenes/forum.js';
import { handleMapQuery, setCurrentLocation, handleBuildingQuery } from './scenes/map.js';
import { getCardState, getShowerState, getWaterIntake, addWater, getActivePackages, getPickupPoints, findBuilding } from './data/mock.js';
import { getUserHabits, getLongTermKnowledge } from './core/memory/engine.js';
import { fetchWeather } from './services/weather.js';
import { fetchAllCourses } from './services/scheduleData.js';
import type { AgentResponse, TriggerContext, Course, WeatherInfo } from './models/index.js';

// ---- 会话上下文（指代消解） ----

/**
 * Agent 主处理函数
 * @param text 用户输入
 * @returns Agent 响应
 */
export async function processMessage(text: string): Promise<AgentResponse> {
  // 记录用户消息
  recordMessage('user', text);

  const session = getSession();
  const trimmed = text.trim();

  // ---- 特殊命令 ----
  if (trimmed === '洗完了' || trimmed.includes('洗完了') || trimmed.includes('洗好') || trimmed.includes('洗过了')) {
    return handleShowerDoneFlow();
  }

  // 记录喝水
  const waterMatch = trimmed.match(/(?:喝水|喝了|记录)\s*(\d+)\s*(?:ml|毫升)/);
  if (waterMatch) {
    const ml = parseInt(waterMatch[1]);
    const water = addWater(ml);
    const remaining = water.goal - water.current;
    const msg = `已记录 ${ml}ml！今日 ${water.current}/${water.goal}ml（${water.percent}%）。${remaining > 0 ? `还差 ${remaining}ml。` : '已完成目标，很棒！🎉'}`;
    recordMessage('agent', msg);
    return { text: msg, suggestions: ['再喝一杯', '看看今日进度'] };
  }

  if (trimmed === '重置' || trimmed === 'reset') {
    resetSession();
    return { text: '会话已重置，有什么可以帮你的？' };
  }

  // ---- 指代消解：处理短路追问 ----

  const lastIntent = session.context.lastIntent;

  // 「够不够？」→ 根据上次意图判断
  if (trimmed.includes('够不够') || trimmed.includes('够吗')) {
    if (lastIntent === 'shower') {
      const state = getShowerState();
      const count = Math.floor(state.balance / state.pricePerShower);
      recordMessage('agent', `余额 ${state.balance.toFixed(1)}，大概能洗 ${count} 次`);
      return { text: `够的，余额 ${state.balance.toFixed(1)} 元，大概能洗 ${count} 次。`, suggestions: ['现在去洗', '先充值'] };
    }
    if (lastIntent === 'card') {
      const card = getCardState();
      const evalStr = card.balance > 30 ? '很充裕' : card.balance > 15 ? '正常' : '偏低';
      recordMessage('agent', `余额 ${card.balance.toFixed(1)}，状态：${evalStr}`);
      return { text: `一卡通余额 ${card.balance.toFixed(1)} 元，${evalStr}。`, suggestions: ['充值', '查消费'] };
    }
  }

  // 「几点去比较好？」→ 根据上次意图
  if ((trimmed.includes('几点') && trimmed.includes('去')) || trimmed.includes('什么时候去')) {
    if (lastIntent === 'shower') {
      const habits = getUserHabits();
      const state = getShowerState();
      const response = `你习惯 ${habits.showerTime} 左右去。现在澡堂${state.crowdLevel}，${state.crowdLevel === '空闲' ? '随时可以去。' : state.crowdLevel === '拥挤' ? '建议等半小时。' : '可以去，不挤。'}`;
      recordMessage('agent', response);
      return { text: response };
    }
  }

  // 「中午吃什么」→ 查课表确认中午有空 + 一卡通余额 + 食堂推荐
  if (trimmed.includes('吃什么') || trimmed.includes('吃啥') || trimmed.includes('去食堂')) {
    return handleMealQuery();
  }

  // 「穿什么」→ 查天气 + 穿衣建议
  if (trimmed.includes('穿什么') || trimmed.includes('穿啥') || trimmed.includes('穿多少')) {
    return await handleClothingQuery();
  }

  // 「几点睡」/「该睡了」→ 查明天课表 + 睡眠建议
  if (trimmed.includes('几点睡') || trimmed.includes('该睡了') || trimmed.includes('睡觉')) {
    return handleSleepQuery();
  }

  // 「取完了」/「拿完了」→ 标记快递或外卖已取
  if (trimmed.includes('取完了') || trimmed.includes('拿完了') || trimmed.includes('拿到了') || trimmed.includes('取到了') || trimmed.includes('拿回来了')) {
    recordMessage('agent', ''); // placeholder, handlePickupComplete will record
    return handlePickupComplete(trimmed);
  }

  // 「取件码」→ 快速查看取件码
  if (trimmed.includes('取件码') || trimmed.includes('货架号') || trimmed.includes('哪个柜')) {
    const packages = getActivePackages().filter(p => p.status === '已到站');
    if (packages.length === 0) {
      return { text: '没有待取的快递。', suggestions: ['查快递', '查外卖'] };
    }
    const points = getPickupPoints();
    const lines = packages.map(p => {
      const point = points.find(pp => pp.id === p.pickupPoint);
      return `${p.carrier} ${p.description || ''}: ${p.pickupCode}（${point?.name || p.pickupPoint}）`;
    });
    const msg = '📦 取件码：\n' + lines.join('\n');
    recordMessage('agent', msg);
    return { text: msg, suggestions: ['帮我规划路线', '查外卖'] };
  }

  // 「我在XX」→ 设置当前位置
  if (trimmed.startsWith('我在') || trimmed.startsWith('我现在在') || trimmed.startsWith('到') && (trimmed.includes('教') || trimmed.includes('图书馆') || trimmed.includes('食堂'))) {
    const locText = trimmed.replace(/^(我在|我现在在)/, '').trim();
    const bld = findBuilding(locText);
    if (bld && setCurrentLocation(bld.id)) {
      const msg = `📍 已记录位置：${bld.name}${bld.description ? '（' + bld.description + '）' : ''}`;
      recordMessage('agent', msg);
      return { text: msg, suggestions: ['附近有什么', '图书馆怎么走', '到二食堂怎么走'] };
    }
  }

  // ---- 意图识别 ----

  const intent = recognizeIntent(text);

  // 记录意图到会话
  if (intent.category !== 'unknown') {
    updateSessionContext({
      lastIntent: intent.category,
      lastTopic: text,
    });
    learnPattern(intent.category, new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }));
  }

  // ---- 场景路由 ----

  let response: AgentResponse;

  switch (intent.category) {
    case 'shower':
      response = (await handleShowerIntent()).response;
      break;

    case 'schedule': {
      const dateEntity = intent.extractedEntities.date || 'today';
      response = (await handleScheduleQuery(dateEntity)).response;
      break;
    }

    case 'card':
      response = (await handleCardQuery(text)).response;
      break;

    case 'weather': {
      const weatherDate = intent.extractedEntities.date === 'tomorrow'
        ? new Date(Date.now() + 86400000)
        : new Date();
      const weather = await fetchWeather(weatherDate);
      const dateLabel = intent.extractedEntities.date === 'tomorrow' ? '明天' : '今天';
      response = {
        text: `${dateLabel}天气：${weather.condition}，${weather.tempLow}°C ~ ${weather.tempHigh}°C，湿度 ${weather.humidity}%，风力 ${weather.windLevel} 级。${weather.tips}`,
        suggestions: ['查课表', '穿什么'],
      };
      break;
    }

    case 'water': {
      const water = getWaterIntake();
      const remaining = water.goal - water.current;
      response = {
        text: `今日已饮水 ${water.current}ml（目标 ${water.goal}ml，完成 ${water.percent}%）。${remaining > 0 ? `还差 ${remaining}ml，记得多喝水哦！` : '已完成今日目标，很棒！🎉'}`,
        suggestions: ['记录喝水 200ml', '设置喝水提醒'],
      };
      break;
    }

    case 'delivery': {
      // 子意图路由
      if (text.includes('外卖') && !text.includes('快递')) {
        response = await handleDeliveryQuery();
      } else if (text.includes('快递') && !text.includes('外卖')) {
        response = await handlePackageQuery();
      } else if (text.includes('路线') || text.includes('怎么拿') || text.includes('先去') || text.includes('规划')) {
        response = await handleRoutePlan();
      } else if (text.includes('取件码') || text.includes('哪个柜')) {
        // 已在上面shortcut处理，这里兜底
        response = await handlePackageQuery();
      } else {
        // 综合查询
        response = await handleDeliverySummary();
      }
      break;
    }

    case 'forum': {
      response = handleForumQuery(text);
      break;
    }

    case 'map': {
      response = handleMapQuery(text);
      break;
    }

    default:
      response = {
        text: getFallbackResponse(text),
        suggestions: ['查课表', '查一卡通余额', '我要洗澡', '查天气'],
      };
      break;
  }

  // 记录回复
  recordMessage('agent', response.text);
  return response;
}

// ---- 辅助函数 ----

async function handleShowerDoneFlow(): Promise<AgentResponse> {
  const result = await handleShowerDone();
  recordMessage('agent', result.response.text);
  return result.response;
}

function handleMealQuery(): AgentResponse {
  const card = getCardState();
  const habits = getUserHabits();
  const knowledge = getLongTermKnowledge();
  const session = getSession();
  const hour = new Date().getHours();
  let mealType = '午餐';
  if (hour < 10) mealType = '早餐';
  else if (hour < 14) mealType = '午餐';
  else mealType = '晚餐';

  const canteen = habits.frequentCanteen;
  const canteenInfo = knowledge.campusRules.canteenHours[canteen];
  const canteenNote = canteenInfo?.restDay === new Date().getDay() ? '（今天休息！）' : '';

  const balanceEval =
    card.balance > 30 ? '余额充足，随便吃'
    : card.balance > 15 ? '余额还行，注意控制'
    : `余额偏低（${card.balance.toFixed(1)} 元），可能需要充值`;

  let scheduleNote = '';
  if (session.context.lastIntent === 'schedule' && mealType === '午餐') {
    scheduleNote = '\n上午有课的话，下课直奔食堂，避开 12:00-12:30 高峰期。';
  }

  const msg = [
    `你常去${canteen}${canteenNote}`,
    `一卡通 ${balanceEval}`,
    scheduleNote,
    `${canteen} 人均 10-15 元。${hour < 10 ? '二食堂一楼包子不错！' : hour < 14 ? '二楼窗口选择多。' : '一楼自选菜随便挑。'}`,
  ].filter(Boolean).join('\n');

  recordMessage('agent', msg);
  return { text: msg, suggestions: ['查消费明细', '充值', '看看别的食堂'] };
}

async function handleClothingQuery(): Promise<AgentResponse> {
  const weather = await fetchWeather(new Date());
  const temp = (weather.tempLow + weather.tempHigh) / 2;
  let suggestion = '';
  if (temp > 30) suggestion = '短袖短裤就行，注意防晒。';
  else if (temp > 25) suggestion = '短袖 + 薄长裤，带把伞防晒。';
  else if (temp > 20) suggestion = '薄长袖 + 长裤，舒适刚好。';
  else if (temp > 15) suggestion = '建议穿外套，早晚有点凉。';
  else suggestion = '多穿点，外面有点冷。';
  if (weather.condition.includes('雨')) suggestion += ' 记得带伞！';
  const msg = `今天 ${weather.condition}，${weather.tempLow}-${weather.tempHigh}°C。${suggestion}`;
  recordMessage('agent', msg);
  return { text: msg, suggestions: ['明天天气', '明天穿什么'] };
}

function handleSleepQuery(): AgentResponse {
  const tomorrow = new Date(Date.now() + 86400000);
  const courses = fetchAllCourses().filter(c => {
    const targetWeekday = tomorrow.getDay() === 0 ? 7 : tomorrow.getDay();
    return c.weekday === targetWeekday;
  }).sort((a, b) => a.startTime.localeCompare(b.startTime));
  const habits = getUserHabits();

  if (courses.length === 0) {
    const msg = '明天没课！可以睡到自然醒~不过也别太晚，规律作息对身体好。';
    recordMessage('agent', msg);
    return { text: msg };
  }

  const firstCourse = courses[0];
  if (firstCourse.startTime === '08:00') {
    const now = new Date();
    const [wakeH] = habits.wakeTime.split(':').map(Number);
    const sleepH = wakeH - 8;
    const sleepDate = new Date(now);
    sleepDate.setHours(sleepH < 0 ? sleepH + 24 : sleepH, 0, 0, 0);
    const hoursRemaining = Math.floor((sleepDate.getTime() - now.getTime()) / 3600000);
    const msg = `明天早八《${firstCourse.name}》，建议 ${habits.wakeTime} 起床。\n现在睡还能睡约 ${hoursRemaining} 小时，早点休息！`;
    recordMessage('agent', msg);
    return { text: msg, suggestions: ['设闹钟', '明天什么课'] };
  }

  const msg = `明天第一节 ${firstCourse.startTime} 《${firstCourse.name}》，不用太早。23:00 前睡就好。`;
  recordMessage('agent', msg);
  return { text: msg };
}

function getFallbackResponse(text: string): string {
  if (text.includes('你好') || text.includes('嗨') || text.includes('hi')) {
    return '你好！我是你的校园搭子小搭~ 想查课表、看余额、还是准备去洗澡？';
  }
  if (text.includes('谢谢') || text.includes('感谢')) {
    return '不客气！有需要随时找我~';
  }
  if (text.includes('晚安')) {
    return handleSleepQuery().text;
  }
  return '抱歉，我还不太理解。\n\n我能帮你：\n• 地图："教三在哪" "去哪打印" "到图书馆怎么走"\n• 快递："查快递" "取件码是多少"\n• 外卖："外卖到了吗"\n• 取件："帮我规划路线" "取完了"\n• 论坛："论坛首页" "有什么活动" "课程评价"\n• 课表："明天什么课"\n• 一卡通："卡里还有多少钱"\n• 洗澡："我要洗澡"\n• 天气："今天天气"\n• 吃饭："中午吃什么"\n• 喝水："喝了200ml"\n• 睡眠："几点睡"';
}

// ---- 主动触发（由定时任务调用） ----

/**
 * 注册内置触发器规则
 */
export function registerBuiltinTriggers(): void {
  // 低余额提醒
  registerTrigger({
    id: 'low_balance_alert',
    name: '一卡通低余额提醒',
    cooldownMinutes: 360, // 6 小时冷却
    condition: (ctx: TriggerContext) => {
      return ctx.cardState.balance < ctx.habits.showerThreshold + 10;
    },
    action: async (ctx: TriggerContext) => ({
      text: `⚠️ 一卡通余额仅剩 ${ctx.cardState.balance.toFixed(1)} 元，建议尽快充值。`,
      suggestions: ['去充值', '知道了'],
    }),
  });

  // 早八提醒（由外部定时器每晚 21:30 调用）
  registerTrigger({
    id: 'early_eight_reminder',
    name: '早八提醒',
    cooldownMinutes: 1200, // 20 小时冷却
    condition: (ctx: TriggerContext) => {
      if (ctx.tomorrowSchedule.length === 0) return false;
      const first = ctx.tomorrowSchedule[0];
      return first.startTime === '08:00';
    },
    action: async (ctx: TriggerContext) => {
      const course = ctx.tomorrowSchedule[0];
      const habits = ctx.habits;
      const weather = ctx.weather;
      const card = ctx.cardState;

      const parts: string[] = [
        `明天早八《${course.name}》${course.location}`,
        `建议 ${habits.wakeTime} 起床`,
      ];

      if (weather) {
        parts.push(`${weather.condition} ${weather.tempLow}-${weather.tempHigh}°C`);
      }
      if (card.balance < 15) {
        parts.push(`一卡通余额 ${card.balance.toFixed(1)} 元（偏低，建议充值）`);
      }

      return {
        text: parts.join(' | '),
        suggestions: ['设闹钟', '充值'],
      };
    },
  });

  console.log('[Agent] 内置触发器已注册');
}

/**
 * 执行主动触发器检查（由外部定时任务调用）
 */
export async function runScheduledCheck(time: Date): Promise<AgentResponse[]> {
  const habits = getUserHabits();
  const tomorrow = new Date(time.getTime() + 86400000);
  const schedule = fetchAllCourses();

  const context: TriggerContext = {
    currentTime: time,
    tomorrowSchedule: schedule.filter((c: Course) => {
      const targetWeekday = tomorrow.getDay() === 0 ? 7 : tomorrow.getDay();
      return c.weekday === targetWeekday;
    }),
    cardState: getCardState(),
    showerState: getShowerState(),
    habits,
    weather: await fetchWeather(tomorrow),
  };

  return checkTriggers(context);
}
