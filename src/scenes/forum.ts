// ============================================================
// 校园论坛场景 —— 帖子查询 + 信息点自动提取
// ============================================================

import {
  getForumPosts,
  getHotPosts,
  searchForumPosts,
  getExtractedInfos,
  getActiveEvents,
  searchExtractedInfos,
} from '../data/mocks/index.js';
import { FORUM_SECTION_NAMES, type ForumSection } from '../models/index.js';

const SECTION_KEYWORDS: Record<string, ForumSection> = {
  '二手': 'secondhand',
  '闲置': 'secondhand',
  '出': 'secondhand',
  '卖': 'secondhand',
  '买': 'secondhand',
  '求购': 'secondhand',
  '失物': 'lostfound',
  '捡到': 'lostfound',
  '丢了': 'lostfound',
  '丢失': 'lostfound',
  '寻找': 'lostfound',
  '找到': 'lostfound',
  '耳机': 'lostfound',
  '钥匙': 'lostfound',
  '书包': 'lostfound',
  '课程': 'coursereview',
  '选课': 'coursereview',
  '老师': 'coursereview',
  '评价': 'coursereview',
  '机器学习': 'coursereview',
  '操作系统': 'coursereview',
  '数据库': 'coursereview',
  '活动': 'events',
  '讲座': 'events',
  '宣讲': 'events',
  '宣讲会': 'events',
  '明天': 'events',
  '今天': 'events',
  '今晚': 'events',
  '周末': 'events',
  '电影': 'events',
  '树洞': 'treehole',
  '吐槽': 'treehole',
  '八卦': 'treehole',
  '空调': 'treehole',
  '组队': 'studyhelp',
  '代做': 'studyhelp',
  '有偿': 'studyhelp',
  '求教': 'studyhelp',
  '队友': 'studyhelp',
};

function detectSection(text: string): ForumSection | undefined {
  for (const [kw, section] of Object.entries(SECTION_KEYWORDS)) {
    if (text.includes(kw)) return section;
  }
  return undefined;
}

// ---- 查询热门帖子 ----
export function handleHotPosts(): { text: string; suggestions: string[] } {
  const posts = getHotPosts(6);
  if (posts.length === 0) return { text: '论坛暂时风平浪静~', suggestions: ['查失物', '看看二手', '有什么活动'] };

  const lines = posts.map((p, i) => {
    const section = FORUM_SECTION_NAMES[p.section];
    const time = timeAgo(p.createdAt);
    return `${i + 1}. 【${section}】${p.title}  🔥${p.replyCount}回复 · ${time}`;
  });

  return {
    text: `📋 论坛热帖 TOP ${posts.length}：\n\n${lines.join('\n\n')}\n\n说「论坛 二手」可以只看某个板块`,
    suggestions: ['有什么活动', '最近失物', '查课程评价'],
  };
}

// ---- 查询活动/讲座 ----
export function handleEventsQuery(text: string): { text: string; suggestions: string[] } {
  const events = getActiveEvents();
  // 按关键词过滤
  const kw = text.includes('校招') ? '校招' : text.includes('宣讲') ? '宣讲' : text.includes('电影') ? '电影' : text.includes('鸿蒙') ? '鸿蒙' : '';
  const filtered = kw ? events.filter(e => e.title.includes(kw) || e.summary.includes(kw)) : events;

  if (filtered.length === 0) {
    return { text: '最近没有相关活动通知。', suggestions: ['论坛首页', '查失物', '看看二手'] };
  }

  const lines = filtered.map(e => {
    const d = e.detail;
    return `📅 ${e.title}\n   时间：${d.date} ${d.time || ''}\n   地点：${d.location || '待定'}\n   组织：${d.organizer || '-'}${d.hasLottery ? ' 🎁有抽奖！' : ''}${d.dressCode ? `\n   注意：${d.dressCode}` : ''}`;
  });

  return {
    text: `📅 近期活动：\n\n${lines.join('\n\n')}`,
    suggestions: ['论坛首页', '查失物', '看看二手'],
  };
}

// ---- 查询失物招领 ----
export function handleLostFoundQuery(text: string): { text: string; suggestions: string[] } {
  const lostItems = getExtractedInfos('lost_item');
  const foundItems = getExtractedInfos('found_item');

  const keyword = text.includes('耳机') ? '耳机' : text.includes('钥匙') ? '钥匙' : text.includes('书包') ? '书包' : '';
  const filterBy = (items: typeof lostItems) => keyword ? items.filter(i => i.title.includes(keyword)) : items;

  const lost = filterBy(lostItems);
  const found = filterBy(foundItems);

  if (lost.length === 0 && found.length === 0) {
    return { text: '最近没有相关失物招领信息。', suggestions: ['论坛首页', '有什么活动', '看看二手'] };
  }

  const parts: string[] = [];
  if (found.length > 0) {
    parts.push('🟢 捡到物品：');
    found.forEach(f => parts.push(`  • ${f.title} — ${f.summary}`));
  }
  if (lost.length > 0) {
    parts.push('\n🔴 寻找物品：');
    lost.forEach(l => parts.push(`  • ${l.title} — ${l.summary}`));
  }

  return {
    text: parts.join('\n'),
    suggestions: ['我也丢了东西', '论坛首页', '有什么活动'],
  };
}

