// ============================================================
// 课表导入服务
// 支持 ICS（学校教务系统导出）和 Excel 两种格式
// ============================================================

import * as XLSX from 'xlsx';
import type { Course } from '../models/index.js';

// ---- 存储 ----

let importedSchedule: Course[] | null = null;

/** 获取当前课表（优先返回导入的，否则返回模拟数据） */
export function getImportedSchedule(): Course[] | null {
  return importedSchedule;
}

/** 设置导入的课表 */
export function setImportedSchedule(courses: Course[]): void {
  // 为没有 courseId 的课程自动生成 ID
  importedSchedule = courses.map((c, i) => ({
    ...c,
    courseId: c.courseId || `IMP_${String(i + 1).padStart(3, '0')}`,
    weeks: c.weeks?.length ? c.weeks : Array.from({ length: 16 }, (_, j) => j + 1),
  }));
  console.log(`[ScheduleImport] 已导入 ${importedSchedule.length} 门课程`);
}

/** 清空导入的课表，恢复模拟数据 */
export function clearImportedSchedule(): void {
  importedSchedule = null;
}

/** 获取指定日期的课程（优先导入的课表） */
export function getCoursesForDate(date: Date, fallback: () => Course[]): Course[] {
  const schedule = importedSchedule || fallback();
  const weekday = date.getDay() === 0 ? 7 : date.getDay();
  return schedule
    .filter((c) => c.weekday === weekday)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
}

// ============================================================
// ICS 解析（RFC 5545）
// ============================================================

const WEEKDAY_MAP: Record<string, number> = {
  MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6, SU: 7,
};

interface IcsEvent {
  summary: string;
  location: string;
  description: string;
  dtstart: string;
  dtend: string;
  rrule: string;
}

export function parseICS(content: string): Course[] {
  const lines = content.split(/\r?\n/);
  const events: IcsEvent[] = [];

  let currentEvent: Partial<IcsEvent> | null = null;
  let inEvent = false;

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (line === 'BEGIN:VEVENT') {
      currentEvent = {};
      inEvent = true;
      continue;
    }

    if (line === 'END:VEVENT' && currentEvent) {
      events.push(currentEvent as IcsEvent);
      currentEvent = null;
      inEvent = false;
      continue;
    }

    if (!inEvent || !currentEvent || !line.includes(':')) continue;

    const colonIndex = line.indexOf(':');
    const key = line.substring(0, colonIndex).trim().toLowerCase();
    const value = line.substring(colonIndex + 1).trim();

    switch (key) {
      case 'summary': currentEvent.summary = value; break;
      case 'location': currentEvent.location = value; break;
      case 'description': currentEvent.description = value; break;
      case 'dtstart': currentEvent.dtstart = value; break;
      case 'dtend': currentEvent.dtend = value; break;
      case 'rrule': currentEvent.rrule = value; break;
    }
  }

  // 转换为 Course 对象（多天课程展开为多条）
  const courses: Course[] = [];
  events.forEach((evt, i) => {
    const expanded = icsEventToCourses(evt, `ICS_${String(i + 1).padStart(3, '0')}`);
    courses.push(...expanded);
  });
  return courses;
}

function icsEventToCourses(event: IcsEvent, courseId: string): Course[] {
  // 解析时间
  const startTime = icsTimeToHHMM(event.dtstart);
  const endTime = icsTimeToHHMM(event.dtend);

  // 解析星期几和周期
  const { weekdays, weeks } = parseRRule(event.rrule, event.dtstart);

  // 提取教师（从 description 或 summary 中）
  const teacher = extractTeacher(event.description || '', event.summary);

  // 为每个星期几创建独立的课程条目
  return weekdays.map((wd, idx) => ({
    courseId: weekdays.length > 1 ? `${courseId}_${idx + 1}` : courseId,
    name: event.summary || '未命名课程',
    teacher,
    location: event.location || '待定',
    weekday: wd,
    startTime,
    endTime,
    weeks,
  }));
}

