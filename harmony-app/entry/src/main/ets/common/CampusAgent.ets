// 校园搭子 - Agent 桥接层（本地降级 + 远程 API）
import { HttpClient } from './HttpClient';
import { MemoryStore } from './MemoryStore';
import type { AgentResponse, Message, CardData, MockData } from '../model/Types';

export class CampusAgent {
  private static instance: CampusAgent;

  static getInstance(): CampusAgent {
    if (!CampusAgent.instance) CampusAgent.instance = new CampusAgent();
    return CampusAgent.instance;
  }

  // ── 快速意图匹配（本地关键词，零延迟） ──
  private quickIntent(query: string): string | null {
    const q = query.toLowerCase();
    const patterns: Array<[string[], string]> = [
      [['洗澡', '冲凉', '澡堂', '洗浴'],                    'shower'],
      [['课表', '什么课', '上课', '课程'],                   'schedule'],
      [['一卡通', '余额', '消费', '卡里', '花了多少'],        'card'],
      [['天气', '下雨', '穿什么', '冷不冷', '带伞'],          'weather'],
      [['喝水', '饮水', '喝多少', '记录喝水'],               'water'],
      [['快递', '外卖', '取件', '取件码', '到了吗', '包裹'],  'delivery'],
      [['论坛', '帖子', '失物招领', '二手', '讲座', '活动'],   'forum'],
      [['在哪', '怎么走', '地图', '导航', '建筑'],            'map'],
      [['考试', '倒计时', '期末', '考什么'],                  'exam'],
      [['空教室', '自习室', '学习', '插座'],                  'classroom'],
      [['绩点', 'GPA', '成绩', '挂科', '加权'],              'grade'],
      [['早安', '早上好', '早报', '简报', '今天怎么样'],       'morning_brief'],
    ];
    for (const item of patterns) {
      const keywords = item[0];
      const intent = item[1];
      if (keywords.some(k => q.includes(k))) return intent;
    }
    return null;
  }

  // ── 本地 Mock 数据（离线降级） ──
  private localMock(intent: string): AgentResponse {
    const showerCard: CardData = { type: 'shower', title: '洗澡助手', content: '余额 36.0 元 · 约12次' };
    const scheduleCard: CardData = { type: 'schedule', title: '今日课表', content: '2节课 · 没有晚课' };
    const balanceCard: CardData = { type: 'balance', title: '一卡通', content: '余额 128.50 元' };
    const weatherCard: CardData = { type: 'weather', title: '今日天气', content: '25°C ~ 32°C 晴转多云' };
    const waterCard: CardData = { type: 'water', title: '饮水追踪', content: '1200ml / 2000ml' };
    const deliveryCard: CardData = { type: 'delivery', title: '快递', content: '2个待取件' };
    const forumCard: CardData = { type: 'forum', title: '校园论坛', content: '3个热帖' };
    const mapCard: CardData = { type: 'map', title: '校园地图', content: '8个主要建筑' };
    const examCard: CardData = { type: 'exam', title: '考试倒计时', content: '最近3天 · 高数' };
    const classroomCard: CardData = { type: 'classroom', title: '空闲教室', content: '3间可选' };
    const gradeCard: CardData = { type: 'grade', title: '绩点', content: 'GPA 3.42 · 无挂科' };
    const morningCard: CardData = { type: 'morning_brief', title: '智能早报', content: '周日 · 晴 · 2个快递' };

    const mocks: MockData = {
      shower:   { text: '🚿 洗澡余额 36.0 元\n约可洗 12 次\n📍 西区澡堂 · 现在人不多', suggestions: ['我要洗澡', '洗完了', '澡堂在哪'] as string[], card: showerCard } as AgentResponse,
      schedule: { text: '📅 今天课表\n09:50-11:25 高等数学 教三101\n14:00-15:35 数据结构 教二201\n没有晚课 😊', suggestions: ['明天什么课', '找空教室', '考试倒计时'] as string[], card: scheduleCard } as AgentResponse,
      card:     { text: '💳 一卡通余额 128.50 元\n本周消费 67 元\n吃饭 45 · 洗澡 12 · 购物 10', suggestions: ['消费明细', '我要洗澡', '余额少了提醒我'] as string[], card: balanceCard } as AgentResponse,
      weather:  { text: '🌤️ 今天 25°C ~ 32°C 晴转多云\n建议：短袖 + 防晒\n不用带伞', suggestions: ['明天天气', '穿什么'] as string[], card: weatherCard } as AgentResponse,
      water:    { text: '💧 今日饮水 1200ml / 2000ml\n进度 ████████░░ 60%\n还差 800ml，记得多喝水', suggestions: ['记录喝水 200ml', '今天喝了多少水'] as string[], card: waterCard } as AgentResponse,
      delivery: { text: '📦 2个快递待取\n中通 取件码 3-2-1088 · 西区驿站\n圆通 取件码 5-1-2066 · 东区快递柜', suggestions: ['取件码是多少', '帮我规划路线'] as string[], card: deliveryCard } as AgentResponse,
      forum:    { text: '💬 今日热帖\n🔥 有人捡到校园卡在图书馆\n🔥 机器学习课期末考试重点\n🔥 出二手显示器 24寸 4K', suggestions: ['论坛首页', '失物招领', '有没有讲座'] as string[], card: forumCard } as AgentResponse,
      map:      { text: '🗺️ 校园建筑\n🏫 教一楼 教二楼 教三楼\n📚 图书馆 东区\n🏢 行政楼 主楼\n🍔 西区食堂 东区食堂', suggestions: ['教三在哪', '图书馆怎么走', '去哪打印'] as string[], card: mapCard } as AgentResponse,
      exam:     { text: '📝 考试倒计时\n📅 高数 7月22日 还剩3天\n📅 数据结构 7月25日 还剩6天\n📅 英语 7月28日 还剩9天', suggestions: ['找空教室复习', '绩点', '考试重点'] as string[], card: examCard } as AgentResponse,
      classroom:{ text: '🏫 空闲教室\n教二201（有插座）\n教三305（大教室·有空调）\n图书馆3楼自习区', suggestions: ['找个有插座的', '教三有空教室吗'] as string[], card: classroomCard } as AgentResponse,
      grade:    { text: '📊 GPA 3.42\n总学分 82 | 加权均分 84.2\n📈 趋势 上升 ↑\n✅ 无挂科记录', suggestions: ['绩点趋势', '够不够3.5', '高数成绩'] as string[], card: gradeCard } as AgentResponse,
      morning_brief: { text: '🌅 早安！今天是 7月19日 周日\n🌤️ 25°C~32°C 晴\n📅 今天没有课\n📝 最近考试：高数 还剩3天\n📦 2个快递待取', suggestions: ['天气', '考试倒计时', '查快递'] as string[], card: morningCard } as AgentResponse,
    };
    // 使用 switch-case 替代索引访问
    switch (intent) {
      case 'shower': return mocks.shower;
      case 'schedule': return mocks.schedule;
      case 'card': return mocks.card;
      case 'weather': return mocks.weather;
      case 'water': return mocks.water;
      case 'delivery': return mocks.delivery;
      case 'forum': return mocks.forum;
      case 'map': return mocks.map;
      case 'exam': return mocks.exam;
      case 'classroom': return mocks.classroom;
      case 'grade': return mocks.grade;
      case 'morning_brief': return mocks.morning_brief;
      default: return mocks.morning_brief;
    }
  }

