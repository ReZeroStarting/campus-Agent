// ============================================================
// 成绩 & 绩点模拟数据
// ============================================================

import type { CourseGrade } from '../../models/index.js';

const courseGrades: CourseGrade[] = [
  { courseName: '高等数学（上）', credits: 5, score: 82, semester: '2025-2026-1', category: '必修' },
  { courseName: '线性代数', credits: 3, score: 88, semester: '2025-2026-1', category: '必修' },
  { courseName: '大学物理（上）', credits: 4, score: 75, semester: '2025-2026-1', category: '必修' },
  { courseName: 'C 语言程序设计', credits: 3, score: 90, semester: '2025-2026-1', category: '必修' },
  { courseName: '大学英语（三）', credits: 2, score: 85, semester: '2025-2026-1', category: '必修' },
  { courseName: '体育（三）', credits: 1, score: 92, semester: '2025-2026-1', category: '必修' },
  { courseName: 'Python 数据分析', credits: 2, score: 94, semester: '2025-2026-1', category: '选修' },
  { courseName: '数据结构', credits: 4, score: 78, semester: '2025-2026-2', category: '必修' },
  { courseName: '计算机组成原理', credits: 4, score: 72, semester: '2025-2026-2', category: '必修' },
  { courseName: '概率论', credits: 3, score: 85, semester: '2025-2026-2', category: '必修' },
  { courseName: '数据库原理', credits: 3, score: 80, semester: '2025-2026-2', category: '必修' },
  { courseName: '汇编语言', credits: 2, score: 68, semester: '2025-2026-2', category: '限选' },
];

export function getCourseGrades(): CourseGrade[] {
  return courseGrades.map(g => ({ ...g }));
}

export function getGpa(): { gpa: number; weightedAvg: number; totalCredits: number; passedCredits: number; grades: CourseGrade[]; trend: { semester: string; gpa: number }[] } {
  const grades = courseGrades;
  const pointMap = (score: number): number => {
    if (score >= 90) return 4.0;
    if (score >= 85) return 3.7;
    if (score >= 82) return 3.3;
    if (score >= 78) return 3.0;
    if (score >= 75) return 2.7;
    if (score >= 72) return 2.3;
    if (score >= 68) return 2.0;
    if (score >= 64) return 1.5;
    if (score >= 60) return 1.0;
    return 0;
  };

  let weightedSum = 0, totalCredits = 0, totalGpaPoints = 0;
  for (const g of courseGrades) {
    const points = pointMap(g.score);
    weightedSum += g.score * g.credits;
    totalCredits += g.credits;
    totalGpaPoints += points * g.credits;
  }

  const gpa = totalCredits > 0 ? Math.round(totalGpaPoints / totalCredits * 100) / 100 : 0;
  const weightedAvg = totalCredits > 0 ? Math.round(weightedSum / totalCredits * 100) / 100 : 0;

  const semesters = [...new Set(courseGrades.map(g => g.semester))].sort();
  const trend = semesters.map(sem => {
    const semGrades = courseGrades.filter(g => g.semester === sem);
    let sGpa = 0, sCredits = 0, sPoints = 0;
    for (const g of semGrades) { sPoints += pointMap(g.score) * g.credits; sCredits += g.credits; }
    return { semester: sem, gpa: sCredits > 0 ? Math.round(sPoints / sCredits * 100) / 100 : 0 };
  });

  return { gpa, weightedAvg, totalCredits, passedCredits: totalCredits, grades: courseGrades, trend };
}
