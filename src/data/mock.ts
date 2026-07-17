// ============================================================
// 模拟数据
// 初赛阶段使用模拟数据跑通全流程，复赛再接入真实 API
// ============================================================

import type { Course, CardState, ShowerState, WeatherInfo, ForumPost, ExtractedInfo, ForumSection } from '../models/index.js';

// ---- 课表模拟 ----

/** 获取当前学期课表 */
export function getMockSchedule(): Course[] {
  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay() + 1); // 本周一

  return [
    {
      courseId: 'DS101',
      name: '数据结构',
      teacher: '张明远',
      location: '教三401',
      weekday: 1, // 周一
      startTime: '08:00',
      endTime: '09:40',
      weeks: Array.from({ length: 16 }, (_, i) => i + 1),
    },
    {
      courseId: 'DS101',
      name: '数据结构',
      teacher: '张明远',
      location: '教三401',
      weekday: 3, // 周三
      startTime: '08:00',
      endTime: '09:40',
      weeks: Array.from({ length: 16 }, (_, i) => i + 1),
    },
    {
      courseId: 'DS101',
      name: '数据结构',
      teacher: '张明远',
      location: '教三401',
      weekday: 5, // 周五
      startTime: '10:00',
      endTime: '11:40',
      weeks: Array.from({ length: 16 }, (_, i) => i + 1),
    },
    {
      courseId: 'OS202',
      name: '操作系统',
      teacher: '李华',
      location: '教二305',
      weekday: 2, // 周二
      startTime: '14:00',
      endTime: '15:40',
      weeks: Array.from({ length: 16 }, (_, i) => i + 1),
    },
    {
      courseId: 'OS202',
      name: '操作系统',
      teacher: '李华',
      location: '教二305',
      weekday: 4, // 周四
      startTime: '14:00',
      endTime: '15:40',
      weeks: Array.from({ length: 16 }, (_, i) => i + 1),
    },
    {
      courseId: 'DB301',
      name: '数据库原理',
      teacher: '王芳',
      location: '教五201',
      weekday: 1, // 周一
      startTime: '10:00',
      endTime: '11:40',
      weeks: Array.from({ length: 16 }, (_, i) => i + 1),
    },
    {
      courseId: 'DB301',
      name: '数据库原理',
      teacher: '王芳',
      location: '教五201',
      weekday: 3, // 周三
      startTime: '10:00',
      endTime: '11:40',
      weeks: Array.from({ length: 16 }, (_, i) => i + 1),
    },
  ];
}

/** 获取指定日期的课程 */
export function getScheduleForDate(date: Date, schedule?: Course[]): Course[] {
  const courses = schedule || getMockSchedule();
  const weekday = date.getDay() === 0 ? 7 : date.getDay(); // 转换周日为 7
  return courses.filter((c) => c.weekday === weekday).sort((a, b) => a.startTime.localeCompare(b.startTime));
}

// ---- 一卡通模拟 ----

let cardState: CardState = {
  balance: 12.0,
  todaySpent: 15.5,
  weekSpent: 63.5,
  transactions: [
    { time: '2026-07-16T07:45:00+08:00', amount: 5.0, location: '二食堂一楼', category: '早餐' },
    { time: '2026-07-16T12:10:00+08:00', amount: 10.5, location: '二食堂二楼', category: '午餐' },
    { time: '2026-07-15T07:30:00+08:00', amount: 4.5, location: '一食堂', category: '早餐' },
    { time: '2026-07-15T12:05:00+08:00', amount: 12.0, location: '二食堂二楼', category: '午餐' },
    { time: '2026-07-15T17:35:00+08:00', amount: 2.5, location: '澡堂', category: '洗澡' },
    { time: '2026-07-15T18:20:00+08:00', amount: 8.0, location: '二食堂一楼', category: '晚餐' },
    { time: '2026-07-14T07:50:00+08:00', amount: 5.5, location: '一食堂', category: '早餐' },
    { time: '2026-07-14T12:00:00+08:00', amount: 13.0, location: '三食堂', category: '午餐' },
    { time: '2026-07-14T18:10:00+08:00', amount: 9.0, location: '二食堂一楼', category: '晚餐' },
  ],
};

