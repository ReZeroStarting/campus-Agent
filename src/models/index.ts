// ============================================================
// 校园搭子 - 数据模型 & 类型定义
// ============================================================

// ---- 用户表述 → 意图分类映射 ----
export type IntentCategory = 'shower' | 'schedule' | 'card' | 'weather' | 'water' | 'delivery' | 'forum' | 'unknown';

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

// ---- 快递包裹 ----
export interface Package {
  trackingId: string;
  carrier: string;              // 中通、顺丰、圆通...
  status: '运输中' | '已到站' | '已取件';
  description?: string;
  arrivedAt?: string;           // 到站时间 ISO
  pickupCode?: string;          // 取件码
  pickupPoint: string;          // 取件点名称
  estimatedArrival?: string;    // 预计到达 ISO
}

// ---- 外卖订单 ----
export interface DeliveryOrder {
  orderId: string;
  platform: string;             // 美团、饿了么
  restaurant: string;
  status: '已下单' | '商家备餐' | '配送中' | '已送达' | '已取餐';
  estimatedDelivery: string;    // 预计送达 ISO
  actualDelivery?: string;
  pickupPoint: string;          // 取餐点
  riderName?: string;
  riderPhone?: string;
}

// ---- 取件点 ----
export interface PickupPoint {
  id: string;
  name: string;
  type: '快递' | '外卖' | '综合';
  location: string;             // 位置描述
  openTime: string;             // "08:00"
  closeTime: string;            // "20:00"
  commuteFrom: Record<string, number>; // 从各位置走过去多少分钟
}

// ---- 路线规划 ----
export interface RouteStep {
  step: number;
  from: string;
  to: string;
  purpose: string;
  walkMinutes: number;
  action?: string;              // 取件、取餐、吃饭...
}

export interface RoutePlan {
  totalMinutes: number;
  startTime: string;
  endTime: string;
  steps: RouteStep[];
  tips: string[];
}

// ============================================================
// 校园论坛
// ============================================================

/** 论坛板块 */
export type ForumSection =
  | 'secondhand'    // 二手交易
  | 'lostfound'     // 失物招领
  | 'coursereview'  // 课程评价
  | 'events'        // 活动通知
  | 'treehole'      // 树洞/吐槽
  | 'studyhelp';    // 学习互助

export const FORUM_SECTION_NAMES: Record<ForumSection, string> = {
  secondhand: '二手交易',
  lostfound: '失物招领',
  coursereview: '课程评价',
  events: '活动通知',
  treehole: '树洞',
  studyhelp: '学习互助',
};

/** 论坛帖子 */
export interface ForumPost {
  id: string;
  section: ForumSection;
  title: string;
  content: string;
  author: string;           // 匿名则显示「匿名用户」
  createdAt: string;        // ISO
  tags: string[];
  images?: string[];        // 图片URL
  replyCount: number;
  viewCount: number;
  hot: boolean;             // 是否热帖
}

/** 从帖子自动提取的结构化信息点 */
export interface ExtractedInfo {
  id: string;
  sourcePostId: string;
  type: 'event' | 'lost_item' | 'found_item' | 'secondhand_deal' | 'course_rating' | 'hot_topic';
  title: string;
  summary: string;
  detail: Record<string, string>;  // 结构化字段，如 { date, location, price, contact }
  extractedAt: string;
  validUntil?: string;             // 过期时间（活动结束后自动清理）
}

/** 论坛查询结果 */
export interface ForumQueryResult {
  query: string;
  posts: ForumPost[];
  extractedInfos: ExtractedInfo[];
  summary: string;
}