// ---- 查询课程评价 ----
export function handleCourseReviewQuery(text: string): { text: string; suggestions: string[] } {
  const ratings = getExtractedInfos('course_rating');

  const kw = text.includes('机器学习') ? '机器学习' : text.includes('操作系统') ? '操作系统' : text.includes('数据库') ? '数据库' : '';
  const filtered = kw ? ratings.filter(r => r.title.includes(kw)) : ratings;

  if (filtered.length === 0) {
    return { text: '还没人评价这门课，你可以第一个发帖！', suggestions: ['论坛首页', '有什么活动', '看看二手'] };
  }

  const lines = filtered.map(r => {
    const d = r.detail;
    return `📚 ${r.title}\n   ${r.summary}\n   难度：${d.difficulty || '-'} | 作业量：${d.workload || '-'} | 给分：${d.grading || '-'}`;
  });

  return {
    text: `📚 课程评价：\n\n${lines.join('\n\n')}`,
    suggestions: ['论坛首页', '有什么活动', '选课建议'],
  };
}

// ---- 查询二手交易 ----
export function handleSecondhandQuery(text: string): { text: string; suggestions: string[] } {
  const deals = getExtractedInfos('secondhand_deal');
  const posts = getForumPosts('secondhand');

  const kw = text.includes('显示器') ? '显示器' : text.includes('书') || text.includes('教材') ? '书' : text.includes('考研') ? '考研' : '';
  const filteredPosts = kw ? posts.filter(p => p.title.includes(kw) || p.content.includes(kw)) : posts;

  if (filteredPosts.length === 0) {
    return { text: '暂时没有相关二手信息，逛逛别的板块？', suggestions: ['论坛首页', '有什么活动', '查课程评价'] };
  }

  const lines = filteredPosts.slice(0, 5).map(p => {
    const time = timeAgo(p.createdAt);
    return `💰 ${p.title}\n   发布者：${p.author} · ${time} · ${p.replyCount}回复`;
  });

  return {
    text: `🛒 二手交易：\n\n${lines.join('\n\n')}`,
    suggestions: ['论坛首页', '有什么活动', '查失物'],
  };
}

// ---- 综合查询 ----
export function handleForumQuery(text: string): { text: string; suggestions: string[] } {
  const section = detectSection(text);

  // 子意图路由
  if (text.includes('活动') || text.includes('讲座') || text.includes('宣讲') || text.includes('电影')) {
    return handleEventsQuery(text);
  }
  if (text.includes('失物') || text.includes('捡到') || text.includes('丢了') || text.includes('寻找')) {
    return handleLostFoundQuery(text);
  }
  if (text.includes('课程') || text.includes('课') && (text.includes('怎么样') || text.includes('评价') || text.includes('推荐') || text.includes('避坑'))) {
    return handleCourseReviewQuery(text);
  }
  if (text.includes('二手') || text.includes('闲置') || text.includes('卖') || text.includes('买') || text.includes('求购') || text.includes('有人出')) {
    return handleSecondhandQuery(text);
  }
  if (text.includes('热帖') || text.includes('热点') || text.includes('首页') || text === '论坛') {
    return handleHotPosts();
  }

  // 关键词搜索
  const searchKws = ['显示器', '耳机', '钥匙', '教材', '考研', '组队', '数模', '电脑', '键盘', '鼠标', 'U盘'];
  if (searchKws.some(kw => text.includes(kw))) {
    const posts = searchForumPosts(text);
    const infos = searchExtractedInfos(text);
    if (posts.length === 0 && infos.length === 0) {
      return { text: '没找到相关帖子，试试换个关键词？', suggestions: ['论坛首页', '有什么活动', '看看二手'] };
    }
    const postLines = posts.slice(0, 3).map(p => `• 【${FORUM_SECTION_NAMES[p.section]}】${p.title} — ${timeAgo(p.createdAt)}`);
    const infoLines = infos.slice(0, 3).map(i => `• 📌 ${i.summary}`);
    const parts: string[] = [];
    if (infos.length > 0) parts.push(`找到 ${infos.length} 条相关信息：\n${infoLines.join('\n')}`);
    if (posts.length > 0) parts.push(`\n相关帖子 (${posts.length})：\n${postLines.join('\n')}`);
    return { text: parts.join('\n'), suggestions: ['论坛首页', '有什么活动', '查失物'] };
  }

  // 默认：综合汇总
  const hotSummary = getHotPosts(3);
  const events = getActiveEvents();
  const summaryParts: string[] = [];

  summaryParts.push(`📋 论坛综合看板：\n`);

  if (events.length > 0) {
    summaryParts.push(`📅 近期活动 (${events.length})：`);
    events.slice(0, 2).forEach(e => summaryParts.push(`  • ${e.summary}`));
  }

  summaryParts.push(`\n🔥 热帖：`);
  hotSummary.forEach((p, i) => {
    summaryParts.push(`  • 【${FORUM_SECTION_NAMES[p.section]}】${p.title}`);
  });

  summaryParts.push(`\n💬 论坛共 ${getForumPosts().length} 个帖子，覆盖 ${Object.keys(FORUM_SECTION_NAMES).length} 个板块`);
  summaryParts.push('说「论坛 二手」可以只看某个板块');

  return {
    text: summaryParts.join('\n'),
    suggestions: ['有什么活动', '最近失物', '查课程评价', '看看二手'],
  };
}

// ---- 工具 ----
function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}分钟前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}小时前`;
  const days = Math.floor(hours / 24);
  return `${days}天前`;
}
