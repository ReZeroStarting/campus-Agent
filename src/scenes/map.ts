// ============================================================
// 校园地图场景 —— 建筑定位 + 服务反查 + 简单导航
// ============================================================

import {
  getCampusBuildings,
  findBuilding,
  searchBuildings,
  findBuildingsByService,
} from '../data/mocks/index.js';
import type { CampusBuilding } from '../models/index.js';

const BUILDING_NAME_ALIAS: Record<string, string> = {
  '教一': '教一',
  '教二': '教二',
  '教三': '教三',
  '一教': '教一',
  '二教': '教二',
  '三教': '教三',
  '实验楼a': '实验楼A',
  '实验楼b': '实验楼B',
  'a栋': '实验楼A',
  'b栋': '实验楼B',
};

function formatBuilding(b: CampusBuilding, showNearby = true): string {
  const typeLabel: Record<string, string> = {
    teaching: '🏫 教学楼',
    lab: '🔬 实验楼',
    library: '📚 图书馆',
    canteen: '🍽️ 食堂',
    dormitory: '🏠 宿舍',
    admin: '🏢 行政楼',
    sports: '🏟️ 体育馆',
    hospital: '🏥 校医院',
    service: '📍 服务点',
  };

  const lines = [
    `${typeLabel[b.type] || ''} · ${b.name}`,
    `   📍 ${b.location}`,
    `   📝 ${b.description}`,
    `   🏗️ ${b.floorInfo}`,
  ];

  if (b.services.length > 0) {
    lines.push(`   🛎️ 服务：${b.services.join('、')}`);
  }

  if (b.openTime) {
    lines.push(`   🕐 ${b.openTime}`);
  }

  if (b.tips) {
    lines.push(`   💡 ${b.tips}`);
  }

  if (showNearby && b.nearby.length > 0) {
    const nearbyNames = b.nearby
      .map(id => getCampusBuildings().find(b2 => b2.id === id))
      .filter(Boolean)
      .map(b2 => b2!.shortName);
    if (nearbyNames.length > 0) {
      lines.push(`   🧭 附近：${nearbyNames.join('、')}`);
    }
  }

  return lines.join('\n');
}

function formatWalkTime(from: CampusBuilding, to: CampusBuilding): string {
  const diff = Math.abs(from.walkFromCenter - to.walkFromCenter);
  if (diff === 0) return '就在隔壁';
  if (diff <= 2) return `步行约 ${Math.max(1, diff)} 分钟`;
  if (diff <= 5) return `步行约 ${diff} 分钟`;
  return `步行约 ${diff} 分钟，有点远，可以骑共享单车`;
}

// ---- 查询建筑位置 ----
export function handleBuildingQuery(text: string): { text: string; suggestions: string[] } {
  // 剥离常见问句后缀，提取核心名称
  const cleanText = text.replace(/(在哪|在哪里|怎么走|怎么去|在什么位置|在什么地方|远不远|多远)$/, '').trim();
  const bld = findBuilding(cleanText) || findBuilding(text);
  if (!bld) {
    const results = searchBuildings(text);
    if (results.length === 0) {
      return { text: `没找到「${text}」，试试说「教三在哪」或「图书馆」`, suggestions: ['教三在哪', '图书馆在哪', '去哪打印'] };
    }
    const lines = results.slice(0, 3).map(b => `• ${b.shortName}（${b.name}）— ${b.description}`);
    return {
      text: `找到 ${results.length} 个相关结果：\n${lines.join('\n')}`,
      suggestions: results.slice(0, 3).map(b => `${b.shortName}在哪`),
    };
  }

  // 有精确匹配
  let extra = '';
  const session = getCurrentLocation();
  if (session) {
    extra = `\n\n📍 你当前在 ${session.shortName}，${formatWalkTime(session, bld)}`;
  }

  return {
    text: formatBuilding(bld, true) + extra,
    suggestions: ['怎么走', '附近有什么', '回当前'],
  };
}

// ---- 查询去哪做某事 ----
export function handleServiceQuery(text: string): { text: string; suggestions: string[] } {
  // 提取服务关键词
  const serviceKeywords = ['打印', '成绩单', '补办', '一卡通', '充值', '电费', '快递', '取钱', '自习', '看病', '运动', '体检', '心理咨询', '借书'];
  const matchedService = serviceKeywords.find(k => text.includes(k));

  if (!matchedService) {
    return { text: '你想办理什么？比如：去哪里打印、去哪补办一卡通、去哪打成绩单', suggestions: ['去哪打印', '去哪补办一卡通', '去哪自习'] };
  }

  const buildings = findBuildingsByService(matchedService);
  if (buildings.length === 0) {
    return { text: `暂时没找到能办理「${matchedService}」的地点，问问别的？`, suggestions: ['去哪打印', '去哪取快递', '一卡通在哪补办'] };
  }

  const lines = buildings.map(b => {
    const serviceMatch = b.services.filter(s => s.includes(matchedService) || matchedService.includes(s));
    return formatBuilding(b, false) + (serviceMatch.length > 0 ? `\n   ✅ 可办理：${serviceMatch.join('、')}` : '');
  });

  return {
    text: `🔍 「${matchedService}」可以去：\n\n${lines.join('\n\n')}`,
    suggestions: buildings.map(b => `${b.shortName}怎么去`),
  };
}

