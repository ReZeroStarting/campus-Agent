// ============================================================
// 校园论坛模拟数据
// ============================================================

import type { ForumPost, ForumSection, ExtractedInfo } from '../../models/index.js';

function hoursAgo(h: number): string {
  return new Date(Date.now() - h * 3600000).toISOString();
}

let forumPosts: ForumPost[] = [
  {
    id: 'post_001', section: 'secondhand',
    title: '出闲置 27寸 2K 显示器 Dell U2722D',
    content: '去年双十一买的，用了半年，成色 95 新。完美屏无坏点，Type-C 一线连笔记本超方便。箱说全，送支架。因为换了 4K 所以出掉。',
    author: '研二小李', createdAt: hoursAgo(3),
    tags: ['显示器', '数码', '9成新'], images: [], replyCount: 12, viewCount: 342, hot: true,
  },
  {
    id: 'post_002', section: 'secondhand',
    title: 'CSAPP 第三版 几乎全新 50 出',
    content: '上学期计算机系统课用的，就翻了几次。原价 139，现在 50 出。还送配套实验环境配置笔记。',
    author: '计科大三', createdAt: hoursAgo(8),
    tags: ['教材', '计算机', '白菜价'], replyCount: 5, viewCount: 189, hot: false,
  },
  {
    id: 'post_003', section: 'secondhand',
    title: '考研数学全套资料转让',
    content: '张宇 30 讲 + 18 讲 + 1000 题，基本全新。还有一些自己整理的笔记和错题本。打包 80，单买另议。',
    author: '已上岸学长', createdAt: hoursAgo(6),
    tags: ['考研', '数学', '白菜价'], replyCount: 8, viewCount: 256, hot: false,
  },
  {
    id: 'post_004', section: 'lostfound',
    title: '二食堂捡到一个黑色书包',
    content: '中午 12 点左右在二食堂一楼靠窗位置捡到的。黑色双肩包，里面有 MacBook 和一个充电宝。失主请私信描述包内物品认领。',
    author: '好心人', createdAt: hoursAgo(2),
    tags: ['拾到', '贵重', '二食堂'], replyCount: 3, viewCount: 145, hot: false,
  },
  {
    id: 'post_005', section: 'lostfound',
    title: '钥匙丢了！教学楼 D 座到图书馆的路上',
    content: '一串钥匙，上面有个黄色皮卡丘挂件和一个 U 盘。今天早上 8 点到 10 点之间丢的，路线是 D 座 → 图书馆。找到重谢！',
    author: '大二软工', createdAt: hoursAgo(5),
    tags: ['寻物', '钥匙', 'U盘'], replyCount: 2, viewCount: 98, hot: false,
  },
  {
    id: 'post_006', section: 'lostfound',
    title: '图书馆三楼还书车捡到一副 AirPods',
    content: '白色 AirPods Pro，带一个蓝色壳。放在图书馆前台了，失主自带充电仓去验证。',
    author: '图书管理员预备役', createdAt: hoursAgo(12),
    tags: ['拾到', '耳机', '图书馆'], replyCount: 0, viewCount: 67, hot: false,
  },
  {
    id: 'post_007', section: 'coursereview',
    title: '机器学习（邹老师）选课避坑指南',
    content: '先说结论：课是好课，但慎重选。老师水平很高，但作业量巨大（每周一个 kaggle 级别的小项目），期末大作业要用 PyTorch 复现一篇论文。给分不卷，认真做基本 85+。适合想真正学东西的人，不适合刷绩点的。',
    author: '匿名用户', createdAt: hoursAgo(24),
    tags: ['机器学习', '选课', '硬核'], replyCount: 23, viewCount: 567, hot: true,
  },
  {
    id: 'post_008', section: 'coursereview',
    title: '操作系统（王老师）—— 强烈推荐！',
    content: '王老师讲课特别清晰，xv6 实验设计得很好，助教也很负责。考试不难，平时实验认真做基本都能拿高分。最良心的一门课没有之一。',
    author: '已毕业学长', createdAt: hoursAgo(48),
    tags: ['操作系统', '强烈推荐', '良心课'], replyCount: 15, viewCount: 423, hot: true,
  },
  {
    id: 'post_009', section: 'coursereview',
    title: '数据库系统——中规中矩',
    content: '内容还行，讲 MySQL + 一点 Redis。考试偏背诵，SQL 手写题占一半。平时有小作业但不多。给分一般，80 左右。',
    author: '匿名用户', createdAt: hoursAgo(36),
    tags: ['数据库', '选课', '中规中矩'], replyCount: 7, viewCount: 201, hot: false,
  },
  {
    id: 'post_010', section: 'events',
    title: '本周六 华为鸿蒙高校创新赛宣讲会',
    content: '时间：7月18日（周六）14:00-16:00\n地点：行政楼报告厅\n内容：赛道解读 + 往届优秀作品展示 + 技术答疑\n现场有抽奖，奖品包括 MatePad 和开发板！\n报名链接：https://xxx.edu.cn/harmony',
    author: '校团委科创部', createdAt: hoursAgo(12),
    tags: ['鸿蒙', '竞赛', '有奖品', '周六'], replyCount: 34, viewCount: 891, hot: true,
  },
  {
    id: 'post_011', section: 'events',
    title: '下周二 字节跳动校园招聘宣讲',
    content: '时间：7月21日（周二）18:30-20:30\n地点：学术交流中心 202\n对象：2026 届 & 2027 届\n岗位：前端、后端、算法、产品\n现场收简历，建议穿正装。',
    author: '就业指导中心', createdAt: hoursAgo(18),
    tags: ['校招', '字节', '正装', '周二'], replyCount: 45, viewCount: 1203, hot: true,
  },
  {
    id: 'post_012', section: 'events',
    title: '今晚操场有露天电影——《流浪地球3》',
    content: '时间：今晚 19:30\n地点：南操场\n校学生会放的露天电影，免费看，自带小板凳。有零食卖，别错过！',
    author: '校学生会', createdAt: hoursAgo(6),
    tags: ['电影', '免费', '今晚'], replyCount: 28, viewCount: 678, hot: true,
  },
  {
    id: 'post_013', section: 'treehole',
    title: '图书馆空调能不能修一下',
    content: '三楼东区空调坏了一周了，真的热到学不进去。有没有人一起去反映一下？',
    author: '匿名用户', createdAt: hoursAgo(4),
    tags: ['吐槽', '图书馆', '空调'], replyCount: 18, viewCount: 345, hot: true,
  },
  {
    id: 'post_014', section: 'treehole',
    title: '食堂阿姨手抖是玄学吗',
    content: '每次打红烧肉阿姨手就稳得一批，一打青菜就开始帕金森。有没有同感的？',
    author: '匿名用户', createdAt: hoursAgo(2),
    tags: ['吐槽', '食堂', '段子'], replyCount: 42, viewCount: 1024, hot: true,
  },
  {
    id: 'post_015', section: 'studyhelp',
    title: '求组队参加数学建模国赛',
    content: '缺一个会写论文的队友，我和另一个队友分别负责建模和编程。希望大二以上，有 LaTeX 经验最好。有意私信！',
    author: '数院大三', createdAt: hoursAgo(10),
    tags: ['数模', '组队', '国赛'], replyCount: 6, viewCount: 178, hot: false,
  },
  {
    id: 'post_016', section: 'studyhelp',
    title: '有偿求代做操作系统实验 5',
    content: '实在调不出来了，xv6 的 mmap 实验，有偿 100。大佬带带。',
    author: '匿名用户', createdAt: hoursAgo(1),
    tags: ['代做', '操作系统', '有偿'], replyCount: 11, viewCount: 234, hot: false,
  },
];

