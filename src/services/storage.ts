// ============================================================
// 本地数据持久化层
// 学生可以导入自己的课表/成绩/考试 → 保存为 JSON → 下次启动自动加载
// 无数据库依赖，纯文件系统
// ============================================================

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import type { Course, CourseGrade, Exam } from '../models/index.js';

/** 数据目录 */
function getDataDir(): string {
  const dir = join(process.cwd(), 'data');
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  return dir;
}

function readJson<T>(filename: string): T | null {
  try {
    const path = join(getDataDir(), filename);
    if (!existsSync(path)) return null;
    const raw = readFileSync(path, 'utf-8');
    return JSON.parse(raw) as T;
  } catch {
    console.warn(`[Storage] 读取 ${filename} 失败`);
    return null;
  }
}

function writeJson(filename: string, data: unknown): void {
  const path = join(getDataDir(), filename);
  writeFileSync(path, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`[Storage] 已保存 ${filename}`);
}

// ============================================================
// 课表
// ============================================================

export function loadSchedule(): Course[] | null {
  return readJson<Course[]>('schedule.json');
}

export function saveSchedule(courses: Course[]): void {
  writeJson('schedule.json', courses);
}

// ============================================================
// 成绩
// ============================================================

export function loadGrades(): CourseGrade[] | null {
  return readJson<CourseGrade[]>('grades.json');
}

export function saveGrades(grades: CourseGrade[]): void {
  writeJson('grades.json', grades);
}

// ============================================================
// 考试安排
// ============================================================

export function loadExams(): Exam[] | null {
  return readJson<Exam[]>('exams.json');
}

export function saveExams(exams: Exam[]): void {
  writeJson('exams.json', exams);
}

// ============================================================
// 数据状态
// ============================================================

export interface StorageStatus {
  schedule: { imported: boolean; count: number };
  grades: { imported: boolean; count: number };
  exams: { imported: boolean; count: number };
}

export function getStorageStatus(): StorageStatus {
  const sched = loadSchedule();
  const grades = loadGrades();
  const exams = loadExams();
  return {
    schedule: { imported: sched !== null, count: sched?.length ?? 0 },
    grades: { imported: grades !== null, count: grades?.length ?? 0 },
    exams: { imported: exams !== null, count: exams?.length ?? 0 },
  };
}

/** 清空所有数据 */
export function clearAllData(): void {
  const dir = getDataDir();
  for (const file of ['schedule.json', 'grades.json', 'exams.json']) {
    const path = join(dir, file);
    if (existsSync(path)) {
      // 不真删，改为 .bak 备份
      try {
        const bakPath = path + '.bak';
        writeFileSync(bakPath, readFileSync(path));
      } catch { /* ignore */ }
    }
  }
  console.log('[Storage] 已清空所有数据（备份为 .bak）');
}
