// ============================================================
// 结构化日志
// 统一输出格式，支持 traceId + 级别 + 延迟度量
// ============================================================

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  time: string;
  level: LogLevel;
  module: string;
  action: string;
  traceId?: string;
  elapsedMs?: number;
  [key: string]: unknown;
}

let seq = 0;
function nextSeq(): string {
  seq++;
  return `req_${Date.now()}_${String(seq).padStart(4, '0')}`;
}

function formatEntry(entry: LogEntry): string {
  const parts: string[] = [
    `[${entry.time.slice(11, 19)}]`,
    `[${entry.level.toUpperCase()}]`,
    `[${entry.module}]`,
    `${entry.action}`,
  ];
  if (entry.traceId) parts.push(`(trace: ${entry.traceId.slice(-8)})`);
  if (entry.elapsedMs !== undefined) parts.push(`${entry.elapsedMs}ms`);

  const { time: _t, level: _l, module: _m, action: _a, traceId: _tid, elapsedMs: _ems, ...extras } = entry;

  if (Object.keys(extras).length > 0) {
    parts.push(JSON.stringify(extras));
  }

  return parts.join(' ');
}

function log(level: LogLevel, module: string, action: string, extras?: Record<string, unknown>): LogEntry {
  const entry: LogEntry = {
    time: new Date().toISOString(),
    level,
    module,
    action,
    ...extras,
  };

  const msg = formatEntry(entry);
  const fn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
  fn(msg);

  return entry;
}

export const logger = {
  info: (module: string, action: string, extras?: Record<string, unknown>) =>
    log('info', module, action, extras),
  warn: (module: string, action: string, extras?: Record<string, unknown>) =>
    log('warn', module, action, extras),
  error: (module: string, action: string, extras?: Record<string, unknown>) =>
    log('error', module, action, extras),
  debug: (module: string, action: string, extras?: Record<string, unknown>) =>
    log('debug', module, action, extras),
};

/** 创建带 traceId 的计时器 */
export function createTimedLogger(module: string, action: string) {
  const traceId = nextSeq();
  const start = Date.now();

  return {
    traceId,
    info: (action: string, extras?: Record<string, unknown>) =>
      log('info', module, action, { traceId, ...extras }),
    warn: (action: string, extras?: Record<string, unknown>) =>
      log('warn', module, action, { traceId, ...extras }),
    error: (action: string, extras?: Record<string, unknown>) =>
      log('error', module, action, { traceId, ...extras }),
    finish: (action: string, extras?: Record<string, unknown>) => {
      const elapsedMs = Date.now() - start;
      return log('info', module, action, { traceId, elapsedMs, ...extras });
    },
  };
}