function icsTimeToHHMM(icsTime: string): string {
  // 格式：20260914T080000 或 20260914T000000Z (UTC)
  const match = icsTime.match(/T(\d{2})(\d{2})\d{2}/);
  if (!match) return '08:00';
  let h = parseInt(match[1]);
  const m = match[2];
  // 如果是 UTC 时间（末尾有 Z），转为北京时间 UTC+8
  if (icsTime.endsWith('Z')) {
    h = (h + 8) % 24;
  }
  return `${String(h).padStart(2, '0')}:${m}`;
}

function parseRRule(rrule: string, dtstart: string): { weekdays: number[]; weeks: number[] } {
  const weekdays: number[] = [];
  let weeks: number[] = Array.from({ length: 16 }, (_, i) => i + 1);

  if (!rrule) {
    // 没有 RRULE，使用 DTSTART 判断星期几
    const dateStr = dtstart.substring(0, 8); // "20260914"
    if (dateStr.length === 8) {
      const y = parseInt(dateStr.substring(0, 4));
      const m = parseInt(dateStr.substring(4, 6)) - 1;
      const d = parseInt(dateStr.substring(6, 8));
      const day = new Date(y, m, d).getDay();
      weekdays.push(day === 0 ? 7 : day);
    }
    return { weekdays: weekdays.length ? weekdays : [1], weeks };
  }

  // 解析 RRULE
  for (const part of rrule.split(';')) {
    const [key, val] = part.trim().split('=');
    if (!val) continue;

    switch (key) {
      case 'BYDAY':
        for (const day of val.split(',')) {
          const wd = WEEKDAY_MAP[day.trim()];
          if (wd) weekdays.push(wd);
        }
        break;
      case 'UNTIL':
        // 计算周数：从 DTSTART 到 UNTIL 跨越多少周
        const startDate = parseIcsDate(dtstart);
        const endDate = parseIcsDate(val);
        if (startDate && endDate) {
          const diffWeeks = Math.ceil((endDate.getTime() - startDate.getTime()) / 604800000);
          weeks = Array.from({ length: Math.min(diffWeeks + 1, 20) }, (_, i) => i + 1);
        }
        break;
    }
  }

  return {
    weekdays: weekdays.length ? weekdays : [1],
    weeks,
  };
}

function parseIcsDate(icsDate: string): Date | null {
  const match = icsDate.match(/(\d{4})(\d{2})(\d{2})/);
  if (!match) return null;
  return new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]));
}

function extractTeacher(description: string, summary: string): string {
  // 尝试从描述中提取教师名（中文名，2-3字）
  const teacherMatch = description.match(/(?:教师|老师|授课)[：:]\s*([\u4e00-\u9fa5]{2,4})/);
  if (teacherMatch) return teacherMatch[1];
  // fallback
  return '未知';
}

// ============================================================
// Excel 导入
// ============================================================

/**
 * 支持的 Excel 列名映射
 * 用户可以用中文列名，也可以用英文别名
 */
const COLUMN_MAP: Record<string, string[]> = {
  name: ['课程名称', '课程', '科目', 'name', 'course'],
  teacher: ['教师', '老师', '授课教师', 'teacher', 'instructor'],
  location: ['地点', '教室', '上课地点', 'location', 'room'],
  weekday: ['星期', '星期几', '周几', 'weekday', 'day'],
  startTime: ['开始时间', '上课时间', '起始时间', 'start', 'startTime'],
  endTime: ['结束时间', '下课时间', '截止时间', 'end', 'endTime'],
  weeks: ['周次', '教学周', '上课周次', 'weeks', 'week'],
};

