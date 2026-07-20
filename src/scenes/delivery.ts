// ============================================================
// 快递 & 外卖 场景
// 追踪包裹状态、外卖配送、路线规划
// ============================================================

import {
  getPickupPoints,
  getPackages,
  getActivePackages,
  markPackagePicked,
  getDeliveryOrders,
  getActiveOrders,
  markOrderPicked,
} from '../data/mocks/index.js';
import { fetchAllCourses } from '../services/scheduleData.js';
import type {
  AgentResponse,
  Package,
  DeliveryOrder,
  PickupPoint,
  RoutePlan,
  RouteStep,
  Course,
} from '../models/index.js';

// ---- 快递查询 ----

/** 查所有快递状态 */
export async function handlePackageQuery(): Promise<AgentResponse> {
  const packages = getPackages();
  const active = packages.filter(p => p.status !== '已取件');
  const arrived = active.filter(p => p.status === '已到站');

  if (active.length === 0) {
    return {
      text: '当前没有待取的快递~ 🎉',
      suggestions: ['查外卖', '查课表'],
    };
  }

  const lines: string[] = [];
  if (arrived.length > 0) {
    lines.push(`📦 ${arrived.length} 个快递已到站：`);
    for (const pkg of arrived) {
      const point = getPickupPoints().find(pp => pp.id === pkg.pickupPoint);
      const pointName = point?.name || pkg.pickupPoint;
      lines.push(`  • ${pkg.carrier} - ${pkg.description || '包裹'} | ${pointName} | 取件码: ${pkg.pickupCode}`);
    }
  }

  const inTransit = active.filter(p => p.status === '运输中');
  if (inTransit.length > 0) {
    lines.push(`\n🚚 ${inTransit.length} 个还在路上：`);
    for (const pkg of inTransit) {
      const etaStr = pkg.estimatedArrival
        ? formatRelativeTime(new Date(pkg.estimatedArrival))
        : '未知';
      lines.push(`  • ${pkg.carrier} - ${pkg.description || '包裹'} | 预计 ${etaStr}`);
    }
  }

  return {
    text: lines.join('\n'),
    suggestions: arrived.length > 0 ? ['帮我规划取件路线', '取件码是多少'] : ['查外卖', '查课表'],
  };
}

/** 查外卖状态 */
export async function handleDeliveryQuery(): Promise<AgentResponse> {
  const orders = getActiveOrders();
  const now = new Date();

  if (orders.length === 0) {
    return {
      text: '当前没有进行中的外卖订单。想点个外卖试试？🍔',
      suggestions: ['查快递', '中午吃什么'],
    };
  }

  const lines: string[] = [];
  for (const order of orders) {
    const eta = new Date(order.estimatedDelivery);
    const remaining = Math.max(0, Math.ceil((eta.getTime() - now.getTime()) / 60000));

    let statusIcon = '';
    let statusText = '';
    switch (order.status) {
      case '已下单': statusIcon = '📝'; statusText = '已下单'; break;
      case '商家备餐': statusIcon = '👨‍🍳'; statusText = '商家备餐中'; break;
      case '配送中': statusIcon = '🛵'; statusText = '骑手配送中'; break;
      case '已送达': statusIcon = '✅'; statusText = '已送达，快去拿！'; break;
    }

    lines.push(`${statusIcon} ${order.platform} · ${order.restaurant}`);
    lines.push(`   状态: ${statusText} | 预计 ${remaining} 分钟后送达`);
    if (order.riderName) {
      lines.push(`   骑手: ${order.riderName} ${order.riderPhone}`);
    }
  }

  return {
    text: lines.join('\n'),
    suggestions: ['帮我规划取餐路线', '查快递'],
  };
}

// ---- 综合查询（快递 + 外卖） ----