// ---- 查询怎么走 ----
export function handleRouteQuery(text: string): { text: string; suggestions: string[] } {
  // 尝试解析 "从X到Y" 格式
  const match = text.match(/(从|在)(\S+?)(到|去)(\S+)/);
  if (match) {
    const fromBld = findBuilding(match[2]);
    const toBld = findBuilding(match[4]);
    if (fromBld && toBld) {
      return formatRoute(fromBld, toBld);
    }
  }

  // 从 session 获取当前位置，文本中提取目标建筑
  const from = getCurrentLocation();
  // 剥离 "到" "去" "怎么走" 等前后缀
  const cleanText = text.replace(/^(到|去|从)/, '').replace(/(怎么走|怎么去|怎么回|走过去)$/, '').trim();
  const to = findBuilding(cleanText);

  if (!to) {
    return { text: '你想从哪出发、去哪？试试「从教三到图书馆怎么走」', suggestions: ['从教三到图书馆', '教三怎么去', '我现在在哪'] };
  }

  if (!from) {
    return {
      text: `${formatBuilding(to, true)}\n\n没有当前位置信息。说「我在教三」设置位置，或者直接说「从教三到${to.shortName}」`,
      suggestions: [`从教三到${to.shortName}`, '我在教三'],
    };
  }

  return formatRoute(from, to);
}

function formatRoute(from: CampusBuilding, to: CampusBuilding): { text: string; suggestions: string[] } {
  if (from.id === to.id) {
    return { text: `你已经到 ${to.name} 了！`, suggestions: ['附近有什么', '回宿舍怎么走'] };
  }

  const walkTime = formatWalkTime(from, to);
  const lines = [
    `🧭 从 ${from.name} 到 ${to.name}：`,
    '',
    `  📍 出发：${from.name}（${from.location}）`,
    `  📍 到达：${to.name}（${to.location}）`,
    `  ⏱ ${walkTime}`,
  ];

  // 看看路上经过什么
  const sharedNearby = from.nearby.filter(id => to.nearby.includes(id));
  if (sharedNearby.length > 0) {
    const names = sharedNearby
      .map(id => getCampusBuildings().find(b => b.id === id))
      .filter(Boolean)
      .map(b => b!.shortName);
    if (names.length > 0) {
      lines.push(`  🚶 途经：${names.join('、')}`);
    }
  }

  if (to.services.some(s => s.includes('餐') || s.includes('食堂'))) {
    lines.push(`  💡 到了正好吃个饭~`);
  }

  return {
    text: lines.join('\n'),
    suggestions: ['附近有什么', '回宿舍怎么走', `我在${to.shortName}`],
  };
}

// ---- 综合入口 ----
export function handleMapQuery(text: string): { text: string; suggestions: string[] } {
  // 服务查询优先
  if (text.includes('去哪') || text.includes('哪里') || text.includes('什么地方') || text.includes('哪能') ||
      text.includes('打印') || text.includes('补办') || text.includes('成绩单') || text.includes('充值') || text.includes('电费') || text.includes('看病') || text.includes('自习')) {
    return handleServiceQuery(text);
  }

  // "怎么走" / "怎么去" → 路线查询
  if (text.includes('怎么走') || text.includes('怎么去') || text.includes('怎么回') || text.includes('走过去') || text.includes('从') && text.includes('到')) {
    return handleRouteQuery(text);
  }

  // 特定建筑查询
  // 教一~教六 / 实验楼 / 图书馆 / 食堂 / 宿舍 / 行政楼 / 校医院 / 体育馆
  const cleanText = text.replace(/(在哪|在哪里|怎么走|怎么去|在什么位置|在什么地方|远不远|多远)$/, '').trim();
  const bld = findBuilding(cleanText) || findBuilding(text);
  if (bld) {
    return handleBuildingQuery(text);
  }

  // 搜索
  const results = searchBuildings(cleanText);
  if (results.length > 0) {
    return handleBuildingQuery(text);
  }

  // 默认：校园速览
  const allBuildings = getCampusBuildings();
  const typeSummary = [
    { type: 'teaching' as const, label: '🏫 教学楼' },
    { type: 'lab' as const, label: '🔬 实验楼' },
    { type: 'library' as const, label: '📚 图书馆' },
    { type: 'canteen' as const, label: '🍽️ 食堂' },
    { type: 'dormitory' as const, label: '🏠 宿舍' },
    { type: 'admin' as const, label: '🏢 行政楼' },
    { type: 'sports' as const, label: '🏟️ 体育馆' },
    { type: 'hospital' as const, label: '🏥 校医院' },
    { type: 'service' as const, label: '📍 服务点' },
  ];

  const lines = typeSummary.map(t => {
    const buildings = allBuildings.filter(b => b.type === t.type);
    return `${t.label}：${buildings.map(b => b.shortName).join('、')}`;
  });

  return {
    text: `🗺️ 校园地图速览：\n\n${lines.join('\n')}\n\n说「教三在哪」查看建筑详情，说「去哪打印」查找服务地点`,
    suggestions: ['教三在哪', '去哪打印', '去哪补办一卡通', '图书馆怎么走'],
  };
}

// ---- 简易位置记忆 ----
// 记录用户在对话中提到的位置

let currentLocationId: string | null = null;

export function getCurrentLocation(): CampusBuilding | undefined {
  if (!currentLocationId) return undefined;
  return getCampusBuildings().find(b => b.id === currentLocationId);
}

export function setCurrentLocation(buildingId: string): boolean {
  const bld = getCampusBuildings().find(b => b.id === buildingId);
  if (bld) {
    currentLocationId = buildingId;
    return true;
  }
  return false;
}

export function clearCurrentLocation(): void {
  currentLocationId = null;
}
