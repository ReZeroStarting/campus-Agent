// ============================================================
// 考试倒计时场景
// ============================================================

import { getExams, getExamCountdown, getUpcomingExams } from '../data/mocks/index.js';

export function handleExamQuery(text: string): { text: string; suggestions: string[] } {
  // 最近考试
  if (text.includes('最近') || text.includes('倒计时') || text.includes('还有几天') || text.includes('期末周') || text.includes('考试安排')) {
    return handleCountdown();
  }

  // 特定科目 — 支持简称映射
  const aliasMap: Record<string, string> = {
    '高数': '高等数学', '线代': '线性代数', '英语': '大学英语',
    '大物': '大学物理', 'C语言': 'C 语言', '数据结构': '数据结构',
    '操作系统': '操作系统', '概率论': '概率论',
  };
  for (const [alias, full] of Object.entries(aliasMap)) {
    if (text.includes(alias)) {
      return handleExamDetail(full);
    }
  }

  // 今天/明天考试
  if (text.includes('今天') || text.includes('明天')) {
    return handleTodayExam(text.includes('明天'));
  }

  // Default: upcoming exams
  return handleCountdown();
}

function handleCountdown(): { text: string; suggestions: string[] } {
  const countdowns = getExamCountdown();
  if (countdowns.length === 0) {
    return { text: '🎉 考试周结束啦，好好享受假期吧！', suggestions: ['绩点', '论坛首页', '图书馆在哪'] };
  }

  const lines: string[] = [];
  lines.push('📝 考试倒计时：\n');

  countdowns.forEach(c => {
    const urgency = c.daysLeft === 0 ? '🔴 今天' : c.daysLeft === 1 ? '🟠 明天' : c.daysLeft <= 3 ? '🟡' : '🟢';
    const daysLabel = c.daysLeft === 0 ? '' : ` ${c.daysLeft}天后`;
    lines.push(`${urgency}${daysLabel}  ${c.exam.courseName}`);
    lines.push(`   ${c.exam.date} ${c.exam.time} @${c.exam.location}  ${c.exam.credits}学分`);
    if (c.exam.notes) lines.push(`   📌 ${c.exam.notes}`);
    lines.push('');
  });

  // 统计
  const todayCount = countdowns.filter(c => c.daysLeft <= 7).length;
  if (todayCount > 0) {
    lines.push(`本周共 ${todayCount} 场考试，加油复习！💪`);
  }

  const first = countdowns[0];
  let suggestions = ['绩点', '空教室'];
  if (first.daysLeft <= 3) {
    suggestions = ['找个空教室复习', '绩点', '一卡通余额'];
  }

  return { text: lines.join('\n'), suggestions };
}

function handleExamDetail(course: string): { text: string; suggestions: string[] } {
  const exam = getExams().find(e => {
    const n = e.courseName;
    return n.includes(course) || course.includes(n);
  });

  if (!exam) {
    return { text: `没找到「${course}」的考试安排，试试说「考试倒计时」`, suggestions: ['考试倒计时', '期末考试', '找空教室复习'] };
  }

  const countdowns = getExamCountdown();
  const cd = countdowns.find(c => c.exam.id === exam.id);
  const daysLeft = cd?.daysLeft ?? Math.ceil((new Date(exam.date).getTime() - Date.now()) / 86400000);

  const urgency = daysLeft === 0 ? '今天就是考试日！' : daysLeft <= 3 ? `还有 ${daysLeft} 天，抓紧复习！` : daysLeft <= 7 ? `还有 ${daysLeft} 天，按计划复习` : `还有 ${daysLeft} 天，时间充裕`;

  return {
    text: `📝 ${exam.courseName}\n\n📅 ${exam.date} ${exam.time}\n📍 ${exam.location}\n📊 ${exam.credits} 学分 · ${exam.type === 'final' ? '期末考试' : exam.type === 'quiz' ? '随堂测验' : '考试'}\n${exam.notes ? `📌 ${exam.notes}\n` : ''}\n⏰ ${urgency}`,
    suggestions: ['找空教室复习', '考试倒计时', '绩点'],
  };
}

function handleTodayExam(isTomorrow: boolean): { text: string; suggestions: string[] } {
  const today = new Date();
  if (isTomorrow) today.setDate(today.getDate() + 1);
  const dateStr = today.toISOString().split('T')[0];
  const todaysExams = getExams().filter(e => e.date === dateStr);

  if (todaysExams.length === 0) {
    const label = isTomorrow ? '明天' : '今天';
    return { text: `${label}没有考试，安心~`, suggestions: ['考试倒计时', '找空教室', '绩点'] };
  }

  const lines = todaysExams.map(e => {
    const timeLabel = e.time === '08:30-10:30' ? '上午' : '下午';
    return `📝 ${e.courseName}\n   ${timeLabel} ${e.time} @${e.location}\n   ${e.notes ? '📌 ' + e.notes : ''}`;
  });

  return {
    text: `${isTomorrow ? '明天' : '今天'}有 ${todaysExams.length} 场考试：\n\n${lines.join('\n\n')}`,
    suggestions: ['考试倒计时', '绩点', '去教室怎么走'],
  };
}
