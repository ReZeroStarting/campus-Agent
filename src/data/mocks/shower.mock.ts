// ============================================================
// 澡堂模拟数据
// ============================================================

import type { ShowerState } from '../../models/index.js';

let showerState: ShowerState = {
  balance: 3.2,
  pricePerShower: 2.5,
  crowdLevel: '空闲',
};

export function getShowerState(): ShowerState {
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