export async function handleDeliverySummary(): Promise<AgentResponse> {
  const packages = getActivePackages();
  const orders = getActiveOrders();
  const arrived = packages.filter(p => p.status === '已到站');

  const parts: string[] = [];

  if (arrived.length > 0) {
    const pickupPoints = [...new Set(arrived.map(p => p.pickupPoint))];
    const pointNames = pickupPoints
      .map(id => getPickupPoints().find(pp => pp.id === id)?.name || id)
      .join('、');
    parts.push(`📦 ${arrived.length} 个快递待取（${pointNames}）`);
  }

  if (orders.length > 0) {
    const now = new Date();
    for (const order of orders) {
      const eta = new Date(order.estimatedDelivery);
      const remaining = Math.max(0, Math.ceil((eta.getTime() - now.getTime()) / 60000));
      if (order.status === '已送达') {
        parts.push(`🍔 外卖已送达，在校门口外卖架`);
      } else {
        parts.push(`🛵 外卖配送中，约 ${remaining} 分钟到`);
      }
    }
  }

  const inTransit = packages.filter(p => p.status === '运输中');
  if (inTransit.length > 0) {
    parts.push(`🚚 ${inTransit.length} 个快递还在路上`);
  }

  if (parts.length === 0) {
    return { text: '当前没有待取的外卖和快递~', suggestions: ['查课表', '查天气'] };
  }

  parts.unshift('📋 待取清单：');
  return {
    text: parts.join('\n'),
    suggestions: ['帮我规划路线', '查快递', '查外卖'],
  };
}

// ---- 路线规划 ----

