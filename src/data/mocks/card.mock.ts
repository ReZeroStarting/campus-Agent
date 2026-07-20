// ============================================================
// 一卡通模拟数据
// ============================================================

import type { CardState } from '../../models/index.js';

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
