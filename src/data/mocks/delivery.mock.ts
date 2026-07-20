// ============================================================
// 快递 & 外卖模拟数据
// ============================================================

import type { PickupPoint, Package, DeliveryOrder } from '../../models/index.js';

// ── 取件点 ──

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

// ── 快递包裹 ──

const now = new Date();
const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

const packages: Package[] = [
  {
    trackingId: 'SF1234567890',
    carrier: '顺丰',
    status: '已到站',
    description: '机械键盘（104键 青轴）',
    arrivedAt: new Date(today.getTime() - 2 * 3600000).toISOString(),
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
    estimatedArrival: new Date(today.getTime() + 86400000).toISOString(),
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

// ── 外卖订单 ──

const deliveryETA = new Date(today.getTime() + 15 * 60000);

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