export function parseExcel(buffer: Buffer): Course[] {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) throw new Error('Excel 文件为空');

  const sheet = workbook.Sheets[sheetName];

  // 转为 JSON（第一行为表头）
  const rows: Record<string, any>[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

  console.log(`[ScheduleImport] Excel 读取了 ${rows.length} 行数据`);

  const courses: Course[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];

    const name = extractField(row, 'name');
    if (!name) continue; // 跳过空行

    const teacher = extractField(row, 'teacher') || '未知';
    const location = extractField(row, 'location') || '待定';
    const weekday = parseWeekday(extractField(row, 'weekday'));
    const startTime = normalizeTime(extractField(row, 'startTime'));
    const endTime = normalizeTime(extractField(row, 'endTime'));
    const weeks = parseWeeks(extractField(row, 'weeks'));

    courses.push({
      courseId: `XLS_${String(i + 1).padStart(3, '0')}`,
      name,
      teacher,
      location,
      weekday,
      startTime,
      endTime,
      weeks,
    });
  }

  console.log(`[ScheduleImport] 解析出 ${courses.length} 门课程`);

  if (courses.length === 0) {
    throw new Error('未找到有效的课程数据，请检查列名是否正确');
  }

  return courses;
}

// ---- Excel 解析辅助 ----

function extractField(row: Record<string, any>, field: string): string {
  const aliases = COLUMN_MAP[field];
  if (!aliases) return '';

  for (const alias of aliases) {
    // 精确匹配
    if (row[alias] !== undefined && row[alias] !== '') {
      return String(row[alias]).trim();
    }
    // 模糊匹配（中文字段名可能有空格）
    for (const key of Object.keys(row)) {
      if (key.trim() === alias.trim()) {
        return String(row[key]).trim();
      }
    }
  }
  return '';
}

function parseWeekday(value: string): number {
  if (!value) return 1;

  const weekMap: Record<string, number> = {
    '一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6, '日': 7, '天': 7,
    '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '0': 7,
    'mon': 1, 'tue': 2, 'wed': 3, 'thu': 4, 'fri': 5, 'sat': 6, 'sun': 7,
    'monday': 1, 'tuesday': 2, 'wednesday': 3, 'thursday': 4, 'friday': 5,
    'saturday': 6, 'sunday': 7,
  };

  const cleaned = String(value).trim().toLowerCase();
  for (const [k, v] of Object.entries(weekMap)) {
    if (cleaned.includes(k)) {
      return v;
    }
  }

  // 纯数字
  const num = parseInt(value);
  if (num >= 1 && num <= 7) return num;

  return 1;
}

function normalizeTime(value: string): string {
  if (!value) return '08:00';

  const cleaned = String(value).trim();

  // 各种格式 → HH:MM
  // "08:00" → OK
  // "8:00" → "08:00"
  // "800" → "08:00"
  // "8:00 AM" → "08:00"
  const match = cleaned.match(/(\d{1,2})[:：](\d{2})/);
  if (match) {
    return `${match[1].padStart(2, '0')}:${match[2]}`;
  }

  const numMatch = cleaned.match(/(\d{3,4})/);
  if (numMatch) {
    const num = numMatch[1].padStart(4, '0');
    return `${num.substring(0, 2)}:${num.substring(2, 4)}`;
  }

  return '08:00';
}

function parseWeeks(value: string): number[] {
  if (!value) return Array.from({ length: 16 }, (_, i) => i + 1);

  const cleaned = String(value).trim();
  const weeks: number[] = [];

  // 格式1：逗号分隔 "1,2,3,4,5"
  if (cleaned.includes(',') && !cleaned.includes('-')) {
    return cleaned.split(',').map(Number).filter((n) => n > 0);
  }

  // 格式2：范围 "1-16"
  const rangeMatch = cleaned.match(/(\d+)\s*[-~～]\s*(\d+)/);
  if (rangeMatch) {
    const start = parseInt(rangeMatch[1]);
    const end = parseInt(rangeMatch[2]);
    for (let i = start; i <= end; i++) weeks.push(i);
    return weeks;
  }

  // 格式3：单个数字
  const num = parseInt(cleaned);
  if (num > 0) return [num];

  return Array.from({ length: 16 }, (_, i) => i + 1);
}
