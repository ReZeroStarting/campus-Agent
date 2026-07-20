// ============================================================
// Agent 主入口 —— 校园搭子核心
// 负责：接收用户输入 → 指代消解 → 意图识别 → 场景路由 → LLM增强 → 返回回复
// v2: 管道架构，指代消解/意图识别独立模块，结构化日志
// ============================================================

import { recognizeIntent } from './core/intent/engine.js';
import { makeAnaphoraStage, stageRecognizeIntent, composePipeline, type PipelineContext } from './core/pipeline/middleware.js';
import { recordMessage, getSession, resetSession, getRecentConversations, resumeSession as engineResumeSession } from './core/memory/engine.js';
import { listSessions, archiveSession } from './core/memory/history.js';
import { generateResponse } from './core/llm/generator.js';
import { isLlmAvailable } from './core/llm/client.js';
import { ragQuery, shouldUseRag } from './core/rag/pipeline.js';
import { initScheduleImport } from './services/scheduleImport.js';
import { getImportedGrades, setImportedGrades, clearImportedGrades, parseGradeExcel } from './services/gradeImport.js';
import { loadGrades, saveGrades, getStorageStatus } from './services/storage.js';
import { checkTriggers, registerTrigger, resetCooldowns } from './core/triggers/engine.js';
import { createTimedLogger } from './services/logger.js';

// 启动时加载持久化数据
initScheduleImport();
if (loadGrades()) {
  setImportedGrades(loadGrades()!);
  console.log('[Agent] 已加载持久化成绩数据');
}

// ── 场景处理 ──
import { handleShowerIntent, handleShowerDone } from './scenes/shower.js';
import { handleScheduleQuery } from './scenes/schedule.js';
import { handleCardQuery } from './scenes/card.js';
import {
  handlePackageQuery,
  handleDeliveryQuery,
  handleDeliverySummary,
  handleRoutePlan,
  handlePickupComplete,
} from './scenes/delivery.js';
import { handleForumQuery } from './scenes/forum.js';
import { handleMapQuery } from './scenes/map.js';
import { handleMorningBrief } from './scenes/morning-brief.js';
import { handleExamQuery } from './scenes/exam.js';
import { handleClassroomQuery } from './scenes/classroom.js';
import { handleGradeQuery } from './scenes/grade.js';
import { fetchWeather } from './services/weather.js';
import { fetchAllCourses } from './services/scheduleData.js';
import { getUserHabits, getLongTermKnowledge } from './core/memory/engine.js';
import type { AgentResponse, TriggerContext, Course, WeatherInfo } from './models/index.js';

// ── 模拟数据 ──
import {
  getCardState, getShowerState, getWaterIntake, addWater,
} from './data/mocks/index.js';

// ============================================================
// Agent 主处理函数
// ============================================================

export async function processMessage(text: string): Promise<AgentResponse> {
  const timed = createTimedLogger('Agent', 'process_message');
  recordMessage('user', text);

  const session = getSession();
  const trimmed = text.trim();

  // ── 阶段 1: 特殊命令快速通道 ──
  const shortcut = handleShortcut(trimmed);
  if (shortcut) {
    recordMessage('agent', shortcut.text);
    timed.finish('shortcut_handled');
    return shortcut;
  }

  // ── 阶段 2+3: 管道执行（指代消解 → 意图识别）──
  const pipelineCtx = await composePipeline(
    { text: trimmed, session, didLLMCall: false, traceId: timed.traceId },
    [makeAnaphoraStage(handleDelegatedAnaphora), stageRecognizeIntent],
  );

  // 管道阶段短路：指代消解命中
  if (pipelineCtx.response) {
    timed.finish('pipeline_anaphora_hit');
    return pipelineCtx.response;
  }

  // ── 阶段 3: 对话管理命令 ──
  const convResult = await handleConversationCommand(trimmed);
  if (convResult) {
    timed.finish('conversation_command');
    return convResult;
  }

  // ── 阶段 4: 意图识别结果（管道已计算）──
  const intent = pipelineCtx.intent || recognizeIntent(text);

  // ── 阶段 5: 场景路由 ──
  let didLLMCall = false;
  let response = await routeScene(intent, text);
  const templateFallback = { text: response.text, suggestions: response.suggestions };

  // ── 阶段 6: RAG + LLM 增强 ──
  if (intent.category === 'unknown') {
    // RAG 优先
    if (shouldUseRag(text)) {
      const ragResult = await ragQuery(text);
      if (ragResult) {
        didLLMCall = true; // ragQuery 内部调了 LLM
        recordMessage('agent', ragResult.text);
        timed.finish('rag_handled', { intent: intent.category, llmCalled: true });
        return {
          text: ragResult.text + (ragResult.sources.length > 0 ? `\n📚 参考：${ragResult.sources.join('、')}` : ''),
          suggestions: ragResult.suggestions,
        };
      }
      // RAG 无结果，不用 LLM 再调一次（防止双重调用）
      // 直接走模板兜底
      timed.info('rag_no_result_fallback');
      recordMessage('agent', response.text);
      timed.finish('template_fallback', { intent: intent.category, llmCalled: false });
      return response;
    }
  }

  // LLM 增强（已知意图）
  if (isLlmAvailable() && !didLLMCall) {
    const enhanceTimed = createTimedLogger('Agent', 'llm_enhance');
    response = await generateResponse({
      userMessage: text,
      intent: intent.category,
      sceneResult: templateFallback,
      fallbackForUnknown: {
        text: getFallbackResponse(text),
        suggestions: ['查课表', '查一卡通余额', '我要洗澡', '查天气'],
      },
    });
    enhanceTimed.finish('llm_enhance_done', { intent: intent.category });
  }

  recordMessage('agent', response.text);
  timed.finish('process_done', { intent: intent.category, llmCalled: !didLLMCall && isLlmAvailable() });
  return response;
}

