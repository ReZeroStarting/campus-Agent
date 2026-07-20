// ============================================================
// 成绩单导入服务
// 支持从学校教务系统导出的 Excel 成绩单
// ============================================================

import * as XLSX from 'xlsx';
import type { CourseGrade } from '../models/index.js';

/** 成绩单 Excel 列名映射（支持中英文别名） */
const COLUMN_MAP: Record<string, string[]> = {
  courseName: ['课程名称', '课程', '科目', '课程名', 'name', 'courseName', 'course'],
  credits: ['学分', 'credit', 'credits'],
  score: ['成绩', '分数', '总评成绩', 'score', 'grade', 'mark'],
  semester: ['学期', '学年学期', 'semester', 'term'],
  category: ['课程类别', '类别', '修读性质', 'category', 'type'],
};

/** 存储已导入的成绩 */
let importedGrades: CourseGrade[] | null = null;

export function getImportedGrades(): CourseGrade[] | null {
  return importedGrades;
}

export function setImportedGrades(grades: CourseGrade[]): void {
  importedGrades = grades;
  console.log(`[GradeImport] 已导入 ${grades.length} 门课程成绩`);
}

export function clearImportedGrades(): void {
  importedGrades = null;
}

/**
 * 解析成绩单 Excel
 */
export function parseGradeExcel(buffer: Buffer): CourseGrade[] {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) throw new Error('Excel 文件为空');

  const sheet = workbook.Sheets[sheetName];
  const rows: Record<string, any>[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

  console.log(`[GradeImport] Excel 读取了 ${rows.length} 行`);

  const grades: CourseGrade[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];

    const courseName = extractField(row, 'courseName');
    if (!courseName) continue; // 跳过空行

    const credits = parseCredits(extractField(row, 'credits'));
    const score = parseScore(extractField(row, 'score'));
    const semester = normalizeSemester(extractField(row, 'semester'));
    const category = parseCategory(extractField(row, 'category'));

    grades.push({
      courseName,
      credits,
      score,
      semester,
      category: category as CourseGrade['category'],
    });
  }

  console.log(`[GradeImport] 解析出 ${grades.length} 门课程成绩`);

  if (grades.length === 0) {
    throw new Error('未找到有效的成绩数据。请检查列名：课程名称、学分、成绩、学期');
  }

  return grades;
}

// ---- 辅助函数 ----

function extractField(row: Record<string, any>, field: string): string {
  const aliases = COLUMN_MAP[field];
  if (!aliases) return '';

  for (const alias of aliases) {
    if (row[alias] !== undefined && row[alias] !== '') {
      return String(row[alias]).trim();
    }
    // 模糊匹配（含空格的列名）
    for (const key of Object.keys(row)) {
      if (key.trim() === alias.trim()) {
        return String(row[key]).trim();
      }
    }
  }
  return '';
}

function parseCredits(value: string): number {
  if (!value) return 2;
  const num = parseFloat(value);
  return isNaN(num) ? 2 : num;
}

function parseScore(value: string): number {
  if (!value) return 60;

  // 可能包含等级制："A" "B" "优秀" "良好" "中等" "及格"
  const levelMap: Record<string, number> = {
    'a': 95, 'a+': 98, 'a-': 92,
    'b': 85, 'b+': 88, 'b-': 82,
    'c': 75, 'c+': 78, 'c-': 72,
    'd': 65, 'd+': 68,
    'f': 55,
    '优秀': 95, '良好': 85, '中等': 75, '及格': 65, '不及格': 55,
    '优': 95, '良': 85, '中': 75, '差': 65,
    '通过': 75, '不通过': 55,
  };

  const cleaned = String(value).trim().toLowerCase();
  if (levelMap[cleaned] !== undefined) return levelMap[cleaned];

  const num = parseFloat(cleaned);
  return isNaN(num) ? 60 : Math.min(100, Math.max(0, num));
}

function normalizeSemester(value: string): string {
  if (!value) return '2025-2026-2';

  const cleaned = String(value).trim();

  // "2025-2026-1" → OK
  if (/^\d{4}-\d{4}-[12]$/.test(cleaned)) return cleaned;

  // "2025-2026学年第一学期" → "2025-2026-1"
  const fullMatch = cleaned.match(/(\d{4})\s*[-~～]\s*(\d{4}).*(?:第一|1)/);
  if (fullMatch) return `${fullMatch[1]}-${fullMatch[2]}-1`;
  const fullMatch2 = cleaned.match(/(\d{4})\s*[-~～]\s*(\d{4}).*(?:第二|2)/);
  if (fullMatch2) return `${fullMatch2[1]}-${fullMatch2[2]}-2`;

  // "2025秋" → "2025-2026-1"
  const shortMatch = cleaned.match(/(\d{4})\s*(春|秋|spring|fall)/);
  if (shortMatch) {
    const year = parseInt(shortMatch[1]);
    const isSpring = /春|spring/i.test(shortMatch[2]);
    return isSpring
      ? `${year}-${year + 1}-2`
      : `${year}-${year + 1}-1`;
  }

  return cleaned;
}

function parseCategory(value: string): string {
  if (!value) return '必修';

  const cleaned = String(value).trim();
  if (/必修|必/i.test(cleaned)) return '必修';
  if (/选修|选|任选/i.test(cleaned)) return '选修';
  if (/限选|指选|方向/i.test(cleaned)) return '限选';
  return '必修';
}

/**
 * 计算 GPA（4.0 制）
 */
export function calculateGpa(grades: CourseGrade[]): {
  gpa: number;
  weightedAvg: number;
  totalCredits: number;
} {
  if (grades.length === 0) return { gpa: 0, weightedAvg: 0, totalCredits: 0 };

  const scoreToGpa = (score: number): number => {
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

  let totalCredits = 0;
  let weightedGpa = 0;
  let weightedScore = 0;

  for (const g of grades) {
    const gpa = scoreToGpa(g.score);
    weightedGpa += gpa * g.credits;
    weightedScore += g.score * g.credits;
    totalCredits += g.credits;
  }

  return {
    gpa: totalCredits > 0 ? +(weightedGpa / totalCredits).toFixed(2) : 0,
    weightedAvg: totalCredits > 0 ? +(weightedScore / totalCredits).toFixed(1) : 0,
    totalCredits,
  };
}
