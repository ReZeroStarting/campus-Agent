// ============================================================
// 绩点计算器场景
// ============================================================

import { getCourseGrades, getGpa } from '../data/mock.js';

export function handleGradeQuery(text: string): { text: string; suggestions: string[] } {
  // "够不够3.5" / "能上3.8吗"
  const targetMatch = text.match(/(够不够|能不能|能.*上|能.*到)\s*([\d.]+)/);
  if (targetMatch) {
    return handleTargetGpa(parseFloat(targetMatch[2]));
  }

  // 挂科检查
  if (text.includes('挂科') || text.includes('挂了') || text.includes('能过')) {
    return handlePassCheck();
  }

  // 趋势
  if (text.includes('趋势') || text.includes('变化') || text.includes('走向')) {
    return handleTrend();
  }

  // 某门课成绩
  const courses = ['高数', '高等数学', '线代', '线性代数', '数据结构', '操作系统', '数据库', 'C语言', 'Python', '英语'];
  const matched = courses.find(c => text.includes(c));
  if (matched) {
    return handleCourseScore(matched);
  }

  // Default: 绩点总览
  return handleGpaOverview();
}

function handleGpaOverview(): { text: string; suggestions: string[] } {
  const gpaResult = getGpa();
  const level = gpaResult.gpa >= 3.5 ? '🟢 优秀' : gpaResult.gpa >= 3.0 ? '🟡 良好' : gpaResult.gpa >= 2.0 ? '🟠 一般' : '🔴 危险';

  const lines = [
    `📊 绩点总览：`,
    ``,
    `  GPA：${gpaResult.gpa.toFixed(2)} / 4.0  ${level}`,
    `  加权均分：${gpaResult.weightedAvg.toFixed(1)}`,
    `  已修学分：${gpaResult.totalCredits} 学分`,
    ``,
    `📈 学期趋势：`,
  ];

  gpaResult.trend.forEach(t => {
    const semLabel = t.semester === '2025-2026-1' ? '大一上' : t.semester === '2025-2026-2' ? '大一下' : t.semester;
    const bar = '█'.repeat(Math.round(t.gpa * 5));
    lines.push(`  ${semLabel}  ${t.gpa.toFixed(2)} ${bar}`);
  });

  lines.push('');
  lines.push(`📋 成绩明细：`);

  // 按学期分组
  const semesters = [...new Set(gpaResult.grades.map(g => g.semester))].sort();
  semesters.forEach(sem => {
    const semLabel = sem === '2025-2026-1' ? '大一上' : sem === '2025-2026-2' ? '大一下' : sem;
    lines.push(`  ${semLabel}：`);
    gpaResult.grades.filter(g => g.semester === sem).forEach(g => {
      const scoreLabel = g.score >= 90 ? '🟢' : g.score >= 80 ? '🟡' : g.score >= 70 ? '🟠' : g.score >= 60 ? '🟤' : '🔴';
      lines.push(`    ${scoreLabel} ${g.courseName}  ${g.score}分 · ${g.credits}学分 · ${g.category}`);
    });
  });

  return {
    text: lines.join('\n'),
    suggestions: ['绩点够不够3.5', '绩点趋势', '考试倒计时'],
  };
}

function handleTargetGpa(target: number): { text: string; suggestions: string[] } {
  const gpaResult = getGpa();
  const current = gpaResult.gpa;
  const currentCredits = gpaResult.totalCredits;

  // 本学期待考课程学分总和（估算）
  const pendingExams = [
    { name: '高等数学（下）', credits: 5 },
    { name: '线性代数', credits: 3 },
    { name: '数据结构', credits: 4 },
    { name: '操作系统', credits: 4 },
    { name: '大学英语（四）', credits: 2 },
  ];
  const pendingCredits = pendingExams.reduce((s, e) => s + e.credits, 0);

  // 需要多少分
  // target * (currentCredits + pendingCredits) = current * currentCredits + needed * pendingCredits
  const totalTarget = target * (currentCredits + pendingCredits);
  const currentTotal = current * currentCredits;
  const neededTotal = totalTarget - currentTotal;

  // Convert GPA points needed to average score
  // Approximation: GPA 4.0 ≈ 90, 3.0 ≈ 80, 2.0 ≈ 70
  const neededGpa = pendingCredits > 0 ? neededTotal / pendingCredits : target;
  const neededScore = gpaToScore(neededGpa);

  if (target <= current) {
    return {
      text: `✅ 当前绩点 ${current.toFixed(2)} 已达到 ${target}，不需要额外努力。继续保持！`,
      suggestions: ['绩点总览', '绩点趋势', '考试倒计时'],
    };
  }

  if (neededGpa > 4.0) {
    return {
      text: `❌ 即使这学期全满绩也达不到 ${target}。\n当前 ${current.toFixed(2)}，还差 ${pendingCredits} 学分的考试。\n最多能到 ${((current * currentCredits + 4.0 * pendingCredits) / (currentCredits + pendingCredits)).toFixed(2)}。`,
      suggestions: ['绩点总览', '绩点趋势', '考试倒计时'],
    };
  }

  const difficulty = neededScore >= 90 ? '🔴 难度很大，需要超常发挥' :
    neededScore >= 85 ? '🟠 有挑战，需要认真复习' :
    neededScore >= 80 ? '🟡 保持正常水平即可' :
    '🟢 轻松可达';

  return {
    text: `🎯 要达到 GPA ${target}：\n\n当前：${current.toFixed(2)}（${currentCredits}学分）\n${pendingExams.length} 门待考科目（${pendingCredits}学分）\n\n需要本学期均分 ≥ ${neededScore.toFixed(0)}（GPA ≈ ${neededGpa.toFixed(2)}）\n${difficulty}\n\n📋 待考科目：${pendingExams.map(e => e.name).join('、')}`,
    suggestions: ['考试倒计时', '找空教室复习', '绩点总览'],
  };
}