export function getCardState(): CardState {
  return { ...cardState, transactions: [...cardState.transactions] };
}

export function deductCardBalance(amount: number, location: string, category: CardState['transactions'][0]['category']): CardState {
  cardState.balance -= amount;
  cardState.transactions.unshift({
    time: new Date().toISOString(),
    amount,
    location,
    category,
  });
  return getCardState();
}

export function resetCardState(): void {
  cardState = {
    balance: 12.0,
    todaySpent: 15.5,
    weekSpent: 63.5,
    transactions: [...cardState.transactions],
  };
}

// ---- 澡堂模拟 ----

let showerState: ShowerState = {
  balance: 3.2,
  pricePerShower: 2.5,
  crowdLevel: '空闲',
};

export function getShowerState(): ShowerState {
  // 根据时间动态调整拥挤度
  const hour = new Date().getHours();
  if (hour >= 17 && hour <= 19) {
    showerState.crowdLevel = '拥挤';
  } else if (hour >= 12 && hour <= 14) {
    showerState.crowdLevel = '适中';
  } else if (hour >= 20 && hour <= 22) {
    showerState.crowdLevel = '适中';
  } else {
    showerState.crowdLevel = '空闲';
  }
  return { ...showerState };
}

export function deductShowerBalance(): ShowerState {
  showerState.balance = Math.max(0, showerState.balance - showerState.pricePerShower);
  showerState.lastShowerTime = new Date().toISOString();
  return { ...showerState };
}

// ---- 天气模拟 ----

const weatherConditions = ['晴', '多云', '阴', '小雨', '中雨'];

export function getMockWeather(date: Date): WeatherInfo {
  const seed = date.getDate() + date.getMonth() * 31;
  const condition = weatherConditions[seed % weatherConditions.length];

  const baseTemp = 30; // 七月中旬基准温度
  const variation = (seed % 5) - 2;

  const tipsMap: Record<string, string> = {
    '晴': '天气炎热，注意防晒和补水',
    '多云': '适合户外活动',
    '阴': '可能有雨，建议带伞',
    '小雨': '记得带伞',
    '中雨': '出门记得带伞，路面湿滑注意安全',
  };

  return {
    date: date.toISOString().slice(0, 10),
    condition,
    tempHigh: baseTemp + variation + 2,
    tempLow: baseTemp + variation - 5,
    humidity: 60 + (seed % 30),
    windLevel: 1 + (seed % 3),
    tips: tipsMap[condition] || '注意天气变化',
  };
}

// ---- 饮水模拟 ----

let waterToday = 600; // 今日已饮水 ml

export function getWaterIntake(): { current: number; goal: number; percent: number } {
  return {
    current: waterToday,
    goal: 1500,
    percent: Math.round((waterToday / 1500) * 100),
  };
}

export function addWater(ml: number): { current: number; goal: number; percent: number } {
  waterToday += ml;
  return getWaterIntake();
}

export function resetWaterIntake(): void {
  waterToday = 0;
}

// ---- 取件点 ----

import type { PickupPoint, Package, DeliveryOrder, RouteStep, RoutePlan } from '../models/index.js';

const pickupPoints: PickupPoint[] = [
  {
    id: 'cainiao',
    name: '菜鸟驿站',
    type: '快递',
    location: '宿舍区东侧，7号楼一层',
    openTime: '08:00',
    closeTime: '20:00',
    commuteFrom: { '宿舍': 5, '教三': 3, '教二': 6, '教五': 8, '二食堂': 4, '校门口': 6 },
  },
  {
    id: 'gate',
    name: '校门口外卖架',
    type: '外卖',
    location: '南门内侧快递区',
    openTime: '00:00',
    closeTime: '23:59',
    commuteFrom: { '宿舍': 8, '教三': 10, '教二': 12, '教五': 15, '二食堂': 7, '菜鸟驿站': 6 },
  },
  {
    id: 'jd_locker',
    name: '京东快递柜',
    type: '快递',
    location: '图书馆北侧',
    openTime: '06:00',
    closeTime: '23:00',
    commuteFrom: { '宿舍': 6, '教三': 7, '教二': 5, '教五': 10, '二食堂': 3, '菜鸟驿站': 4 },
  },
];

