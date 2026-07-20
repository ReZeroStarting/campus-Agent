// ============================================================
// 校园搭子 - HTTP API 服务 v2
// ============================================================

import 'dotenv/config';

import { createServer, IncomingMessage, ServerResponse } from 'http';
import { readFileSync, existsSync } from 'fs';
import { join, extname } from 'path';
import { processMessage, registerBuiltinTriggers, runScheduledCheck } from '../agent.js';
import { isLlmAvailable } from '../core/llm/client.js';
import { parseICS, parseExcel, setImportedSchedule, clearImportedSchedule, getImportedSchedule } from '../services/scheduleImport.js';
import { parseGradeExcel, setImportedGrades, clearImportedGrades, getImportedGrades, calculateGpa } from '../services/gradeImport.js';
import { saveGrades, getStorageStatus, clearAllData } from '../services/storage.js';
import { resetSession, getRecentConversations, resumeSession as engineResumeSession, getSession } from '../core/memory/engine.js';
import { restoreSession, listSessions, deleteSession } from '../core/memory/history.js';
import { fetchAllCourses } from '../services/scheduleData.js';
import { getMorningBriefCard, getScheduleCard, getExamCard, getBalanceCard, getPackageCard } from '../services/cardData.js';
import {
  getScheduleForDate, getMockSchedule, getCardState, getShowerState, getWeatherToday,
  getActivePackages, getActiveOrders, getPickupPoints, getForumPosts, getActiveEvents,
  getCampusBuildings, getExams, getExamCountdown, getCourseGrades, getGpa,
  getFreeClassrooms, getClassrooms, getExtractedInfos, searchBuildings, getHotPosts,
  findBuildingsByService,
} from '../data/mocks/index.js';
import { getUserHabits } from '../core/memory/engine.js';

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3456;
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:3456,http://localhost:3000,http://localhost:5173').split(',').map(s => s.trim());

registerBuiltinTriggers();

// ---- 请求体解析 ----

function parseBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk: Buffer) => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', reject);
  });
}

function readRawBody(req: IncomingMessage, maxBytes = 10 * 1024 * 1024): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let totalBytes = 0;
    req.on('data', (chunk: Buffer) => {
      totalBytes += chunk.length;
      if (totalBytes > maxBytes) { req.destroy(); reject(new Error('文件过大，上限 10MB')); return; }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
    req.on('error', reject);
  });
}

function readRawBuffer(req: IncomingMessage): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

// ---- 响应工具 ----

function sendJSON(res: ServerResponse, data: unknown, status = 200, origin?: string) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': origin || ALLOWED_ORIGINS[0],
  });
  res.end(JSON.stringify(data, null, 2));
}

// ---- 路由 ----

