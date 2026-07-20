// ============================================================
// 考试模拟数据
// ============================================================

import type { Exam } from '../../models/index.js';

function dayOffset(d: number): string {
  const dt = new Date();
  dt.setDate(dt.getDate() + d);
  return dt.toISOString().split('T')[0];
}

const exams: Exam[] = [
  { id: 'ex_001', courseName: '高等数学（下）', date: dayOffset(5), time: '08:30-10:30', location: '教一 101', type: 'final', credits: 5, notes: '闭卷，带计算器' },
  { id: 'ex_002', courseName: '线性代数', date: dayOffset(7), time: '14:00-16:00', location: '教一 201', type: 'final', credits: 3 },
  { id: 'ex_003', courseName: '数据结构', date: dayOffset(9), time: '08:30-10:30', location: '教三 401', type: 'final', credits: 4, notes: '开卷，可带教材' },
  { id: 'ex_004', courseName: '操作系统', date: dayOffset(12), time: '14:00-16:00', location: '教三 402', type: 'final', credits: 4, notes: '闭卷' },
  { id: 'ex_005', courseName: '大学英语（四）', date: dayOffset(14), time: '08:30-10:30', location: '教二 301', type: 'final', credits: 2, notes: '含听力，带耳机' },
  { id: 'ex_006', courseName: '概率论', date: dayOffset(2), time: '09:00-11:00', location: '教一 301', type: 'quiz', credits: 3, notes: '随堂测验，占平时成绩30%' },
];

export function getExams(): Exam[] {
  return exams.map(e => ({ ...e }));
}

export function getUpcomingExams(limit = 5): Exam[] {
  const today = new Date().toISOString().split('T')[0];
  return exams
    .filter(e => e.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, limit)
    .map(e => ({ ...e }));
}

export function getExamCountdown(): { exam: Exam; daysLeft: number }[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return exams
    .filter(e => e.date >= today.toISOString().split('T')[0])
    .map(e => {
      const examDate = new Date(e.date);
      examDate.setHours(0, 0, 0, 0);
      const daysLeft = Math.ceil((examDate.getTime() - today.getTime()) / 86400000);
      return { exam: e, daysLeft };
    })
    .sort((a, b) => a.daysLeft - b.daysLeft);
}
