// ============================================================
// 场景三：一卡通管家
// 余额查询 + 消费分析 + 低余额提醒 + 异常消费提醒
// ============================================================

import { orchestrate } from '../core/orchestrator/engine.js';
import { getCardState, deductCardBalance } from '../data/mock.js';
import { getUserHabits } from '../core/memory/engine.js';
import type { AgentResponse, OrchestrationTask, CardState, CardTransaction } from '../models/index.js';

/**
 * 查询一卡通余额与消费概况
 */
export async function handleCardQuery(query: string): Promise<{ response: AgentResponse; task: OrchestrationTask }> {
  const task = await orchestrate(
    'card',
    'user_asks_card',
    [
      {
        mode: 'serial',
        actions: [
          {
            name: 'fetchCardState',
            execute: async () => getCardState(),
            fallback: '一卡通信息暂时查不到，请稍后再试',
          },
        ],
      },
    ],
    (results) => {
      const card = results.get('fetchCardState') as CardState | undefined;
      if (!card) return '一卡通信息暂时查不到，请稍后再试。';

      const habits = getUserHabits();

      // 判断查询意图
      if (query.includes('消费') || query.includes('花了') || query.includes('这周') || query.includes('今天')) {
        return buildSpendingReport(card, query);
      }

      // 基础余额查询
      const balanceStatus =
        card.balance > 30 ? '很充裕'
        : card.balance > 15 ? '正常'
        : card.balance > 5 ? '偏低，建议充值'
        : '快不够用了，赶紧充值！';

      const recentTx = card.transactions.slice(0, 3);
      const recentStr = recentTx
        .map((tx) => `${tx.time.slice(11, 16)} ${tx.location} ${tx.category} -${tx.amount.toFixed(1)}元`)
        .join('\n');

      return `一卡通余额 ${card.balance.toFixed(1)} 元，状态：${balanceStatus}。
今日消费 ${card.todaySpent.toFixed(1)} 元，本周消费 ${card.weekSpent.toFixed(1)} 元。
最近消费：
${recentStr}`;
    },
  );

  return {
    response: {
      text: task.result.summary,
      suggestions: ['充值', '查消费明细', '设低余额提醒'],
    },
    task,
  };
}

function buildSpendingReport(card: CardState, query: string): string {
  // 按类别汇总
  const byCategory = new Map<string, number>();
  for (const tx of card.transactions) {
    byCategory.set(tx.category, (byCategory.get(tx.category) || 0) + tx.amount);
  }

  const categoryStr = Array.from(byCategory.entries())
    .map(([cat, amt]) => `${cat} ${amt.toFixed(1)}元`)
    .join(' | ');

  return `消费概况：
总余额 ${card.balance.toFixed(1)} 元
今日消费 ${card.todaySpent.toFixed(1)} 元
本周消费 ${card.weekSpent.toFixed(1)} 元
分类汇总：${categoryStr}`;
}

/**
 * 低余额检查（供触发器调用）
 */
export function checkLowBalance(threshold?: number): {
  isLow: boolean;
  balance: number;
  message: string;
} {
  const card = getCardState();
  const thresh = threshold || getUserHabits().showerThreshold + 10; // 默认阈值：洗澡门槛 + 10
  const isLow = card.balance < thresh;

  return {
    isLow,
    balance: card.balance,
    message: isLow
      ? `⚠️ 一卡通余额仅剩 ${card.balance.toFixed(1)} 元，建议尽快充值。`
      : `一卡通余额 ${card.balance.toFixed(1)} 元，正常。`,
  };
}