/** 规划取件路线 */
export async function handleRoutePlan(
  currentLocation?: string,
  freeAfter?: string, // 如 "12:00" 表示这个时间之后有空
): Promise<AgentResponse> {
  const packages = getActivePackages().filter(p => p.status === '已到站');
  const orders = getActiveOrders().filter(o => o.status === '已送达');

  if (packages.length === 0 && orders.length === 0) {
    return { text: '没有需要取的东西。等快递到了或外卖到了再规划路线吧~' };
  }

  // 确定起点
  const now = new Date();
  const hour = now.getHours();

  let startPoint = '宿舍';
  let startTime = now;

  // 根据时间推断当前位置
  if (hour >= 8 && hour < 12) {
    // 可能在上课，检查课表
    const courses = fetchAllCourses().filter(c => {
      const weekday = now.getDay() === 0 ? 7 : now.getDay();
      return c.weekday === weekday;
    }).sort((a, b) => a.startTime.localeCompare(b.startTime));

    const currentCourse = courses.find(c => {
      return c.startTime <= formatTime(now) && c.endTime >= formatTime(now);
    });

    if (currentCourse) {
      startPoint = currentCourse.location.replace(/[0-9]+$/, ''); // "教三401" → "教三"
      startTime = parseTimeToDate(currentCourse.endTime, now);
    }
  }

  if (currentLocation) {
    startPoint = currentLocation;
  }

  if (freeAfter) {
    startTime = parseTimeToDate(freeAfter, now);
    if (startTime < now) startTime = now;
  }

  // 收集所有目标点
  const allPoints = getPickupPoints();
  const targets: { point: PickupPoint; purpose: string; priority: number }[] = [];

  for (const pkg of packages) {
    const point = allPoints.find(pp => pp.id === pkg.pickupPoint);
    if (point) {
      targets.push({
        point,
        purpose: `取快递: ${pkg.carrier} ${pkg.description || ''} (${pkg.pickupCode})`,
        priority: 0,
      });
    }
  }

  for (const order of orders) {
    const point = allPoints.find(pp => pp.id === order.pickupPoint);
    if (point) {
      targets.push({
        point,
        purpose: `取外卖: ${order.platform} ${order.restaurant}`,
        priority: 10, // 外卖优先（凉了不好吃）
      });
    }
  }

  // 按优先级排序，外卖 > 快递，合并同点位
  const mergedTargets: { point: PickupPoint; purposes: string[] }[] = [];
  for (const t of targets.sort((a, b) => b.priority - a.priority)) {
    const existing = mergedTargets.find(m => m.point.id === t.point.id);
    if (existing) {
      existing.purposes.push(t.purpose);
    } else {
      mergedTargets.push({ point: t.point, purposes: [t.purpose] });
    }
  }

  // 贪心路径：最近邻
  const commuteMatrix = buildCommuteMatrix(startPoint, allPoints);

  const routeSteps: RouteStep[] = [];
  let current = startPoint;
  let currentTime = new Date(startTime);
  let stepNum = 0;

  // 排序：先取时间限制短的（会关门的），再取时间限制长的
  const sortedTargets = mergedTargets.sort((a, b) => {
    const aClose = parseTime(a.point.closeTime);
    const bClose = parseTime(b.point.closeTime);
    return aClose - bClose;
  });

  // 检查菜鸟驿站是否快关门
  const closingSoon = sortedTargets.filter(t => {
    const closeMin = parseTime(t.point.closeTime);
    const nowMin = currentTime.getHours() * 60 + currentTime.getMinutes();
    return closeMin - nowMin < 60; // 一小时内关门
  });

  const tips: string[] = [];

  if (closingSoon.length > 0) {
    tips.push(`⚠️ ${closingSoon.map(t => t.point.name).join('、')} 一小时内关门，建议先去！`);
  }

  // 计算路线
  const remaining = [...sortedTargets];
  const visited = new Set<string>();

  while (remaining.length > 0) {
    stepNum++;

    // 找最近的下一个目标
    let bestTarget = remaining[0];
    let bestTime = Infinity;

    for (const target of remaining) {
      const walkMin = target.point.commuteFrom[current] ?? estimateWalk(current, target.point);
      if (walkMin < bestTime) {
        bestTime = walkMin;
        bestTarget = target;
      }
    }

    remaining.splice(remaining.indexOf(bestTarget), 1);
    visited.add(bestTarget.point.id);

    const walkMin = bestTarget.point.commuteFrom[current] ?? estimateWalk(current, bestTarget.point);

    const step: RouteStep = {
      step: stepNum,
      from: current,
      to: bestTarget.point.name,
      purpose: bestTarget.purposes.join('; '),
      walkMinutes: walkMin,
      action: '取件',
    };

    routeSteps.push(step);
    current = bestTarget.point.name;
    currentTime = new Date(currentTime.getTime() + walkMin * 60000);
  }

  // 回家路线（可选）
  const homeWalk = allPoints.find(p => p.id === 'cainiao')?.commuteFrom[current]
    ?? allPoints.find(p => p.id === 'gate')?.commuteFrom[current]
    ?? estimateWalk(current, { id: '', name: '宿舍', type: '综合', location: '', openTime: '', closeTime: '', commuteFrom: {} });

  const totalMinutes = routeSteps.reduce((sum, s) => sum + s.walkMinutes, 0) + homeWalk;

  // 格式化输出
  const timeLabel = formatTime(startTime);
  const endTime = new Date(startTime.getTime() + totalMinutes * 60000);
  const endTimeLabel = formatTime(endTime);

  const routeLines: string[] = [];
  routeLines.push(`📍 从 ${startPoint} 出发 (${timeLabel})：\n`);

  for (const step of routeSteps) {
    routeLines.push(`  ${step.step}. → ${step.to}（步行 ${step.walkMinutes} 分钟）`);
    routeLines.push(`     ${step.purpose}`);
  }
  routeLines.push(`  → 🏠 回宿舍（步行 ${homeWalk} 分钟）`);

  routeLines.push(`\n⏱ 全程约 ${totalMinutes} 分钟，预计 ${endTimeLabel} 回到宿舍`);

  if (tips.length > 0) {
    routeLines.push(`\n${tips.join('\n')}`);
  }

  // 天气提醒
  routeLines.push('\n💡 出发前可以用「查天气」看看要不要带伞~');

  const plan: RoutePlan = {
    totalMinutes,
    startTime: timeLabel,
    endTime: endTimeLabel,
    steps: routeSteps,
    tips,
  };

  return {
    text: routeLines.join('\n'),
    suggestions: ['我取完了', '查天气', '先吃饭再去'],
  };
}

// ---- 标记已取 ----