  // ── 发送消息（本地意图 → 远程 LLM → 本地降级） ──
  async sendMessage(query: string): Promise<AgentResponse> {
    const intent = this.quickIntent(query);

    // 已知场景 → 尝试远程增强，超时/失败即降级
    if (intent) {
      try {
        const remote = await Promise.race([
          HttpClient.getInstance().chat(query, ''),
          new Promise<AgentResponse | null>((_, rej) => setTimeout(() => rej(new Error('timeout')), 2000))
        ]);
        if (remote) return remote;
      } catch (_) { /* 降级到本地 mock */ }
      return this.localMock(intent);
    }

    // 未知意图 → 远程 LLM 兜底
    try {
      const remote = await Promise.race([
        HttpClient.getInstance().chat(query, ''),
        new Promise<AgentResponse | null>((_, rej) => setTimeout(() => rej(new Error('timeout')), 3000))
      ]);
      if (remote) return remote;
    } catch (_) { /* 远程失败降级 */ }

    // 完全离线降级
    const fallback: AgentResponse = {
      text: '抱歉，我暂时无法回答这个问题 😅\n\n你可以试试：\n• 早安 — 查看今日简报\n• 课表 — 看看今天有什么课\n• 洗澡 — 查看澡堂状态\n• 找空教室 — 找个自习的地方',
      suggestions: ['早安', '课表', '找空教室', '洗澡'],
    };
    return fallback;
  }

  // ── 主动提醒检查 ──
  async checkReminders(): Promise<string[]> {
    const reminders: string[] = [];
    try {
      const gpa = await HttpClient.getInstance().getGPA();
      if (gpa && gpa.hasFailing) reminders.push('⚠️ 检测到挂科记录，建议关注补考安排');

      const card = await HttpClient.getInstance().getCard();
      if (card && card.balance < 20) reminders.push('💳 一卡通余额不足 20 元，建议充值');

      const exams = await HttpClient.getInstance().getExams();
      if (exams?.exams?.some(e => e.daysLeft <= 1)) reminders.push('📝 明天有考试，记得复习！');

      const delivery = await HttpClient.getInstance().getDelivery();
      if (delivery?.packages?.some(p => p.arrived && !p.pickupCode)) {
        reminders.push('📦 有快递已到站，记得取件');
      }
    } catch (_) { /* 远程不可用时静默 */ }
    return reminders;
  }
}