export function getPickupPoints(): PickupPoint[] {
  return pickupPoints;
}

export function getPickupPoint(id: string): PickupPoint | undefined {
  return pickupPoints.find(p => p.id === id);
}

// ---- 快递包裹 ----

const now = new Date();
const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

const packages: Package[] = [
  {
    trackingId: 'SF1234567890',
    carrier: '顺丰',
    status: '已到站',
    description: '机械键盘（104键 青轴）',
    arrivedAt: new Date(today.getTime() - 2 * 3600000).toISOString(), // 2小时前
    pickupCode: '3-2-5012',
    pickupPoint: 'cainiao',
  },
  {
    trackingId: 'YT9876543210',
    carrier: '圆通',
    status: '已到站',
    description: '《深入理解计算机系统》',
    arrivedAt: new Date(today.getTime() - 3600000).toISOString(),
    pickupCode: '1-4-3088',
    pickupPoint: 'cainiao',
  },
  {
    trackingId: 'JD5555666677',
    carrier: '京东',
    status: '运输中',
    description: '手机壳 + 钢化膜',
    estimatedArrival: new Date(today.getTime() + 86400000).toISOString(), // 明天
    pickupPoint: 'jd_locker',
  },
];

export function getPackages(): Package[] {
  return packages.map(p => ({ ...p }));
}

export function getActivePackages(): Package[] {
  return packages.filter(p => p.status !== '已取件');
}

export function markPackagePicked(trackingId: string): boolean {
  const pkg = packages.find(p => p.trackingId === trackingId);
  if (!pkg) return false;
  pkg.status = '已取件';
  return true;
}

// ---- 外卖订单 ----

const deliveryETA = new Date(today.getTime() + 15 * 60000); // 15分钟后

let deliveryOrders: DeliveryOrder[] = [
  {
    orderId: 'MT202607171234',
    platform: '美团',
    restaurant: '黄焖鸡米饭（大学城店）',
    status: '配送中',
    estimatedDelivery: deliveryETA.toISOString(),
    pickupPoint: 'gate',
    riderName: '张师傅',
    riderPhone: '138****5678',
  },
];

export function getDeliveryOrders(): DeliveryOrder[] {
  // 动态更新状态
  const now = new Date();
  for (const order of deliveryOrders) {
    if (order.status === '配送中') {
      const eta = new Date(order.estimatedDelivery);
      if (now >= eta) {
        order.status = '已送达';
        order.actualDelivery = now.toISOString();
      }
    }
  }
  return deliveryOrders.map(o => ({ ...o }));
}

export function getActiveOrders(): DeliveryOrder[] {
  return getDeliveryOrders().filter(o => o.status !== '已取餐');
}

export function markOrderPicked(orderId: string): boolean {
  const order = deliveryOrders.find(o => o.orderId === orderId);
  if (!order) return false;
  order.status = '已取餐';
  return true;
}

export function addDeliveryOrder(order: DeliveryOrder): void {
  deliveryOrders.push(order);
}

export function resetDeliveryData(): void {
  packages.forEach(p => { p.status = p.trackingId === 'SF1234567890' || p.trackingId === 'YT9876543210' ? '已到站' : '运输中'; });
  const eta = new Date(today.getTime() + 15 * 60000);
  deliveryOrders = [{
    orderId: 'MT202607171234',
    platform: '美团',
    restaurant: '黄焖鸡米饭（大学城店）',
    status: '配送中',
    estimatedDelivery: eta.toISOString(),
    pickupPoint: 'gate',
    riderName: '张师傅',
    riderPhone: '138****5678',
  }];
}

// ============================================================
// 校园论坛模拟数据
// ============================================================

function hoursAgo(h: number): string {
  return new Date(Date.now() - h * 3600000).toISOString();
}