/** 标记快递或外卖已取 */
export async function handlePickupComplete(text: string): Promise<AgentResponse> {
  let pickedItems: string[] = [];

  // 试匹配快递
  const packages = getActivePackages().filter(p => p.status === '已到站');
  for (const pkg of packages) {
    if (text.includes(pkg.carrier) || text.includes(pkg.trackingId) || text.includes('快递')) {
      markPackagePicked(pkg.trackingId);
      pickedItems.push(`${pkg.carrier} ${pkg.description || '快递'}`);
    }
  }

  // 试匹配外卖
  const orders = getActiveOrders().filter(o => o.status === '已送达');
  for (const order of orders) {
    if (text.includes(order.platform) || text.includes('外卖') || text.includes(order.restaurant)) {
      markOrderPicked(order.orderId);
      pickedItems.push(`${order.platform} ${order.restaurant}`);
    }
  }

  // 如果用户说「都取完了」
  if ((text.includes('都') || text.includes('全部') || text.includes('了')) && pickedItems.length === 0) {
    for (const pkg of packages) markPackagePicked(pkg.trackingId);
    for (const order of orders) markOrderPicked(order.orderId);
    pickedItems = [
      ...packages.map(p => `${p.carrier} ${p.description || '快递'}`),
      ...orders.map(o => `${o.platform} ${o.restaurant}`),
    ];
  }

  if (pickedItems.length === 0) {
    return { text: '没找到对应的快递或外卖，可以说"顺丰取完了"或"美团取完了"。' };
  }

  // 检查还有没有剩余的
  const remainingPkg = getActivePackages().filter(p => p.status === '已到站');
  const remainingOrder = getActiveOrders().filter(o => o.status === '已送达');
  const totalRemaining = remainingPkg.length + remainingOrder.length;

  let suffix = '';
  if (totalRemaining > 0) {
    suffix = `\n还有 ${totalRemaining} 件没拿：${
      [
        ...remainingPkg.map(p => `${p.carrier}(${getPickupPoints().find(pp => pp.id === p.pickupPoint)?.name || p.pickupPoint})`),
        ...remainingOrder.map(o => o.restaurant),
      ].join('、')
    }。需要继续吗？`;
  } else {
    suffix = '\n全部搞定了！🎉';
  }

  return {
    text: `✅ 已标记取走：${pickedItems.join('、')}${suffix}`,
    suggestions: totalRemaining > 0 ? ['继续取', '不管了回宿舍'] : ['查课表', '中午吃什么'],
  };
}

// ---- 工具函数 ----

function formatTime(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function parseTime(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function parseTimeToDate(time: string, baseDate: Date): Date {
  const [h, m] = time.split(':').map(Number);
  const d = new Date(baseDate);
  d.setHours(h, m, 0, 0);
  return d;
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffHours = Math.floor(diffMs / 3600000);
  const diffMinutes = Math.floor((diffMs % 3600000) / 60000);

  if (diffHours < 0) return '已到达';
  if (diffHours === 0) return `${diffMinutes} 分钟后`;
  if (diffHours < 24) return `今天 ${formatTime(date)}`;
  return `明天 ${formatTime(date)}`;
}

function estimateWalk(from: string, to: PickupPoint): number {
  // 找不到精确数据时估算：默认 8 分钟
  const known: Record<string, number> = {
    '教三': 8,
    '教二': 10,
    '教五': 12,
    '宿舍': 6,
    '图书馆': 8,
    '二食堂': 7,
    '一食堂': 8,
    '体育馆': 15,
  };
  return known[from] || 8;
}

function buildCommuteMatrix(startPoint: string, points: PickupPoint[]): Record<string, Record<string, number>> {
  const matrix: Record<string, Record<string, number>> = {};
  matrix[startPoint] = {};
  for (const p of points) {
    matrix[startPoint][p.name] = p.commuteFrom[startPoint] ?? estimateWalk(startPoint, p);
  }
  for (const p1 of points) {
    matrix[p1.name] = {};
    for (const p2 of points) {
      if (p1.id !== p2.id) {
        matrix[p1.name][p2.name] = p2.commuteFrom[p1.name] ?? estimateWalk(p1.name, p2);
      }
    }
  }
  return matrix;
}