// ============================================================
// 阶段实现函数
// ============================================================

/** 特殊命令快速通道 */
function handleShortcut(text: string): AgentResponse | null {
  if (text === '重置' || text === 'reset') {
    resetSession();
    return { text: '会话已重置，有什么可以帮你的？' };
  }

  const waterMatch = text.match(/(?:喝水|喝了|记录)\s*(\d+)\s*(?:ml|毫升)/);
  if (waterMatch) {
    const ml = parseInt(waterMatch[1]);
    const water = addWater(ml);
    const remaining = water.goal - water.current;
    const msg = `已记录 ${ml}ml！今日 ${water.current}/${water.goal}ml（${water.percent}%）。${remaining > 0 ? `还差 ${remaining}ml。` : '已完成目标，很棒！🎉'}`;
    return { text: msg, suggestions: ['再喝一杯', '看看今日进度'] };
  }

  if (text.includes('洗完了') || text.includes('洗好') || text.includes('洗过了')) {
    return null; // 由 handleShowerDoneFlow 处理，但走 anaphora
  }

  return null;
}

/** 指代消解 — 委托模式（引擎返回 null 的规则，由 agent 层处理） */
async function handleDelegatedAnaphora(text: string): Promise<AgentResponse | null> {
  // 吃什么 / 吃啥 / 去食堂
  if (/吃什么|吃啥|去食堂/.test(text)) return handleMealQuery();
  // 穿什么 / 穿啥 / 穿多少
  if (/穿什么|穿啥|穿多少/.test(text)) return await handleClothingQuery();
  // 几点睡 / 该睡了 / 睡觉
  if (/几点睡|该睡了|睡觉/.test(text)) return handleSleepQuery();
  // 取完了 / 拿到了 / 取到了 / 拿回来了
  if (/取完了|拿完了|拿到了|取到了|拿回来了/.test(text)) return handlePickupComplete(text);
  // 洗完了 / 洗好了 / 洗过了（需要异步）
  if (/洗完了|洗好了|洗过了/.test(text)) {
    const result = await handleShowerDone();
    return result.response;
  }
  return null;
}