let forumPosts: ForumPost[] = [
  // ── 二手交易 ──
  {
    id: 'post_001',
    section: 'secondhand',
    title: '出闲置 27寸 2K 显示器 Dell U2722D',
    content: '去年双十一买的，用了半年，成色 95 新。完美屏无坏点，Type-C 一线连笔记本超方便。箱说全，送支架。因为换了 4K 所以出掉。',
    author: '研二小李',
    createdAt: hoursAgo(3),
    tags: ['显示器', '数码', '9成新'],
    images: [],
    replyCount: 12,
    viewCount: 342,
    hot: true,
  },
  {
    id: 'post_002',
    section: 'secondhand',
    title: 'CSAPP 第三版 几乎全新 50 出',
    content: '上学期计算机系统课用的，就翻了几次。原价 139，现在 50 出。还送配套实验环境配置笔记。',
    author: '计科大三',
    createdAt: hoursAgo(8),
    tags: ['教材', '计算机', '白菜价'],
    replyCount: 5,
    viewCount: 189,
    hot: false,
  },
  {
    id: 'post_003',
    section: 'secondhand',
    title: '考研数学全套资料转让',
    content: '张宇 30 讲 + 18 讲 + 1000 题，基本全新。还有一些自己整理的笔记和错题本。打包 80，单买另议。',
    author: '已上岸学长',
    createdAt: hoursAgo(6),
    tags: ['考研', '数学', '白菜价'],
    replyCount: 8,
    viewCount: 256,
    hot: false,
  },

  // ── 失物招领 ──
  {
    id: 'post_004',
    section: 'lostfound',
    title: '二食堂捡到一个黑色书包',
    content: '中午 12 点左右在二食堂一楼靠窗位置捡到的。黑色双肩包，里面有 MacBook 和一个充电宝。失主请私信描述包内物品认领。',
    author: '好心人',
    createdAt: hoursAgo(2),
    tags: ['拾到', '贵重', '二食堂'],
    replyCount: 3,
    viewCount: 145,
    hot: false,
  },
  {
    id: 'post_005',
    section: 'lostfound',
    title: '钥匙丢了！教学楼 D 座到图书馆的路上',
    content: '一串钥匙，上面有个黄色皮卡丘挂件和一个 U 盘。今天早上 8 点到 10 点之间丢的，路线是 D 座 → 图书馆。找到重谢！',
    author: '大二软工',
    createdAt: hoursAgo(5),
    tags: ['寻物', '钥匙', 'U盘'],
    replyCount: 2,
    viewCount: 98,
    hot: false,
  },
  {
    id: 'post_006',
    section: 'lostfound',
    title: '图书馆三楼还书车捡到一副 AirPods',
    content: '白色 AirPods Pro，带一个蓝色壳。放在图书馆前台了，失主自带充电仓去验证。',
    author: '图书管理员预备役',
    createdAt: hoursAgo(12),
    tags: ['拾到', '耳机', '图书馆'],
    replyCount: 0,
    viewCount: 67,
    hot: false,
  },

  // ── 课程评价 ──
  {
    id: 'post_007',
    section: 'coursereview',
    title: '机器学习（邹老师）选课避坑指南',
    content: '先说结论：课是好课，但慎重选。老师水平很高，但作业量巨大（每周一个 kaggle 级别的小项目），期末大作业要用 PyTorch 复现一篇论文。给分不卷，认真做基本 85+。适合想真正学东西的人，不适合刷绩点的。',
    author: '匿名用户',
    createdAt: hoursAgo(24),
    tags: ['机器学习', '选课', '硬核'],
    replyCount: 23,
    viewCount: 567,
    hot: true,
  },
  {
    id: 'post_008',
    section: 'coursereview',
    title: '操作系统（王老师）—— 强烈推荐！',
    content: '王老师讲课特别清晰，xv6 实验设计得很好，助教也很负责。考试不难，平时实验认真做基本都能拿高分。最良心的一门课没有之一。',
    author: '已毕业学长',
    createdAt: hoursAgo(48),
    tags: ['操作系统', '强烈推荐', '良心课'],
    replyCount: 15,
    viewCount: 423,
    hot: true,
  },
  {
    id: 'post_009',
    section: 'coursereview',
    title: '数据库系统——中规中矩',
    content: '内容还行，讲 MySQL + 一点 Redis。考试偏背诵，SQL 手写题占一半。平时有小作业但不多。给分一般，80 左右。',
    author: '匿名用户',
    createdAt: hoursAgo(36),
    tags: ['数据库', '选课', '中规中矩'],
    replyCount: 7,
    viewCount: 201,
    hot: false,
  },

  // ── 活动通知 ──
  {
    id: 'post_010',
    section: 'events',
    title: '本周六 华为鸿蒙高校创新赛宣讲会',
    content: '时间：7月18日（周六）14:00-16:00\n地点：行政楼报告厅\n内容：赛道解读 + 往届优秀作品展示 + 技术答疑\n现场有抽奖，奖品包括 MatePad 和开发板！\n报名链接：https://xxx.edu.cn/harmony',
    author: '校团委科创部',
    createdAt: hoursAgo(12),
    tags: ['鸿蒙', '竞赛', '有奖品', '周六'],
    replyCount: 34,
    viewCount: 891,
    hot: true,
  },
  {
    id: 'post_011',
    section: 'events',
    title: '下周二 字节跳动校园招聘宣讲',
    content: '时间：7月21日（周二）18:30-20:30\n地点：学术交流中心 202\n对象：2026 届 & 2027 届\n岗位：前端、后端、算法、产品\n现场收简历，建议穿正装。',
    author: '就业指导中心',
    createdAt: hoursAgo(18),
    tags: ['校招', '字节', '正装', '周二'],
    replyCount: 45,
    viewCount: 1203,
    hot: true,
  },
  {
    id: 'post_012',
    section: 'events',
    title: '今晚操场有露天电影——《流浪地球3》',
    content: '时间：今晚 19:30\n地点：南操场\n校学生会放的露天电影，免费看，自带小板凳。有零食卖，别错过！',
    author: '校学生会',
    createdAt: hoursAgo(6),
    tags: ['电影', '免费', '今晚'],
    replyCount: 28,
    viewCount: 678,
    hot: true,
  },

  // ── 树洞 ──
  {
    id: 'post_013',
    section: 'treehole',
    title: '图书馆空调能不能修一下',
    content: '三楼东区空调坏了一周了，真的热到学不进去。有没有人一起去反映一下？',
    author: '匿名用户',
    createdAt: hoursAgo(4),
    tags: ['吐槽', '图书馆', '空调'],
    replyCount: 18,
    viewCount: 345,
    hot: true,
  },
  {
    id: 'post_014',
    section: 'treehole',
    title: '食堂阿姨手抖是玄学吗',
    content: '每次打红烧肉阿姨手就稳得一批，一打青菜就开始帕金森。有没有同感的？',
    author: '匿名用户',
    createdAt: hoursAgo(2),
    tags: ['吐槽', '食堂', '段子'],
    replyCount: 42,
    viewCount: 1024,
    hot: true,
  },

  // ── 学习互助 ──
  {
    id: 'post_015',
    section: 'studyhelp',
    title: '求组队参加数学建模国赛',
    content: '缺一个会写论文的队友，我和另一个队友分别负责建模和编程。希望大二以上，有 LaTeX 经验最好。有意私信！',
    author: '数院大三',
    createdAt: hoursAgo(10),
    tags: ['数模', '组队', '国赛'],
    replyCount: 6,
    viewCount: 178,
    hot: false,
  },
  {
    id: 'post_016',
    section: 'studyhelp',
    title: '有偿求代做操作系统实验 5',
    content: '实在调不出来了，xv6 的 mmap 实验，有偿 100。大佬带带。',
    author: '匿名用户',
    createdAt: hoursAgo(1),
    tags: ['代做', '操作系统', '有偿'],
    replyCount: 11,
    viewCount: 234,
    hot: false,
  },
];