let extractedInfos: ExtractedInfo[] = [
  { id: 'ext_001', sourcePostId: 'post_010', type: 'event', title: '华为鸿蒙高校创新赛宣讲会', summary: '周六 14:00-16:00 行政楼报告厅，有抽奖', detail: { date: '7月18日', time: '14:00-16:00', location: '行政楼报告厅', organizer: '校团委科创部', hasLottery: '是' }, extractedAt: hoursAgo(12), validUntil: '2026-07-18T16:00:00' },
  { id: 'ext_002', sourcePostId: 'post_011', type: 'event', title: '字节跳动校园招聘宣讲', summary: '下周二 18:30 学术交流中心，现场收简历', detail: { date: '7月21日', time: '18:30-20:30', location: '学术交流中心 202', organizer: '就业指导中心', dressCode: '正装' }, extractedAt: hoursAgo(18), validUntil: '2026-07-21T20:30:00' },
  { id: 'ext_003', sourcePostId: 'post_012', type: 'event', title: '露天电影《流浪地球3》', summary: '今晚 19:30 南操场，免费', detail: { date: '今天', time: '19:30', location: '南操场', organizer: '校学生会', cost: '免费' }, extractedAt: hoursAgo(6), validUntil: '2026-07-17T22:00:00' },
  { id: 'ext_004', sourcePostId: 'post_004', type: 'found_item', title: '黑色书包（含 MacBook）', summary: '二食堂一楼捡到，失主请联系认领', detail: { location: '二食堂一楼', time: '中午12点', item: '黑色双肩包+MacBook+充电宝' }, extractedAt: hoursAgo(2) },
  { id: 'ext_005', sourcePostId: 'post_005', type: 'lost_item', title: '钥匙串（皮卡丘挂件+U盘）', summary: 'D座到图书馆路上丢失，找到重谢', detail: { location: 'D座→图书馆', time: '早上8-10点', item: '钥匙+皮卡丘挂件+U盘' }, extractedAt: hoursAgo(5) },
  { id: 'ext_006', sourcePostId: 'post_006', type: 'found_item', title: 'AirPods Pro（蓝色壳）', summary: '图书馆三楼还书车，已放前台', detail: { location: '图书馆三楼', item: 'AirPods Pro+蓝色壳' }, extractedAt: hoursAgo(12) },
  { id: 'ext_007', sourcePostId: 'post_007', type: 'course_rating', title: '机器学习（邹老师）', summary: '硬核好课，作业量大但能学到东西，给分85+', detail: { course: '机器学习', teacher: '邹老师', difficulty: '高', workload: '重', grading: '85+' }, extractedAt: hoursAgo(24) },
  { id: 'ext_008', sourcePostId: 'post_008', type: 'course_rating', title: '操作系统（王老师）', summary: '强烈推荐，讲课清晰实验好，高分良心课', detail: { course: '操作系统', teacher: '王老师', difficulty: '中', workload: '中', grading: '高' }, extractedAt: hoursAgo(48) },
  { id: 'ext_009', sourcePostId: 'post_009', type: 'course_rating', title: '数据库系统', summary: '中规中矩，偏背诵，给分一般', detail: { course: '数据库系统', difficulty: '中', workload: '轻', grading: '80左右' }, extractedAt: hoursAgo(36) },
  { id: 'ext_010', sourcePostId: 'post_013', type: 'hot_topic', title: '图书馆空调故障', summary: '三楼东区空调坏了一周，多人吐槽', detail: { location: '图书馆三楼东区', issue: '空调故障', duration: '一周', replies: '18' }, extractedAt: hoursAgo(4) },
  { id: 'ext_011', sourcePostId: 'post_014', type: 'hot_topic', title: '食堂打菜手抖吐槽', summary: '红烧肉稳青菜抖，42回复热议中', detail: { topic: '食堂阿姨手抖', replies: '42', views: '1024' }, extractedAt: hoursAgo(2) },
  { id: 'ext_012', sourcePostId: 'post_001', type: 'secondhand_deal', title: 'Dell 27寸 2K 显示器', summary: '95新，箱说全，Type-C一线连', detail: { item: 'Dell U2722D 27寸2K显示器', condition: '95新', features: 'Type-C一线连', contact: '研二小李' }, extractedAt: hoursAgo(3) },
];