/** 对话管理命令 */
async function handleConversationCommand(text: string): Promise<AgentResponse | null> {
  if (text === '新对话' || text === '开始新对话' || text === '清空对话' || text === '重置对话' || text === '重新开始') {
    resetSession();
    return { text: '✨ 已开启新对话！之前的历史已自动保存，输入「历史」可查看。', suggestions: ['查课表', '查一卡通', '我要洗澡'] };
  }

  if (text === '历史' || text === '历史对话' || text === '对话记录' || text === '历史记录') {
    const list = getRecentConversations(8);
    if (list.length === 1 && (list[0] as any).messageCount === 0) {
      return { text: '还没有历史对话。', suggestions: ['开始新对话'] };
    }
    const lines = list.map((s, i) => {
      const isCurrent = (s as any).isCurrent ? '🟢 ' : '   ';
      const time = new Date(s.startTime).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
      return `${isCurrent}${i + 1}. ${s.title}  (${s.messageCount}条 · ${time})`;
    });
    return { text: `📚 你的对话历史：\n${lines.join('\n')}\n\n输入「回到 N」继续上次对话`, suggestions: ['新对话', '回到 1'] };
  }

  const resumeMatch = text.match(/^回到\s*(\d+)$/) || (text.includes('继续上次') ? ['继续上次', '1'] : null);
  if (resumeMatch) {
    const idx = parseInt(resumeMatch[1]) - 1;
    const list = listSessions(20);
    if (idx < 0 || idx >= list.length) {
      return { text: `没有第 ${idx + 1} 个历史对话。`, suggestions: ['历史', '新对话'] };
    }
    if (getSession().history.length > 0) archiveSession(getSession());
    const restored = engineResumeSession(list[idx].sessionId);
    if (restored) {
      const lastMsg = restored.history[restored.history.length - 1];
      return { text: `↩️ 已回到「${list[idx].title}」\n最后一句：「${lastMsg.text}」\n\n继续聊吧～`, suggestions: ['历史', '新对话'] };
    }
  }

  if (text.includes('早安') || text.includes('早上好') || text.includes('日报') || text.includes('今天有什么') || text.includes('今日简报')) {
    return await handleMorningBrief();
  }

  return null;
}

/** 场景路由 */
async function routeScene(intent: ReturnType<typeof recognizeIntent>, text: string): Promise<AgentResponse> {
  switch (intent.category) {
    case 'shower': {
      const result = await handleShowerIntent();
      return result.response;
    }
    case 'schedule': {
      const dateEntity = intent.extractedEntities.date || 'today';
      const result = await handleScheduleQuery(dateEntity);
      return result.response;
    }
    case 'card': {
      const result = await handleCardQuery(text);
      return result.response;
    }
    case 'weather': {
      const weatherDate = intent.extractedEntities.date === 'tomorrow'
        ? new Date(Date.now() + 86400000)
        : new Date();
      const weather = await fetchWeather(weatherDate);
      const dateLabel = intent.extractedEntities.date === 'tomorrow' ? '明天' : '今天';
      return {
        text: `${dateLabel}天气：${weather.condition}，${weather.tempLow}°C ~ ${weather.tempHigh}°C，湿度 ${weather.humidity}%，风力 ${weather.windLevel} 级。${weather.tips}`,
        suggestions: ['查课表', '穿什么'],
      };
    }
    case 'water': {
      const water = getWaterIntake();
      const remaining = water.goal - water.current;
      return {
        text: `今日已饮水 ${water.current}ml（目标 ${water.goal}ml，完成 ${water.percent}%）。${remaining > 0 ? `还差 ${remaining}ml，记得多喝水哦！` : '已完成今日目标，很棒！🎉'}`,
        suggestions: ['记录喝水 200ml', '设置喝水提醒'],
      };
    }
    case 'delivery': {
      if (text.includes('外卖') && !text.includes('快递')) return await handleDeliveryQuery();
      if (text.includes('快递') && !text.includes('外卖')) return await handlePackageQuery();
      if (text.includes('路线') || text.includes('怎么拿') || text.includes('先去') || text.includes('规划')) return await handleRoutePlan();
      return await handleDeliverySummary();
    }
    case 'forum': return handleForumQuery(text);
    case 'map': return handleMapQuery(text);
    case 'exam': return handleExamQuery(text);
    case 'classroom': return handleClassroomQuery(text);
    case 'grade': return handleGradeQuery(text);
    default:
      return { text: getFallbackResponse(text), suggestions: ['查课表', '查一卡通余额', '我要洗澡', '查天气'] };
  }
}

// ── 辅助函数 ──

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
  return { text: msg, suggestions: ['明天天气', '明天穿什么'] };
}