// ── 自动提取的结构化信息点 ──
let extractedInfos: ExtractedInfo[] = [
  {
    id: 'ext_001',
    sourcePostId: 'post_010',
    type: 'event',
    title: '华为鸿蒙高校创新赛宣讲会',
    summary: '周六 14:00-16:00 行政楼报告厅，有抽奖',
    detail: { date: '7月18日', time: '14:00-16:00', location: '行政楼报告厅', organizer: '校团委科创部', hasLottery: '是' },
    extractedAt: hoursAgo(12),
    validUntil: '2026-07-18T16:00:00',
  },
  {
    id: 'ext_002',
    sourcePostId: 'post_011',
    type: 'event',
    title: '字节跳动校园招聘宣讲',
    summary: '下周二 18:30 学术交流中心，现场收简历',
    detail: { date: '7月21日', time: '18:30-20:30', location: '学术交流中心 202', organizer: '就业指导中心', dressCode: '正装' },
    extractedAt: hoursAgo(18),
    validUntil: '2026-07-21T20:30:00',
  },
  {
    id: 'ext_003',
    sourcePostId: 'post_012',
    type: 'event',
    title: '露天电影《流浪地球3》',
    summary: '今晚 19:30 南操场，免费',
    detail: { date: '今天', time: '19:30', location: '南操场', organizer: '校学生会', cost: '免费' },
    extractedAt: hoursAgo(6),
    validUntil: '2026-07-17T22:00:00',
  },
  {
    id: 'ext_004',
    sourcePostId: 'post_004',
    type: 'found_item',
    title: '黑色书包（含 MacBook）',
    summary: '二食堂一楼捡到，失主请联系认领',
    detail: { location: '二食堂一楼', time: '中午12点', item: '黑色双肩包+MacBook+充电宝' },
    extractedAt: hoursAgo(2),
  },
  {
    id: 'ext_005',
    sourcePostId: 'post_005',
    type: 'lost_item',
    title: '钥匙串（皮卡丘挂件+U盘）',
    summary: 'D座到图书馆路上丢失，找到重谢',
    detail: { location: 'D座→图书馆', time: '早上8-10点', item: '钥匙+皮卡丘挂件+U盘' },
    extractedAt: hoursAgo(5),
  },
  {
    id: 'ext_006',
    sourcePostId: 'post_006',
    type: 'found_item',
    title: 'AirPods Pro（蓝色壳）',
    summary: '图书馆三楼还书车，已放前台',
    detail: { location: '图书馆三楼', item: 'AirPods Pro+蓝色壳' },
    extractedAt: hoursAgo(12),
  },
  {
    id: 'ext_007',
    sourcePostId: 'post_007',
    type: 'course_rating',
    title: '机器学习（邹老师）',
    summary: '硬核好课，作业量大但能学到东西，给分85+',
    detail: { course: '机器学习', teacher: '邹老师', difficulty: '高', workload: '重', grading: '85+' },
    extractedAt: hoursAgo(24),
  },
  {
    id: 'ext_008',
    sourcePostId: 'post_008',
    type: 'course_rating',
    title: '操作系统（王老师）',
    summary: '强烈推荐，讲课清晰实验好，高分良心课',
    detail: { course: '操作系统', teacher: '王老师', difficulty: '中', workload: '中', grading: '高' },
    extractedAt: hoursAgo(48),
  },
  {
    id: 'ext_009',
    sourcePostId: 'post_009',
    type: 'course_rating',
    title: '数据库系统',
    summary: '中规中矩，偏背诵，给分一般',
    detail: { course: '数据库系统', difficulty: '中', workload: '轻', grading: '80左右' },
    extractedAt: hoursAgo(36),
  },
  {
    id: 'ext_010',
    sourcePostId: 'post_013',
    type: 'hot_topic',
    title: '图书馆空调故障',
    summary: '三楼东区空调坏了一周，多人吐槽',
    detail: { location: '图书馆三楼东区', issue: '空调故障', duration: '一周', replies: '18' },
    extractedAt: hoursAgo(4),
  },
  {
    id: 'ext_011',
    sourcePostId: 'post_014',
    type: 'hot_topic',
    title: '食堂打菜手抖吐槽',
    summary: '红烧肉稳青菜抖，42回复热议中',
    detail: { topic: '食堂阿姨手抖', replies: '42', views: '1024' },
    extractedAt: hoursAgo(2),
  },
  {
    id: 'ext_012',
    sourcePostId: 'post_001',
    type: 'secondhand_deal',
    title: 'Dell 27寸 2K 显示器',
    summary: '95新，箱说全，Type-C一线连',
    detail: { item: 'Dell U2722D 27寸2K显示器', condition: '95新', features: 'Type-C一线连', contact: '研二小李' },
    extractedAt: hoursAgo(3),
  },
];

// ── getter ──

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
      // 至少匹配一个关键词（短查询）或全文包含
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