function handlePassCheck(): { text: string; suggestions: string[] } {
  const grades = getCourseGrades();
  const failing = grades.filter(g => g.score < 60);
  const borderline = grades.filter(g => g.score >= 60 && g.score < 70);

  if (failing.length === 0 && borderline.length === 0) {
    return { text: '✅ 所有科目都已通过，没有挂科风险。', suggestions: ['绩点总览', '绩点趋势', '考试倒计时'] };
  }

  const lines: string[] = [];
  if (failing.length > 0) {
    lines.push(`🔴 挂科（${failing.length}门）：`);
    failing.forEach(g => lines.push(`   ${g.courseName} ${g.score}分`));
  }
  if (borderline.length > 0) {
    lines.push(`\n🟠 低分飘过（${borderline.length}门）：`);
    borderline.forEach(g => lines.push(`   ${g.courseName} ${g.score}分`));
  }

  lines.push(`\n💡 挂科需参加补考，补考不过将影响毕业。建议联系任课老师了解补考安排。`);

  return {
    text: lines.join('\n'),
    suggestions: ['考试倒计时', '绩点总览', '去哪补办学生证'],
  };
}

function handleTrend(): { text: string; suggestions: string[] } {
  const gpaResult = getGpa();
  const trend = gpaResult.trend;

  if (trend.length < 2) {
    return { text: '数据不足，需要至少两个学期才能看趋势。', suggestions: ['绩点总览', '考试倒计时'] };
  }

  const lines = ['📈 绩点趋势：', ''];
  const maxGpa = Math.max(...trend.map(t => t.gpa), 4.0);
  const barLen = 30;

  trend.forEach(t => {
    const semLabel = t.semester === '2025-2026-1' ? '大一上' : t.semester === '2025-2026-2' ? '大一下' : t.semester;
    const width = Math.round(t.gpa / maxGpa * barLen);
    const bar = '█'.repeat(width) + '░'.repeat(Math.max(0, barLen - width));
    lines.push(`${semLabel.padEnd(6)} ${t.gpa.toFixed(2)} ${bar}`);
  });

  const last = trend[trend.length - 1];
  const prev = trend[trend.length - 2];
  const diff = last.gpa - prev.gpa;
  const arrow = diff > 0.05 ? '📈 上升' : diff < -0.05 ? '📉 下降' : '➡️ 持平';
  lines.push(`\n${arrow}（${diff > 0 ? '+' : ''}${diff.toFixed(2)}）`);

  if (diff < -0.1) lines.push('💡 趋势下降中，这学期加把劲！');
  else if (diff > 0.1) lines.push('💡 稳步上升，继续保持！');

  return {
    text: lines.join('\n'),
    suggestions: ['绩点总览', '绩点够不够3.5', '考试倒计时'],
  };
}

function handleCourseScore(course: string): { text: string; suggestions: string[] } {
  const grades = getCourseGrades();
  const grade = grades.find(g => g.courseName.includes(course) || course.includes(g.courseName));

  if (!grade) {
    return { text: `没找到「${course}」的成绩记录。`, suggestions: ['绩点总览', '考试倒计时'] };
  }

  const level = grade.score >= 90 ? '🟢 优秀' : grade.score >= 80 ? '🟡 良好' : grade.score >= 70 ? '🟠 中等' : grade.score >= 60 ? '🟤 及格' : '🔴 不及格';

  return {
    text: `📊 ${grade.courseName}\n\n成绩：${grade.score} 分  ${level}\n学分：${grade.credits}\n类型：${grade.category}\n学期：${grade.semester}`,
    suggestions: ['绩点总览', '绩点趋势', '同类课程查询'],
  };
}

function gpaToScore(gpa: number): number {
  if (gpa >= 4.0) return 95;
  if (gpa >= 3.7) return 88;
  if (gpa >= 3.3) return 83;
  if (gpa >= 3.0) return 80;
  if (gpa >= 2.7) return 76;
  if (gpa >= 2.3) return 73;
  if (gpa >= 2.0) return 68;
  if (gpa >= 1.5) return 63;
  if (gpa >= 1.0) return 60;
  return 55;
}
