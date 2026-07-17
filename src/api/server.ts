// ============================================================
// 校园搭子 - HTTP API 服务 v2
// ============================================================

import 'dotenv/config';

import { createServer, IncomingMessage, ServerResponse } from 'http';
import { processMessage, registerBuiltinTriggers, runScheduledCheck } from '../agent.js';
import { parseICS, parseExcel, setImportedSchedule, clearImportedSchedule, getImportedSchedule } from '../services/scheduleImport.js';
import { fetchAllCourses } from '../services/scheduleData.js';

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3456;

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

function sendJSON(res: ServerResponse, data: unknown, status = 200) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
  });
  res.end(JSON.stringify(data, null, 2));
}

// ---- 路由 ----

const server = createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://localhost:${PORT}`);

  // CORS
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    res.end();
    return;
  }

  try {
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

    // ---- 触发定时任务 ----
    if (url.pathname === '/api/trigger' && req.method === 'POST') {
      const responses = await runScheduledCheck(new Date());
      sendJSON(res, { triggered: responses.length, responses });
      return;
    }

    // 404
    sendJSON(res, { error: 'Not found', endpoints: [
      'POST /api/chat',
      'GET  /api/health',
      'GET  /api/schedule',
      'POST /api/schedule/import/ics',
      'POST /api/schedule/import/excel',
      'DELETE /api/schedule/import',
      'POST /api/trigger',
    ]}, 404);

  } catch (err: any) {
    sendJSON(res, { error: err.message || 'Internal error' }, 500);
  }
});

server.listen(PORT, () => {
  console.log(`\n  🎒 校园搭子 API 已启动 → http://localhost:${PORT}`);
  console.log(`  POST /api/chat            → 对话`);
  console.log(`  POST /api/schedule/import/ics   → 导入 ICS 课表`);
  console.log(`  POST /api/schedule/import/excel → 导入 Excel 课表`);
  console.log(`  GET  /api/schedule        → 查看课表`);
  console.log(`  GET  /api/health          → 健康检查\n`);
});