const server = createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://localhost:${PORT}`);

  // CORS — 动态 origin
  const origin = req.headers.origin || '';
  const allowOrigin = ALLOWED_ORIGINS.includes(origin) || ALLOWED_ORIGINS.includes('*') ? origin : ALLOWED_ORIGINS[0];

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': allowOrigin,
      'Access-Control-Allow-Methods': 'POST, GET, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    res.end();
    return;
  }

  try {
    // ---- 静态文件（聊天 UI）----
    if (req.method === 'GET' && !url.pathname.startsWith('/api/')) {
      const publicDir = join(import.meta.dirname || __dirname, '../../public');
      let filePath = join(publicDir, url.pathname === '/' ? 'index.html' : url.pathname);
      if (existsSync(filePath) && !filePath.includes('..')) {
        const ext = extname(filePath);
        const mime: Record<string, string> = {
          '.html': 'text/html; charset=utf-8',
          '.css': 'text/css; charset=utf-8',
          '.js': 'application/javascript; charset=utf-8',
          '.json': 'application/json; charset=utf-8',
          '.png': 'image/png',
          '.svg': 'image/svg+xml',
        };
        res.writeHead(200, { 'Content-Type': mime[ext] || 'text/plain', 'Cache-Control': 'public, max-age=3600' });
        res.end(readFileSync(filePath));
        return;
      }
    }

    // ---- 对话接口 ----
    if (url.pathname === '/api/chat' && req.method === 'POST') {
      const body = await parseBody(req);
      const text = body.text as string || body.message as string || '';
      if (!text.trim()) { sendJSON(res, { error: 'text 参数不能为空' }, 400); return; }
      const response = await processMessage(text.trim());
      sendJSON(res, response);
      return;
    }

    // ---- 健康检查 ----
    if (url.pathname === '/api/health') {
      sendJSON(res, { status: 'ok', time: new Date().toISOString(), hasImportedSchedule: getImportedSchedule() !== null });
      return;
    }

    // ---- 课表管理 ----
    if (url.pathname === '/api/schedule' && req.method === 'GET') {
      const courses = fetchAllCourses();
      sendJSON(res, { count: courses.length, imported: getImportedSchedule() !== null, courses });
      return;
    }

    // ICS 文本导入
    if (url.pathname === '/api/schedule/import/ics' && req.method === 'POST') {
      const contentType = req.headers['content-type'] || '';
      let icsText: string;
      if (contentType.includes('application/json')) {
        const body = await parseBody(req);
        icsText = (body.text || body.ics || body.content) as string;
      } else {
        icsText = await readRawBody(req);
      }
      if (!icsText || !icsText.includes('BEGIN:VCALENDAR')) {
        sendJSON(res, { error: '无效的 ICS 内容，需包含 BEGIN:VCALENDAR' }, 400);
        return;
      }
      const courses = parseICS(icsText);
      setImportedSchedule(courses);
      sendJSON(res, { success: true, count: courses.length, courses: courses.slice(0, 3), more: courses.length > 3 ? `...还有 ${courses.length - 3} 门` : undefined });
      return;
    }

    // Excel 导入（base64）
    if (url.pathname === '/api/schedule/import/excel' && req.method === 'POST') {
      const body = await parseBody(req);
      const base64 = (body.data || body.base64 || body.file) as string;
      if (!base64) { sendJSON(res, { error: '缺少 data/base64/file 字段' }, 400); return; }
      const buffer = Buffer.from(base64, 'base64');
      const courses = parseExcel(buffer);
      setImportedSchedule(courses);
      sendJSON(res, { success: true, count: courses.length, courses });
      return;
    }

    // 清除导入
    if (url.pathname === '/api/schedule/import' && req.method === 'DELETE') {
      clearImportedSchedule();
      sendJSON(res, { success: true, message: '已恢复模拟课表' });
      return;
    }

    // ---- 成绩单导入 ----
    if (url.pathname === '/api/grades/import' && req.method === 'POST') {
      const body = await parseBody(req);
      const base64 = (body.data || body.base64 || body.file) as string;
      if (!base64) { sendJSON(res, { error: '缺少 data/base64/file 字段' }, 400); return; }
      const buffer = Buffer.from(base64, 'base64');
      const grades = parseGradeExcel(buffer);
      setImportedGrades(grades);
      saveGrades(grades); // 持久化
      const gpa = calculateGpa(grades);
      sendJSON(res, {
        success: true,
        count: grades.length,
        gpa: gpa.gpa,
        weightedAvg: gpa.weightedAvg,
        totalCredits: gpa.totalCredits,
        grades: grades.slice(0, 5),
        more: grades.length > 5 ? `...还有 ${grades.length - 5} 门` : undefined,
      });
      return;
    }

    if (url.pathname === '/api/grades' && req.method === 'GET') {
      const grades = getImportedGrades();
      if (!grades) { sendJSON(res, { imported: false, message: '未导入成绩' }); return; }
      const gpa = calculateGpa(grades);
      sendJSON(res, { imported: true, count: grades.length, gpa: gpa.gpa, weightedAvg: gpa.weightedAvg, totalCredits: gpa.totalCredits, grades });
      return;
    }

    if (url.pathname === '/api/grades' && req.method === 'DELETE') {
      clearImportedGrades();
      saveGrades([]);
      sendJSON(res, { success: true, message: '已清除导入的成绩' });
      return;
    }

    // ---- 数据状态 ----
    if (url.pathname === '/api/data/status' && req.method === 'GET') {
      sendJSON(res, getStorageStatus());
      return;
    }

    if (url.pathname === '/api/data/clear' && req.method === 'DELETE') {
      clearAllData();
      clearImportedSchedule();
      clearImportedGrades();
      sendJSON(res, { success: true, message: '已清空所有导入数据（备份为 .bak）' });
      return;
    }

    // ---- 对话管理 ----
    // 获取历史会话列表
    if (url.pathname === '/api/conversations' && req.method === 'GET') {
      const sessions = listSessions(30);
      sendJSON(res, { sessions });
      return;
    }

    // 获取指定会话详情
    if (url.pathname.startsWith('/api/conversations/') && req.method === 'GET') {
      const sid = url.pathname.slice('/api/conversations/'.length);
      const session = restoreSession(sid);
      if (!session) { sendJSON(res, { error: '会话不存在' }, 404); return; }
      sendJSON(res, session);
      return;
    }

    // 创建新对话
    if (url.pathname === '/api/conversations/new' && req.method === 'POST') {
      resetSession();
      sendJSON(res, { success: true, sessionId: getSession().sessionId });
      return;
    }

    // 恢复指定会话
    if (url.pathname.startsWith('/api/conversations/') && url.pathname.endsWith('/resume') && req.method === 'POST') {
      const sid = url.pathname.slice('/api/conversations/'.length, -'/resume'.length);
      const restored = engineResumeSession(sid);
      if (!restored) { sendJSON(res, { error: '会话不存在' }, 404); return; }
      sendJSON(res, { success: true, sessionId: restored.sessionId, messageCount: restored.history.length });
      return;
    }

    // 删除指定会话
    if (url.pathname.startsWith('/api/conversations/') && !url.pathname.endsWith('/resume') && req.method === 'DELETE') {
      const sid = url.pathname.slice('/api/conversations/'.length);
      if (!sid) { sendJSON(res, { error: '缺少会话ID' }, 400); return; }
      const session = restoreSession(sid);
      if (!session) { sendJSON(res, { error: '会话不存在' }, 404); return; }
      deleteSession(sid);
      sendJSON(res, { success: true, deleted: session.title });
      return;
    }

    // ---- 触发定时任务 ----
    if (url.pathname === '/api/trigger' && req.method === 'POST') {
      const responses = await runScheduledCheck(new Date());
      sendJSON(res, { triggered: responses.length, responses });
      return;
    }

    // ---- 小艺 Deeper Intent 对接 ----
    if (url.pathname === '/api/xiaoyi' && req.method === 'POST') {
      const body = await parseBody(req);
      const query = (body.query || body.text || body.message) as string || '';
      const intent = (body.intent || '') as string;

      if (!query.trim()) {
        sendJSON(res, {
          fulfillmentText: '请问有什么可以帮你的？',
          suggestions: ['早安', '查课表', '找空教室'],
        });
        return;
      }

      const response = await processMessage(query.trim());

      // 转换为小艺协议格式
      sendJSON(res, {
        fulfillmentText: response.text,
        suggestions: response.suggestions || [],
        card: {
          type: 'info',
          title: intent ? `校园搭子 · ${intent}` : '校园搭子',
          content: response.text.substring(0, 100),
        },
      });
      return;
    }

    // ═══ 结构化数据 API（前端各 Tab 独立渲染） ═══

    // ── 综合区数据 ──
    if (req.method === 'GET' && url.pathname.startsWith('/api/data/zone/')) {
      const type = url.pathname.split('/').pop()!;
      if (type === 'schedule') {
        const courses = getScheduleForDate(new Date());
        const weather = getWeatherToday();
        const weatherEmoji = weather.condition.includes('雨') ? '🌧️' : weather.condition.includes('晴') ? '☀️' : '⛅';
        sendJSON(res, { courses, weather, weatherEmoji, count: courses.length,
          isWeekend: new Date().getDay() === 0 || new Date().getDay() === 6 });
        return;
      }
      if (type === 'exam') {
        const exams = getExamCountdown().slice(0, 8);
        const thisWeek = exams.filter(e => e.daysLeft <= 7).length;
        sendJSON(res, { exams, thisWeek, total: getExams().length });
        return;
      }
      if (type === 'grade') {
        const gpa = getGpa();
        sendJSON(res, gpa);
        return;
      }
      if (type === 'classroom') {
        const free = getFreeClassrooms().slice(0, 10);
        const byBuilding: Record<string, typeof free> = {};
        for (const f of free) {
          const bld = f.room.building || '其他';
          (byBuilding[bld] ??= []).push(f);
        }
        sendJSON(res, { free, byBuilding, total: free.length, allClassrooms: getClassrooms() });
        return;
      }
      if (type === 'card') {
        const card = getCardState();
        const today = new Date();
        const todayTx = card.transactions.filter(t => {
          return new Date(t.time).toDateString() === today.toDateString();
        });
        const weekAgo = new Date(today.getTime() - 7 * 86400000);
        const weekTx = card.transactions.filter(t => new Date(t.time) >= weekAgo);
        const todaySpent = todayTx.reduce((s, t) => s + Math.abs(t.amount), 0);
        const weekSpent = weekTx.reduce((s, t) => s + Math.abs(t.amount), 0);
        const byCategory: Record<string, number> = {};
        for (const t of weekTx) {
          byCategory[t.category] = (byCategory[t.category] || 0) + Math.abs(t.amount);
        }
        const statusColor = card.balance >= 50 ? '#2ecc71' : card.balance >= 20 ? '#f39c12' : card.balance >= 10 ? '#e74c3c' : '#c0392b';
        const statusText = card.balance >= 50 ? '充裕' : card.balance >= 20 ? '正常' : card.balance >= 10 ? '偏低' : '不足';
        const statusEmoji = card.balance >= 50 ? '🟢' : card.balance >= 20 ? '🟡' : card.balance >= 10 ? '🟠' : '🔴';
        sendJSON(res, { balance: card.balance, todaySpent, weekSpent, todayTx, weekTx, byCategory, statusColor, statusText, statusEmoji });
        return;
      }
      if (type === 'map') {
        const buildings = getCampusBuildings();
        const byType: Record<string, typeof buildings> = {};
        for (const b of buildings) {
          (byType[b.type] ??= []).push(b);
        }
        sendJSON(res, { buildings, byType, count: buildings.length });
        return;
      }
      sendJSON(res, { error: 'Unknown zone type', types: ['schedule','exam','grade','classroom','card','map'] }, 404);
      return;
    }

    // ── 社区数据 ──
    if (req.method === 'GET' && url.pathname.startsWith('/api/data/community/')) {
      const type = url.pathname.split('/').pop()!;
      if (type === 'forum') {
        const hot = getHotPosts(8);
        const sections: Record<string, typeof hot> = {};
        for (const p of hot) {
          const sec = p.section;
          (sections[sec] ??= []).push(p);
        }
        sendJSON(res, { hot, sections });
        return;
      }
      if (type === 'events') {
        const events = getActiveEvents();
        sendJSON(res, { events, count: events.length });
        return;
      }
      if (type === 'secondhand') {
        const posts = getForumPosts('secondhand');
        sendJSON(res, { posts, count: posts.length });
        return;
      }
      if (type === 'lostfound') {
        const posts = getForumPosts('lostfound');
        sendJSON(res, { posts, count: posts.length });
        return;
      }
      sendJSON(res, { error: 'Unknown community type', types: ['forum','events','secondhand','lostfound'] }, 404);
      return;
    }

    // ── 个人主页数据 ──
    if (req.method === 'GET' && url.pathname === '/api/data/profile') {
      const card = getCardState();
      const gpa = getGpa();
      const exams = getExamCountdown().slice(0, 3);
      const packages = getActivePackages().filter(p => p.status === '已到站');
      const orders = getActiveOrders();
      const habits = getUserHabits();
      const today = new Date();
      const todayTx = card.transactions.filter(t => new Date(t.time).toDateString() === today.toDateString());
      const todaySpent = todayTx.reduce((s, t) => s + Math.abs(t.amount), 0);
      const statusEmoji = card.balance >= 50 ? '🟢' : card.balance >= 20 ? '🟡' : card.balance >= 10 ? '🟠' : '🔴';
      const statusText = card.balance >= 50 ? '余额充裕' : card.balance >= 20 ? '余额正常' : card.balance >= 10 ? '余额偏低' : '需要充值';
      sendJSON(res, {
        card: { balance: card.balance, todaySpent, statusEmoji, statusText },
        gpa: { gpa: gpa.gpa, totalCredits: gpa.totalCredits, trend: gpa.trend },
        exams: exams.map(e => ({ name: e.exam.courseName, daysLeft: e.daysLeft, date: e.exam.date || '', location: e.exam.location || '' })),
        delivery: { packages: packages.map(p => ({ carrier: p.carrier, desc: p.description || '', code: p.pickupCode || '', status: p.status })),
          orders: orders.map(o => ({ platform: o.platform, restaurant: o.restaurant, status: o.status })) },
        habits,
      });
      return;
    }

    // ---- 服务卡片数据 ----
    if (req.method === 'GET') {
      const cardMap: Record<string, () => Record<string, unknown>> = {
        'morning-brief': getMorningBriefCard,
        'schedule': getScheduleCard,
        'exam': getExamCard,
        'balance': getBalanceCard,
        'packages': getPackageCard,
      };
      const match = url.pathname.match(/^\/api\/card\/(.+)$/);
      if (match && cardMap[match[1]]) {
        sendJSON(res, cardMap[match[1]]());
        return;
      }
      if (url.pathname === '/api/cards') {
        sendJSON(res, Object.keys(cardMap));
        return;
      }
    }

    // 404
    sendJSON(res, { error: 'Not found', endpoints: [
      'POST /api/chat',
      'POST /api/xiaoyi',
      'GET  /api/health',
      'GET  /api/schedule',
      'GET  /api/data/zone/:type',
      'GET  /api/data/community/:type',
      'GET  /api/data/profile',
      'GET  /api/card/:type',
      'POST /api/schedule/import/ics',
      'POST /api/schedule/import/excel',
      'DELETE /api/schedule/import',
      'POST /api/grades/import',
      'GET  /api/grades',
      'DELETE /api/grades',
      'GET  /api/data/status',
      'DELETE /api/data/clear',
      'GET  /api/conversations',
      'POST /api/conversations/new',
      'POST /api/conversations/:id/resume',
      'POST /api/trigger',
    ]}, 404);

  } catch (err: any) {
    sendJSON(res, { error: err.message || 'Internal error' }, 500);
  }
});

server.listen(PORT, () => {
  const llmStatus = isLlmAvailable() ? '✅ DeepSeek LLM 已启用' : '⚠️  LLM 未配置，使用模板回复';
  console.log(`\n  🎒 校园搭子 API 已启动 → http://localhost:${PORT}`);
  console.log(`  ${llmStatus}`);
  console.log(`  POST /api/chat            → 对话`);
  console.log(`  POST /api/xiaoyi          → 小艺 Deeper Intent`);
  console.log(`  POST /api/schedule/import/ics   → 导入 ICS 课表`);
  console.log(`  POST /api/schedule/import/excel → 导入 Excel 课表`);
  console.log(`  GET  /api/schedule        → 查看课表`);
  console.log(`  POST /api/grades/import   → 导入成绩单`);
  console.log(`  GET  /api/grades          → 查看成绩`);
  console.log(`  GET  /api/data/status     → 数据状态`);
  console.log(`  GET  /api/conversations   → 历史对话列表
`);
});
