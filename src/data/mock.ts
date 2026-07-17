// ============================================================
// 模拟数据
// 初赛阶段使用模拟数据跑通全流程，复赛再接入真实 API
// ============================================================

import type { Course, CardState, ShowerState, WeatherInfo, ForumPost, ExtractedInfo, ForumSection, CampusBuilding, Exam, CourseGrade, Classroom } from '../models/index.js';

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

export function getWeatherToday(): WeatherInfo {
  return getMockWeather(new Date());
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

// ============================================================
// 校园地图模拟数据
// ============================================================

const campusBuildings: CampusBuilding[] = [
  // ── 教学楼 ──
  {
    id: 'bld_teaching_1',
    name: '第一教学楼',
    shortName: '教一',
    type: 'teaching',
    description: '主教学楼，大课和公共课都在这里',
    location: '校园正门东侧',
    floorInfo: '共 6 层，1-2 层为大阶梯教室，3-6 层为普通教室',
    services: ['上课', '自习', '考试'],
    nearby: ['bld_teaching_2', 'bld_library', 'bld_canteen_1'],
    walkFromCenter: 2,
    openTime: '07:00-22:00',
  },
  {
    id: 'bld_teaching_2',
    name: '第二教学楼',
    shortName: '教二',
    type: 'teaching',
    description: '小班教学为主，外语学院和人文学院常用',
    location: '校园正门西侧，教一对面',
    floorInfo: '共 5 层，每层 8 间教室，顶楼有语音室',
    services: ['上课', '自习', '考试', '语音课'],
    nearby: ['bld_teaching_1', 'bld_admin', 'bld_canteen_1'],
    walkFromCenter: 3,
    openTime: '07:00-22:00',
  },
  {
    id: 'bld_teaching_3',
    name: '第三教学楼',
    shortName: '教三',
    type: 'teaching',
    description: '计算机学院和软件学院主要教学楼',
    location: '校园东区，实验楼A栋旁',
    floorInfo: '共 7 层，1-3 层机房，4-7 层多媒体教室',
    services: ['上课', '自习', '机考', '计算机实验'],
    nearby: ['bld_lab_a', 'bld_canteen_2', 'bld_dorm_3'],
    walkFromCenter: 5,
    openTime: '07:00-22:30',
  },

  // ── 实验楼 ──
  {
    id: 'bld_lab_a',
    name: '实验楼 A 栋',
    shortName: '实验楼A',
    type: 'lab',
    description: '计算机/电子/通信实验中心',
    location: '校园东区，教三北侧',
    floorInfo: '共 8 层，1-2 层基础实验室，3-5 层专业实验室，6-8 层科研/研究生',
    services: ['实验课', '科研', '课程设计', '服务器机房'],
    nearby: ['bld_teaching_3', 'bld_canteen_2', 'bld_dorm_3'],
    walkFromCenter: 6,
    openTime: '08:00-22:00（刷卡进出）',
    tips: '门禁需刷一卡通，访客需登记',
  },
  {
    id: 'bld_lab_b',
    name: '实验楼 B 栋',
    shortName: '实验楼B',
    type: 'lab',
    description: '物理/化学/生物基础实验中心',
    location: '校园西区，靠近南操场',
    floorInfo: '共 5 层，1-2 层物理实验室，3-4 层化学实验室，5 层生物实验室',
    services: ['实验课', '基础实验', '开放实验'],
    nearby: ['bld_sports', 'bld_canteen_1', 'bld_dorm_1'],
    walkFromCenter: 8,
    openTime: '08:00-18:00（化学实验室需防护装备）',
  },

  // ── 图书馆 ──
  {
    id: 'bld_library',
    name: '图书馆',
    shortName: '图书馆',
    type: 'library',
    description: '校园地标，藏书 200 万册，自习圣地',
    location: '校园中心，正门直走 200 米',
    floorInfo: '共 5 层，1 层大厅/咖啡厅/还书处，2-3 层社科/自科阅览室，4 层电子阅览室/自习区，5 层古籍/特藏',
    services: ['借还书', '自习', '电子阅览', '打印复印', '研讨间预约'],
    nearby: ['bld_teaching_1', 'bld_teaching_2', 'bld_admin', 'bld_canteen_1'],
    walkFromCenter: 0,
    openTime: '06:30-22:30（考试周延长至 23:30）',
    tips: '三楼东区空调近期故障，建议去四楼自习',
  },

  // ── 食堂 ──
  {
    id: 'bld_canteen_1',
    name: '一食堂',
    shortName: '一食堂',
    type: 'canteen',
    description: '靠近教学区，下课高峰人多',
    location: '校园中心偏北，教学楼和图书馆之间',
    floorInfo: '共 3 层，1 楼大众餐，2 楼风味窗口，3 楼教工餐厅/清真',
    services: ['早中晚餐', '清真窗口', '水吧', '一卡通充值'],
    nearby: ['bld_teaching_1', 'bld_teaching_2', 'bld_library'],
    walkFromCenter: 1,
    openTime: '06:30-09:00 / 11:00-13:00 / 17:00-19:30',
    tips: '中午 12:00-12:30 是高峰期，建议错峰',
  },
  {
    id: 'bld_canteen_2',
    name: '二食堂',
    shortName: '二食堂',
    type: 'canteen',
    description: '靠近宿舍区，环境好二楼窗口多',
    location: '校园东区，宿舍 3-6 号楼附近',
    floorInfo: '共 2 层，1 楼大众餐/早餐，2 楼各地风味/麻辣烫/黄焖鸡',
    services: ['早中晚餐', '夜宵', '奶茶店', '一卡通充值'],
    nearby: ['bld_teaching_3', 'bld_lab_a', 'bld_dorm_3', 'bld_dorm_4'],
    walkFromCenter: 5,
    openTime: '06:30-21:30（夜宵到 21:00）',
    tips: '二楼黄焖鸡是招牌，人均 10-15 元',
  },

  // ── 宿舍 ──
  {
    id: 'bld_dorm_1',
    name: '宿舍 1-2 号楼',
    shortName: '1-2号楼',
    type: 'dormitory',
    description: '本科男生宿舍，6 人间上床下桌',
    location: '校园西区，靠近南操场',
    floorInfo: '各 6 层，每层 20 间，公共卫浴',
    services: ['住宿', '洗衣房', '开水房', '自动售货机'],
    nearby: ['bld_sports', 'bld_lab_b', 'bld_canteen_1'],
    walkFromCenter: 8,
    tips: '一楼有洗衣房，扫码洗衣 3 元/次',
  },
  {
    id: 'bld_dorm_3',
    name: '宿舍 3-4 号楼',
    shortName: '3-4号楼',
    type: 'dormitory',
    description: '本科女生宿舍，4 人间独立卫浴',
    location: '校园东区，靠近二食堂',
    floorInfo: '各 7 层，每层 16 间，独立卫浴',
    services: ['住宿', '洗衣房', '开水房', '快递柜'],
    nearby: ['bld_canteen_2', 'bld_teaching_3', 'bld_lab_a'],
    walkFromCenter: 5,
  },
  {
    id: 'bld_dorm_5',
    name: '宿舍 5-6 号楼',
    shortName: '5-6号楼',
    type: 'dormitory',
    description: '研究生宿舍，2/3 人间',
    location: '校园东南角，环境安静',
    floorInfo: '各 12 层电梯楼，每层 12 间，独立卫浴+阳台',
    services: ['住宿', '洗衣房', '快递柜', '自习室', '健身房'],
    nearby: ['bld_teaching_3', 'bld_lab_a', 'bld_hospital'],
    walkFromCenter: 10,
  },

  // ── 行政楼 ──
  {
    id: 'bld_admin',
    name: '行政楼',
    shortName: '行政楼',
    type: 'admin',
    description: '学校行政事务办理中心',
    location: '校园中心偏西，图书馆西侧',
    floorInfo: '共 4 层，1 楼综合服务大厅，2 楼教务处/学生处，3 楼财务处/后勤，4 楼校领导办公室',
    services: ['一卡通补办', '成绩单打印', '学籍证明', '学生证补办', '宿舍报修', '电费充值'],
    nearby: ['bld_library', 'bld_teaching_2', 'bld_canteen_1'],
    walkFromCenter: 2,
    openTime: '08:30-12:00 / 14:00-17:30（工作日）',
    tips: '成绩单打印在 2 楼 204，一卡通补办在 1 楼大厅右侧',
  },

  // ── 体育馆/操场 ──
  {
    id: 'bld_sports',
    name: '体育馆 & 南操场',
    shortName: '体育馆',
    type: 'sports',
    description: '室内体育馆+室外标准操场',
    location: '校园西南角',
    floorInfo: '体育馆共 3 层：1 楼篮球/羽毛球，2 楼乒乓球/健身房，3 楼舞蹈/瑜伽室。南操场为标准 400 米跑道+足球场',
    services: ['体育课', '体测', '运动', '比赛', '露天电影'],
    nearby: ['bld_dorm_1', 'bld_lab_b', 'bld_canteen_1'],
    walkFromCenter: 7,
    openTime: '体育馆 08:00-21:30 / 操场 06:00-22:00',
    tips: '健身房免费，带一卡通登记即可',
  },

  // ── 校医院 ──
  {
    id: 'bld_hospital',
    name: '校医院',
    shortName: '校医院',
    type: 'hospital',
    description: '校内医疗，急诊 24 小时',
    location: '校园东南角，宿舍 5-6 号楼旁',
    floorInfo: '共 3 层，1 楼门诊/药房/急诊，2 楼输液/观察，3 楼体检中心/心理中心',
    services: ['门诊', '急诊', '医保报销', '体检', '心理咨询'],
    nearby: ['bld_dorm_5'],
    walkFromCenter: 11,
    openTime: '门诊 08:30-17:30 / 急诊 24 小时',
    tips: '记得带一卡通和学生证，挂号费 1 元',
  },

  // ── 服务点 ──
  {
    id: 'bld_service_print',
    name: '校园打印店',
    shortName: '打印店',
    type: 'service',
    description: '打印/复印/装订/论文排版',
    location: '图书馆一楼大厅左侧',
    floorInfo: '',
    services: ['打印', '复印', '扫描', '装订', '论文排版', '证件照'],
    nearby: ['bld_library', 'bld_teaching_1'],
    walkFromCenter: 0,
    openTime: '08:00-21:00',
    tips: '黑白 0.1 元/页，彩色 1 元/页，论文装订 5 元',
  },
  {
    id: 'bld_service_bank',
    name: '校园银行网点',
    shortName: '银行',
    type: 'service',
    description: 'ATM + 人工柜台',
    location: '一食堂一楼南侧',
    floorInfo: '',
    services: ['ATM取款', '存取款', '校园卡圈存'],
    nearby: ['bld_canteen_1', 'bld_teaching_1'],
    walkFromCenter: 1,
    openTime: 'ATM 24小时 / 柜台 09:00-16:30',
  },
  {
    id: 'bld_service_post',
    name: '菜鸟驿站 + 邮局',
    shortName: '菜鸟驿站',
    type: 'service',
    description: '快递收发 + 邮政服务',
    location: '二食堂西侧，宿舍 3 号楼对面',
    floorInfo: '',
    services: ['快递收发', '邮政', '寄件'],
    nearby: ['bld_canteen_2', 'bld_dorm_3'],
    walkFromCenter: 5,
    openTime: '09:00-20:00',
    tips: '取件码通过短信发送，货架 1-4 号在左区，5-8 号在右区',
  },
];

// ── getter ──

export function getCampusBuildings(type?: CampusBuilding['type']): CampusBuilding[] {
  if (type) return campusBuildings.filter(b => b.type === type);
  return campusBuildings;
}

export function findBuilding(query: string): CampusBuilding | undefined {
  const q = query.toLowerCase();
  return campusBuildings.find(b =>
    b.name.includes(q) || b.shortName.includes(q) || b.id.includes(q) ||
    b.services.some(s => s.includes(q)) || b.description.includes(q)
  );
}

export function searchBuildings(query: string): CampusBuilding[] {
  const q = query.toLowerCase();
  const terms = q.split(/\s+/).filter(t => t.length > 1);
  return campusBuildings.filter(b => {
    const text = (b.name + ' ' + b.shortName + ' ' + b.description + ' ' + b.services.join(' ') + ' ' + b.location).toLowerCase();
    return text.includes(q) || terms.some(t => text.includes(t));
  });
}

export function findBuildingsByService(service: string): CampusBuilding[] {
  const q = service.toLowerCase();
  // 关键词映射
  const serviceMap: Record<string, string[]> = {
    '打印': ['打印', '复印', '扫描'],
    '成绩单': ['成绩单', '成绩单打印', '教务处'],
    '补办': ['补办', '一卡通补办', '学生证补办'],
    '一卡通': ['一卡通补办', '一卡通充值', '校园卡圈存'],
    '充值': ['一卡通充值', '校园卡圈存'],
    '电费': ['电费充值', '充值'],
    '快递': ['快递收发'],
    '取钱': ['ATM取款'],
    '自习': ['自习', '电子阅览'],
    '看病': ['门诊', '急诊'],
    '运动': ['体育课', '运动', '健身房'],
    '体检': ['体检'],
    '心理咨询': ['心理咨询', '心理中心'],
    '借书': ['借还书'],
  };

  const terms = serviceMap[q] || [q];
  return campusBuildings.filter(b =>
    b.services.some(s => terms.some(t => s.includes(t)))
  );
}

// ============================================================
// 考试 & 成绩 & 教室模拟数据
// ============================================================

function dayOffset(d: number): string {
  const dt = new Date();
  dt.setDate(dt.getDate() + d);
  return dt.toISOString().split('T')[0];
}

// ── 考试安排 ──
const exams: Exam[] = [
  { id: 'ex_001', courseName: '高等数学（下）', date: dayOffset(5), time: '08:30-10:30', location: '教一 101', type: 'final', credits: 5, notes: '闭卷，带计算器' },
  { id: 'ex_002', courseName: '线性代数', date: dayOffset(7), time: '14:00-16:00', location: '教一 201', type: 'final', credits: 3 },
  { id: 'ex_003', courseName: '数据结构', date: dayOffset(9), time: '08:30-10:30', location: '教三 401', type: 'final', credits: 4, notes: '开卷，可带教材' },
  { id: 'ex_004', courseName: '操作系统', date: dayOffset(12), time: '14:00-16:00', location: '教三 402', type: 'final', credits: 4, notes: '闭卷' },
  { id: 'ex_005', courseName: '大学英语（四）', date: dayOffset(14), time: '08:30-10:30', location: '教二 301', type: 'final', credits: 2, notes: '含听力，带耳机' },
  { id: 'ex_006', courseName: '概率论', date: dayOffset(2), time: '09:00-11:00', location: '教一 301', type: 'quiz', credits: 3, notes: '随堂测验，占平时成绩30%' },
];

// ── 成绩 ──
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

// ── 教室 ──
const classrooms: Classroom[] = [
  { id: 'cr_01', name: '教一 101', building: '教一', floor: 1, capacity: 200, features: ['多媒体', '空调', '大屏'] },
  { id: 'cr_02', name: '教一 102', building: '教一', floor: 1, capacity: 120, features: ['多媒体', '空调'] },
  { id: 'cr_03', name: '教一 201', building: '教一', floor: 2, capacity: 150, features: ['多媒体', '空调', '大屏'] },
  { id: 'cr_04', name: '教一 301', building: '教一', floor: 3, capacity: 80, features: ['空调'] },
  { id: 'cr_05', name: '教一 302', building: '教一', floor: 3, capacity: 60, features: ['空调', '插座'] },
  { id: 'cr_06', name: '教一 401', building: '教一', floor: 4, capacity: 40, features: ['空调', '插座', '小教室'] },
  { id: 'cr_07', name: '教三 101', building: '教三', floor: 1, capacity: 80, features: ['机房', '空调', '插座', '多媒体'] },
  { id: 'cr_08', name: '教三 201', building: '教三', floor: 2, capacity: 80, features: ['机房', '空调', '插座', '多媒体'] },
  { id: 'cr_09', name: '教三 401', building: '教三', floor: 4, capacity: 100, features: ['多媒体', '空调', '大屏'] },
  { id: 'cr_10', name: '教三 402', building: '教三', floor: 4, capacity: 60, features: ['空调', '插座'] },
  { id: 'cr_11', name: '教三 501', building: '教三', floor: 5, capacity: 40, features: ['空调', '插座', '小教室'] },
  { id: 'cr_12', name: '教三 502', building: '教三', floor: 5, capacity: 30, features: ['空调', '插座', '小教室'] },
  { id: 'cr_13', name: '教二 101', building: '教二', floor: 1, capacity: 100, features: ['多媒体', '空调'] },
  { id: 'cr_14', name: '教二 201', building: '教二', floor: 2, capacity: 60, features: ['空调', '插座'] },
  { id: 'cr_15', name: '教二 301', building: '教二', floor: 3, capacity: 80, features: ['多媒体', '空调', '大屏', '语音'] },
];

// 教室占用状态模拟
function getOccupiedRoomsNow(): Set<string> {
  const hour = new Date().getHours();
  const occupiedByTime: Record<number, string[]> = {
    8: ['教一 101', '教一 102', '教三 401'],
    9: ['教一 101', '教一 102', '教三 401', '教二 101'],
    10: ['教一 201', '教三 101', '教三 201', '教二 301'],
    11: ['教一 201', '教三 101', '教二 301'],
    14: ['教一 301', '教三 401', '教三 402', '教二 101'],
    15: ['教一 301', '教三 401', '教二 101', '教二 201'],
    16: ['教一 302', '教三 501', '教二 201'],
  };
  return new Set(occupiedByTime[hour] || []);
}

function getNextOccupiedHour(roomName: string): string {
  const hour = new Date().getHours();
  const nextMap: Record<string, number> = {
    '教一 101': 10, '教一 102': 10, '教一 201': 12, '教一 301': 16, '教一 302': 18,
    '教一 401': 22, '教三 101': 12, '教三 201': 14, '教三 401': 16, '教三 402': 18,
    '教三 501': 22, '教三 502': 22, '教二 101': 11, '教二 201': 15, '教二 301': 14,
  };
  const next = nextMap[roomName];
  if (next && next > hour) return `${String(next).padStart(2, '0')}:00`;
  return '闭馆';
}

export function getClassrooms(): Classroom[] {
  return classrooms;
}

export function getFreeClassrooms(building?: string): { room: Classroom; nextOccupied: string }[] {
  const occupied = getOccupiedRoomsNow();
  const filtered = building ? classrooms.filter(c => c.building === building) : classrooms;
  return filtered
    .filter(c => !occupied.has(c.name))
    .map(c => ({ room: c, nextOccupied: getNextOccupiedHour(c.name) }));
}

// ── 考试相关 ──
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

// ── 成绩 / 绩点 ──
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