function handleSleepQuery(): AgentResponse {
  const tomorrow = new Date(Date.now() + 86400000);
  const courses = fetchAllCourses().filter(c => {
    const targetWeekday = tomorrow.getDay() === 0 ? 7 : tomorrow.getDay();
    return c.weekday === targetWeekday;
  }).sort((a, b) => a.startTime.localeCompare(b.startTime));
  const habits = getUserHabits();

  if (courses.length === 0) return { text: '明天没课！可以睡到自然醒~不过也别太晚，规律作息对身体好。' };

  const firstCourse = courses[0];
  if (firstCourse.startTime === '08:00') {
    const now = new Date();
    const [wakeH] = habits.wakeTime.split(':').map(Number);
    const sleepH = wakeH - 8;
    const sleepDate = new Date(now);
    sleepDate.setHours(sleepH < 0 ? sleepH + 24 : sleepH, 0, 0, 0);
    const hoursRemaining = Math.floor((sleepDate.getTime() - now.getTime()) / 3600000);
    return { text: `明天早八《${firstCourse.name}》，建议 ${habits.wakeTime} 起床。\n现在睡还能睡约 ${hoursRemaining} 小时，早点休息！`, suggestions: ['设闹钟', '明天什么课'] };
  }

  return { text: `明天第一节 ${firstCourse.startTime} 《${firstCourse.name}》，不用太早。23:00 前睡就好。` };
}

// ── 人格化回复 ──
const GREETINGS = [
  '嗨！我是小搭，你的校园生活搭子 🙌 课表、余额、考试、快递……想问什么随时说~',
  '你好呀！🌟 查课表、看余额、找教室都找我，一句话搞定。',
  '嘿！在呢~ 👋 今天需要我帮忙查什么？',
];
const THANKS_REPLIES = [
  '客气啥，随时找我~ 😄',
  '不客气！帮到你就好 ✨',
  '举手之劳~有问题再来 👋',
];
const SORRY_PREFIXES = [
  'emmm 这个还没学会…', '唔，这个我不太懂…', '啊，超出我的知识范围了…',
];
const CHEER_UP = [
  '💪 加油！', '你可以的！✨', '冲冲冲 🚀', '今天也很棒 🌟',
];

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

function getFallbackResponse(text: string): string {
  if (text.includes('你好') || text.includes('嗨') || text.includes('hi') || text.includes('在吗') || text.includes('在不在'))
    return pick(GREETINGS);
  if (text.includes('谢谢') || text.includes('感谢') || text.includes('多谢'))
    return pick(THANKS_REPLIES);
  if (text.includes('晚安') || text.includes('睡了'))
    return handleSleepQuery().text;
  if (text.includes('加油') || text.includes('冲冲冲'))
    return pick(CHEER_UP);
  if (text.includes('无聊') || text.includes('不知道干嘛'))
    return '那就去逛逛论坛？说不定有好玩的活动或者想买的二手~ 或者查查有没有快递到了？📦';
  return pick(SORRY_PREFIXES) + '\n\n我能帮你的：\n• "早安" — 一日早报，天气课表快递全知道\n• "明天什么课" "考试倒计时" "绩点多少"\n• "找空教室" "卡里还有多少钱" "查快递"\n• "论坛" "教三在哪" "我要洗澡" "今天天气"\n\n试试看？😊';
}

// ---- 主动触发（由定时任务调用） ----

export function registerBuiltinTriggers(): void {
  registerTrigger({
    id: 'low_balance_alert',
    name: '一卡通低余额提醒',
    cooldownMinutes: 360,
    condition: (ctx: TriggerContext) => {
      return ctx.cardState.balance < ctx.habits.showerThreshold + 10;
    },
    action: async (ctx: TriggerContext) => ({
      text: `⚠️ 一卡通余额仅剩 ${ctx.cardState.balance.toFixed(1)} 元，建议尽快充值。`,
      suggestions: ['去充值', '知道了'],
    }),
  });

  registerTrigger({
    id: 'early_eight_reminder',
    name: '早八提醒',
    cooldownMinutes: 1200,
    condition: (ctx: TriggerContext) => {
      if (ctx.tomorrowSchedule.length === 0) return false;
      return ctx.tomorrowSchedule[0].startTime === '08:00';
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
      if (weather) parts.push(`${weather.condition} ${weather.tempLow}-${weather.tempHigh}°C`);
      if (card.balance < 15) parts.push(`一卡通余额 ${card.balance.toFixed(1)} 元（偏低，建议充值）`);
      return { text: parts.join(' | '), suggestions: ['设闹钟', '充值'] };
    },
  });

  console.log('[Agent] 内置触发器已注册');
}

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
