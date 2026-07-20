// ============================================================
// 多会话历史管理
// 短期记忆只保留 20 条 + 当前会话
// 历史会话全部持久化到 JSON，可恢复浏览
// ============================================================

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import type { ShortTermMemory } from '../../models/index.js';

const MAX_HISTORY_SESSIONS = 30; // 最多保留 30 条历史会话

function getHistoryDir(): string {
  const dir = join(process.cwd(), 'data', 'history');
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  return dir;
}

function getHistoryFile(): string {
  return join(getHistoryDir(), 'sessions.json');
}

export interface SavedSession {
  sessionId: string;
  title: string;            // 第一条用户消息作为标题
  startTime: string;
  endTime: string;
  messageCount: number;
  history: ShortTermMemory['history'];
  context: ShortTermMemory['context'];
}

/** 读取所有历史会话 */
export function loadAllSessions(): SavedSession[] {
  try {
    const path = getHistoryFile();
    if (!existsSync(path)) return [];
    return JSON.parse(readFileSync(path, 'utf-8')) as SavedSession[];
  } catch {
    return [];
  }
}

function writeAllSessions(sessions: SavedSession[]): void {
  writeFileSync(getHistoryFile(), JSON.stringify(sessions, null, 2), 'utf-8');
}

/** 归档当前会话到历史 */
export function archiveSession(session: ShortTermMemory): void {
  if (session.history.length === 0) return;

  const all = loadAllSessions();
  const firstUserMsg = session.history.find(m => m.role === 'user');
  const title = firstUserMsg
    ? firstUserMsg.text.slice(0, 30) + (firstUserMsg.text.length > 30 ? '...' : '')
    : '空会话';

  const saved: SavedSession = {
    sessionId: session.sessionId,
    title,
    startTime: session.history[0].time,
    endTime: session.history[session.history.length - 1].time,
    messageCount: session.history.length,
    history: session.history,
    context: session.context,
  };

  // 去重（同一 sessionId 不重复保存）
  const filtered = all.filter(s => s.sessionId !== saved.sessionId);
  filtered.unshift(saved);

  // 保留最近 MAX_HISTORY_SESSIONS 条
  const trimmed = filtered.slice(0, MAX_HISTORY_SESSIONS);
  writeAllSessions(trimmed);
  console.log(`[History] 已归档会话: ${saved.title} (${saved.messageCount} 条)`);
}

/** 删除指定会话 */
export function deleteSession(sessionId: string): void {
  const all = loadAllSessions();
  const filtered = all.filter(s => s.sessionId !== sessionId);
  writeAllSessions(filtered);
}

/** 清空所有历史 */
export function clearAllHistory(): void {
  writeAllSessions([]);
}

/** 获取历史会话列表（轻量版，不含完整 history） */
export interface SessionSummary {
  sessionId: string;
  title: string;
  startTime: string;
  endTime: string;
  messageCount: number;
}

export function listSessions(limit = 10): SessionSummary[] {
  const all = loadAllSessions();
  return all.slice(0, limit).map(s => ({
    sessionId: s.sessionId,
    title: s.title,
    startTime: s.startTime,
    endTime: s.endTime,
    messageCount: s.messageCount,
  }));
}

/** 加载某个历史会话（用于"回到上次"） */
export function restoreSession(sessionId: string): SavedSession | null {
  const all = loadAllSessions();
  return all.find(s => s.sessionId === sessionId) ?? null;
}
