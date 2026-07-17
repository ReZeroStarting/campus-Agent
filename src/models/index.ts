// ============================================================
// 校园搭子 - 数据模型 & 类型定义
// ============================================================

// ---- 用户表述 → 意图分类映射 ----
export type IntentCategory = 'shower' | 'schedule' | 'card' | 'weather' | 'water' | 'unknown';

export interface IntentResult {
  category: IntentCategory;
  confidence: number;       // 0-1
  originalText: string;
  extractedEntities: Record<string, string>;  // 提取的实体，如 { time: "明天", location: "二食堂" }
}

// ---- 课表 ----
export interface Course {
  courseId: string;
  name: string;
  teacher: string;
  location: string;
  weekday: number;          // 1-7 (周一-周日)
  startTime: string;        // "08:00"
  endTime: string;          // "09:40"
  weeks: number[];          // [1,2,3,...,16]
}

// ---- 一卡通 ----
export interface CardTransaction {
  time: string;             // ISO 时间
  amount: number;
  location: string;
  category: '早餐' | '午餐' | '晚餐' | '洗澡' | '超市' | '其他';
}

export interface CardState {
  balance: number;
  todaySpent: number;
  weekSpent: number;
  transactions: CardTransaction[];
}

// ---- 澡堂 ----
export interface ShowerState {
  balance: number;
  pricePerShower: number;   // 单次洗澡均价
  crowdLevel: '空闲' | '适中' | '拥挤';
  lastShowerTime?: string;
}

// ---- 天气 ----
export interface WeatherInfo {
  date: string;
  condition: string;        // "晴"、"多云"、"雨"...
  tempHigh: number;
  tempLow: number;
  humidity: number;
  windLevel: number;        // 风力等级
  tips: string;             // "适合户外活动" 等
}

// ---- 用户习惯（中期记忆） ----
export interface UserHabits {
  showerTime: string;           // "17:30"
  showerThreshold: number;      // 余额低于此值提醒充值，默认 3
  breakfastWindow: string;      // "07:00-08:30"
  frequentCanteen: string;      // "二食堂"
  waterGoal: number;            // 1500 (ml)
  sleepReminderTime: string;    // "21:30"
  wakeTime: string;             // "07:20"
  commuteToSchool: number;      // 步行到教学楼分钟数，默认 8
}

// ---- 三层记忆模型 ----
export interface ShortTermMemory {
  sessionId: string;
  context: {
    lastIntent?: IntentCategory;
    lastTopic?: string;         // 最近讨论的话题
    pendingConfirmations: string[];
  };
  history: Array<{
    role: 'user' | 'agent';
    text: string;
    time: string;
  }>;
}

export type MidTermMemory = UserHabits;

export interface LongTermKnowledge {
  campusRules: {
    locations: Record<string, { name: string; commuteMinutes: number }>;
    canteenHours: Record<string, { open: string; close: string; restDay?: number }>;
    showerPrice: number;
  };
}

// ---- 任务编排 ----
export type ActionStatus = 'pending' | 'running' | 'done' | 'failed' | 'skipped';
export type TaskStatus = 'pending' | 'running' | 'done' | 'failed' | 'degraded';
export type DependencyMode = 'parallel' | 'serial';

export interface SubAction {
  name: string;
  status: ActionStatus;
  fallback: string | null;      // 失败降级策略
  durationMs: number;
}

export interface OrchestrationTask {
  taskId: string;
  intent: IntentCategory;
  trigger: string;              // "user_says_shower" | "schedule_2130" | "low_balance"
  status: TaskStatus;
  createdAt: string;
  subActions: SubAction[];
  result: {
    summary: string;
    pushedTo: string[];         // ["console"] | ["phone", "watch"]
  };
}

// ---- Agent 最终回复 ----
export interface AgentResponse {
  text: string;                 // 主回复文本
  suggestions?: string[];       // 可选的建议/追问
  actions?: string[];           // 可选的动作提示
  data?: Record<string, unknown>;  // 结构化数据（给前端卡片用）
}

// ---- 主动触发器 ----
export interface TriggerRule {
  id: string;
  name: string;
  condition: (context: TriggerContext) => boolean;
  action: (context: TriggerContext) => Promise<AgentResponse>;
  schedule?: string;            // cron 表达式，如 "30 21 * * *"（每晚 21:30）
  cooldownMinutes: number;      // 冷却时间，避免重复触发
}

export interface TriggerContext {
  currentTime: Date;
  tomorrowSchedule: Course[];
  cardState: CardState;
  showerState: ShowerState;
  habits: UserHabits;
  weather?: WeatherInfo;
}
