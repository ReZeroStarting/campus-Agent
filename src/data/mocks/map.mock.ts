// ============================================================
// 校园地图模拟数据
// ============================================================

import type { CampusBuilding } from '../../models/index.js';

const campusBuildings: CampusBuilding[] = [
  {
    id: 'bld_teaching_1', name: '第一教学楼', shortName: '教一', type: 'teaching',
    description: '主教学楼，大课和公共课都在这里', location: '校园正门东侧',
    floorInfo: '共 6 层，1-2 层为大阶梯教室，3-6 层为普通教室',
    services: ['上课', '自习', '考试'],
    nearby: ['bld_teaching_2', 'bld_library', 'bld_canteen_1'],
    walkFromCenter: 2, openTime: '07:00-22:00',
  },
  {
    id: 'bld_teaching_2', name: '第二教学楼', shortName: '教二', type: 'teaching',
    description: '小班教学为主，外语学院和人文学院常用', location: '校园正门西侧，教一对面',
    floorInfo: '共 5 层，每层 8 间教室，顶楼有语音室',
    services: ['上课', '自习', '考试', '语音课'],
    nearby: ['bld_teaching_1', 'bld_admin', 'bld_canteen_1'],
    walkFromCenter: 3, openTime: '07:00-22:00',
  },
  {
    id: 'bld_teaching_3', name: '第三教学楼', shortName: '教三', type: 'teaching',
    description: '计算机学院和软件学院主要教学楼', location: '校园东区，实验楼A栋旁',
    floorInfo: '共 7 层，1-3 层机房，4-7 层多媒体教室',
    services: ['上课', '自习', '机考', '计算机实验'],
    nearby: ['bld_lab_a', 'bld_canteen_2', 'bld_dorm_3'],
    walkFromCenter: 5, openTime: '07:00-22:30',
  },
  {
    id: 'bld_lab_a', name: '实验楼 A 栋', shortName: '实验楼A', type: 'lab',
    description: '计算机/电子/通信实验中心', location: '校园东区，教三北侧',
    floorInfo: '共 8 层，1-2 层基础实验室，3-5 层专业实验室，6-8 层科研/研究生',
    services: ['实验课', '科研', '课程设计', '服务器机房'],
    nearby: ['bld_teaching_3', 'bld_canteen_2', 'bld_dorm_3'],
    walkFromCenter: 6, openTime: '08:00-22:00（刷卡进出）', tips: '门禁需刷一卡通，访客需登记',
  },
  {
    id: 'bld_lab_b', name: '实验楼 B 栋', shortName: '实验楼B', type: 'lab',
    description: '物理/化学/生物基础实验中心', location: '校园西区，靠近南操场',
    floorInfo: '共 5 层，1-2 层物理实验室，3-4 层化学实验室，5 层生物实验室',
    services: ['实验课', '基础实验', '开放实验'],
    nearby: ['bld_sports', 'bld_canteen_1', 'bld_dorm_1'],
    walkFromCenter: 8, openTime: '08:00-18:00（化学实验室需防护装备）',
  },
  {
    id: 'bld_library', name: '图书馆', shortName: '图书馆', type: 'library',
    description: '校园地标，藏书 200 万册，自习圣地', location: '校园中心，正门直走 200 米',
    floorInfo: '共 5 层，1 层大厅/咖啡厅/还书处，2-3 层社科/自科阅览室，4 层电子阅览室/自习区，5 层古籍/特藏',
    services: ['借还书', '自习', '电子阅览', '打印复印', '研讨间预约'],
    nearby: ['bld_teaching_1', 'bld_teaching_2', 'bld_admin', 'bld_canteen_1'],
    walkFromCenter: 0, openTime: '06:30-22:30（考试周延长至 23:30）',
    tips: '三楼东区空调近期故障，建议去四楼自习',
  },
  {
    id: 'bld_canteen_1', name: '一食堂', shortName: '一食堂', type: 'canteen',
    description: '靠近教学区，下课高峰人多', location: '校园中心偏北，教学楼和图书馆之间',
    floorInfo: '共 3 层，1 楼大众餐，2 楼风味窗口，3 楼教工餐厅/清真',
    services: ['早中晚餐', '清真窗口', '水吧', '一卡通充值'],
    nearby: ['bld_teaching_1', 'bld_teaching_2', 'bld_library'],
    walkFromCenter: 1, openTime: '06:30-09:00 / 11:00-13:00 / 17:00-19:30',
    tips: '中午 12:00-12:30 是高峰期，建议错峰',
  },
  {
    id: 'bld_canteen_2', name: '二食堂', shortName: '二食堂', type: 'canteen',
    description: '靠近宿舍区，环境好二楼窗口多', location: '校园东区，宿舍 3-6 号楼附近',
    floorInfo: '共 2 层，1 楼大众餐/早餐，2 楼各地风味/麻辣烫/黄焖鸡',
    services: ['早中晚餐', '夜宵', '奶茶店', '一卡通充值'],
    nearby: ['bld_teaching_3', 'bld_lab_a', 'bld_dorm_3', 'bld_dorm_4'],
    walkFromCenter: 5, openTime: '06:30-21:30（夜宵到 21:00）',
    tips: '二楼黄焖鸡是招牌，人均 10-15 元',
  },
  {
    id: 'bld_dorm_1', name: '宿舍 1-2 号楼', shortName: '1-2号楼', type: 'dormitory',
    description: '本科男生宿舍，6 人间上床下桌', location: '校园西区，靠近南操场',
    floorInfo: '各 6 层，每层 20 间，公共卫浴',
    services: ['住宿', '洗衣房', '开水房', '自动售货机'],
    nearby: ['bld_sports', 'bld_lab_b', 'bld_canteen_1'],
    walkFromCenter: 8, tips: '一楼有洗衣房，扫码洗衣 3 元/次',
  },
  {
    id: 'bld_dorm_3', name: '宿舍 3-4 号楼', shortName: '3-4号楼', type: 'dormitory',
    description: '本科女生宿舍，4 人间独立卫浴', location: '校园东区，靠近二食堂',
    floorInfo: '各 7 层，每层 16 间，独立卫浴',
    services: ['住宿', '洗衣房', '开水房', '快递柜'],
    nearby: ['bld_canteen_2', 'bld_teaching_3', 'bld_lab_a'],
    walkFromCenter: 5,
  },
  {
    id: 'bld_dorm_5', name: '宿舍 5-6 号楼', shortName: '5-6号楼', type: 'dormitory',
    description: '研究生宿舍，2/3 人间', location: '校园东南角，环境安静',
    floorInfo: '各 12 层电梯楼，每层 12 间，独立卫浴+阳台',
    services: ['住宿', '洗衣房', '快递柜', '自习室', '健身房'],
    nearby: ['bld_teaching_3', 'bld_lab_a', 'bld_hospital'],
    walkFromCenter: 10,
  },
  {
    id: 'bld_admin', name: '行政楼', shortName: '行政楼', type: 'admin',
    description: '学校行政事务办理中心', location: '校园中心偏西，图书馆西侧',
    floorInfo: '共 4 层，1 楼综合服务大厅，2 楼教务处/学生处，3 楼财务处/后勤，4 楼校领导办公室',
    services: ['一卡通补办', '成绩单打印', '学籍证明', '学生证补办', '宿舍报修', '电费充值'],
    nearby: ['bld_library', 'bld_teaching_2', 'bld_canteen_1'],
    walkFromCenter: 2, openTime: '08:30-12:00 / 14:00-17:30（工作日）',
    tips: '成绩单打印在 2 楼 204，一卡通补办在 1 楼大厅右侧',
  },
  {
    id: 'bld_sports', name: '体育馆 & 南操场', shortName: '体育馆', type: 'sports',
    description: '室内体育馆+室外标准操场', location: '校园西南角',
    floorInfo: '体育馆共 3 层：1 楼篮球/羽毛球，2 楼乒乓球/健身房，3 楼舞蹈/瑜伽室。南操场为标准 400 米跑道+足球场',
    services: ['体育课', '体测', '运动', '比赛', '露天电影'],
    nearby: ['bld_dorm_1', 'bld_lab_b', 'bld_canteen_1'],
    walkFromCenter: 7, openTime: '体育馆 08:00-21:30 / 操场 06:00-22:00',
    tips: '健身房免费，带一卡通登记即可',
  },
  {
    id: 'bld_hospital', name: '校医院', shortName: '校医院', type: 'hospital',
    description: '校内医疗，急诊 24 小时', location: '校园东南角，宿舍 5-6 号楼旁',
    floorInfo: '共 3 层，1 楼门诊/药房/急诊，2 楼输液/观察，3 楼体检中心/心理中心',
    services: ['门诊', '急诊', '医保报销', '体检', '心理咨询'],
    nearby: ['bld_dorm_5'], walkFromCenter: 11,
    openTime: '门诊 08:30-17:30 / 急诊 24 小时', tips: '记得带一卡通和学生证，挂号费 1 元',
  },
  {
    id: 'bld_service_print', name: '校园打印店', shortName: '打印店', type: 'service',
    description: '打印/复印/装订/论文排版', location: '图书馆一楼大厅左侧',
    floorInfo: '',
    services: ['打印', '复印', '扫描', '装订', '论文排版', '证件照'],
    nearby: ['bld_library', 'bld_teaching_1'], walkFromCenter: 0,
    openTime: '08:00-21:00', tips: '黑白 0.1 元/页，彩色 1 元/页，论文装订 5 元',
  },
  {
    id: 'bld_service_bank', name: '校园银行网点', shortName: '银行', type: 'service',
    description: 'ATM + 人工柜台', location: '一食堂一楼南侧',
    floorInfo: '',
    services: ['ATM取款', '存取款', '校园卡圈存'],
    nearby: ['bld_canteen_1', 'bld_teaching_1'], walkFromCenter: 1,
    openTime: 'ATM 24小时 / 柜台 09:00-16:30',
  },
  {
    id: 'bld_service_post', name: '菜鸟驿站 + 邮局', shortName: '菜鸟驿站', type: 'service',
    description: '快递收发 + 邮政服务', location: '二食堂西侧，宿舍 3 号楼对面',
    floorInfo: '',
    services: ['快递收发', '邮政', '寄件'],
    nearby: ['bld_canteen_2', 'bld_dorm_3'], walkFromCenter: 5,
    openTime: '09:00-20:00', tips: '取件码通过短信发送，货架 1-4 号在左区，5-8 号在右区',
  },
];

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
  return campusBuildings.filter(b => b.services.some(s => terms.some(t => s.includes(t))));
}
