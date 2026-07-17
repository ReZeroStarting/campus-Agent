// ============================================================
// 三层记忆模型
// 短期（会话上下文）→ 中期（行为模式）→ 长期（校园常识）
// ============================================================

import type {
  ShortTermMemory,
  MidTermMemory,
  LongTermKnowledge,
  UserHabits,
  IntentCategory,
} from '../../models/index.js';

// ---- 长期知识（校园规则，相对固定） ----

const longTermKnowledge: LongTermKnowledge = {
  campusRules: {
    locations: {
      '教三': { name: '第三教学楼', commuteMinutes: 8 },
      '教二': { name: '第二教学楼', commuteMinutes: 10 },
      '教五': { name: '第五教学楼', commuteMinutes: 12 },
      '图书馆': { name: '图书馆', commuteMinutes: 6 },
      '体育馆': { name: '体育馆', commuteMinutes: 15 },
    },
    canteenHours: {
      '一食堂': { open: '06:30', close: '21:00', restDay: undefined },
      '二食堂': { open: '06:30', close: '22:00', restDay: 7 }, // 周日休息
      '三食堂': { open: '07:00', close: '20:30', restDay: undefined },
    },
    showerPrice: 2.5, // 单次洗澡均价
  },
};

// ---- 中期记忆（用户习惯，本地存储，跨会话） ----

const defaultHabits: UserHabits = {
  showerTime: '17:30',
  showerThreshold: 3,
  breakfastWindow: '07:00-08:30',
  frequentCanteen: '二食堂',
  waterGoal: 1500,
  sleepReminderTime: '21:30',
  wakeTime: '07:20',
  commuteToSchool: 8,
};

let userHabits: UserHabits = { ...defaultHabits };

// ---- 短期记忆（会话上下文，单次对话） ----

function createSession(): ShortTermMemory {
  return {
    sessionId: `sess_${Date.now()}`,
    context: {
      lastIntent: undefined,
      lastTopic: undefined,
      pendingConfirmations: [],
    },
    history: [],
  };
}

let currentSession: ShortTermMemory = createSession();

// ---- 公开 API ----

/** 获取长期知识 */
export function getLongTermKnowledge(): LongTermKnowledge {
  return longTermKnowledge;
}

/** 更新长期知识（用户自定义） */
export function updateLongTermLocation(
  key: string,
  updates: Partial<{ name: string; commuteMinutes: number }>,
): void {
  if (longTermKnowledge.campusRules.locations[key]) {
    Object.assign(longTermKnowledge.campusRules.locations[key], updates);
  }
}

/** 获取用户习惯 */
export function getUserHabits(): UserHabits {
  return { ...userHabits };
}

/** 更新用户习惯 */
export function updateUserHabits(partial: Partial<UserHabits>): UserHabits {
  Object.assign(userHabits, partial);
  return getUserHabits();
}

/** 检测用户模式并自动学习（短期 → 中期迁移） */
export function learnPattern(intent: IntentCategory, time: string): boolean {
  const hour = time.split(':')[0];
  let updated = false;

  switch (intent) {
    case 'shower':
      // 连续出现洗澡意图 → 记住洗澡时间
      if (userHabits.showerTime !== time && hour >= '16' && hour <= '20') {
        userHabits.showerTime = time;
        updated = true;
      }
      break;
    default:
      break;
  }

  return updated;
}

/** 获取当前会话 */
export function getSession(): ShortTermMemory {
  return currentSession;
}

/** 记录对话到短期记忆 */
export function recordMessage(role: 'user' | 'agent', text: string): void {
  currentSession.history.push({
    role,
    text,
    time: new Date().toISOString(),
  });

  // 只保留最近 20 条
  if (currentSession.history.length > 20) {
    currentSession.history = currentSession.history.slice(-20);
  }
}

/** 更新会话上下文 */
export function updateSessionContext(updates: Partial<ShortTermMemory['context']>): void {
  Object.assign(currentSession.context, updates);
}

/** 重置会话（新对话开始） */
export function resetSession(): void {
  currentSession = createSession();
}

/** 重置所有记忆（仅测试用） */
export function resetAllMemory(): void {
  userHabits = { ...defaultHabits };
  currentSession = createSession();
}
