// 校园搭子 - 本地记忆存储（鸿蒙 preferences）
import { preferences } from '@kit.ArkData';

const STORE_NAME = 'campus_buddy_memory';

export class MemoryStore {
  private static instance: MemoryStore;
  private store: preferences.Preferences | null = null;

  static getInstance(): MemoryStore {
    if (!MemoryStore.instance) MemoryStore.instance = new MemoryStore();
    return MemoryStore.instance;
  }

  async init(context: Context): Promise<void> {
    this.store = await preferences.getPreferences(context, STORE_NAME);
  }

  // ── 短期记忆：最近对话（轮数） ──
  async getRecentTopics(): Promise<string[]> {
    const raw = await this.store?.get('recent_topics', '[]') as string;
    return JSON.parse(raw) as string[];
  }

  async addTopic(topic: string): Promise<void> {
    const topics = await this.getRecentTopics();
    topics.unshift(topic);
    await this.store?.put('recent_topics', JSON.stringify(topics.slice(0, 20)));
    await this.store?.flush();
  }

  // ── 中期记忆：用户习惯 ──
  async getHabits(): Promise<Record<string, string>> {
    const raw = await this.store?.get('user_habits', '{}') as string;
    return JSON.parse(raw) as Record<string, string>;
  }

  async setHabit(key: string, value: string): Promise<void> {
    const habits = await this.getHabits();
    habits[key] = value;
    await this.store?.put('user_habits', JSON.stringify(habits));
    await this.store?.flush();
  }

  // ── 准考证/课表设置 ──
  async setSchool(schoolName: string): Promise<void> {
    await this.store?.put('school_name', schoolName);
    await this.store?.flush();
  }

  async getSchool(): Promise<string> {
    return (await this.store?.get('school_name', '') as string) || '';
  }

  // ── 数据导入标记 ──
  async setDataImported(type: 'schedule' | 'grade'): Promise<void> {
    await this.store?.put(`imported_${type}`, true);
    await this.store?.flush();
  }

  async isDataImported(type: 'schedule' | 'grade'): Promise<boolean> {
    return (await this.store?.get(`imported_${type}`, false) as boolean) || false;
  }

  // ── 会话 ID ──
  async getSessionId(): Promise<string> {
    return (await this.store?.get('session_id', '') as string) || '';
  }

  async setSessionId(id: string): Promise<void> {
    await this.store?.put('session_id', id);
    await this.store?.flush();
  }
}