export function getForumPosts(section?: ForumSection): ForumPost[] {
  if (section) return forumPosts.filter(p => p.section === section);
  return forumPosts.map(p => ({ ...p }));
}

export function getHotPosts(limit = 5): ForumPost[] {
  return forumPosts.filter(p => p.hot).slice(0, limit).map(p => ({ ...p }));
}

export function searchForumPosts(query: string): ForumPost[] {
  const terms = query.toLowerCase().split(/\s+/).filter(t => t.length > 1);
  return forumPosts
    .filter(p => {
      const text = (p.title + ' ' + p.content + ' ' + p.tags.join(' ')).toLowerCase();
      return text.includes(query.toLowerCase()) || terms.some(t => text.includes(t));
    })
    .map(p => ({ ...p }));
}

export function getForumPostById(id: string): ForumPost | undefined {
  const p = forumPosts.find(p => p.id === id);
  return p ? { ...p } : undefined;
}

export function getExtractedInfos(type?: ExtractedInfo['type']): ExtractedInfo[] {
  if (type) return extractedInfos.filter(i => i.type === type);
  return extractedInfos.map(i => ({ ...i }));
}

export function getActiveEvents(): ExtractedInfo[] {
  const now = new Date();
  return extractedInfos.filter(i => i.type === 'event' && (!i.validUntil || new Date(i.validUntil) > now));
}

export function searchExtractedInfos(query: string): ExtractedInfo[] {
  const terms = query.toLowerCase().split(/\s+/).filter(t => t.length > 1);
  return extractedInfos.filter(i => {
    const text = (i.title + ' ' + i.summary + ' ' + JSON.stringify(i.detail)).toLowerCase();
    return text.includes(query.toLowerCase()) || terms.some(t => text.includes(t));
  });
}
