// ============================================================
// 场景一：洗澡助手
// 查询余额 + 拥挤度 → 给出建议
// ============================================================

import { orchestrate } from '../core/orchestrator/engine.js';
import { getShowerState, deductShowerBalance } from '../data/mock.js';
import { getUserHabits, getLongTermKnowledge } from '../core/memory/engine.js';
import type { AgentResponse, OrchestrationTask, ShowerState } from '../models/index.js';

/**
 * 处理「我要洗澡」意图
 */
export async function handleShowerIntent(): Promise<{ response: AgentResponse; task: OrchestrationTask }> {
  const task = await orchestrate(
    'shower',
    'user_says_shower',
    [
      {
        mode: 'parallel',
        actions: [
          {
            name: 'checkShowerBalance',
            execute: async () => getShowerState(),
            fallback: '暂时查不到余额，建议直接去澡堂看看',
          },
          {
            name: 'checkCrowdLevel',
            execute: async () => getShowerState(),
            fallback: null, // 拥挤度失败不阻断
          },
        ],
      },
    ],
    (results) => {
      const showerData = results.get('checkShowerBalance') as ShowerState | undefined;
      if (!showerData) {
        return '澡堂信息暂时查不到，建议直接去看看。';
      }

      const { balance, crowdLevel, pricePerShower } = showerData;
      const habits = getUserHabits();
      const knowledge = getLongTermKnowledge();

      // 计算能洗几次
      const remainingCount = Math.floor(balance / pricePerShower);
      const balanceStatus =
        balance > habits.showerThreshold * 2
          ? '充足'
          : balance > habits.showerThreshold
            ? '够用'
            : '偏低';

      let suggestion = '';
      if (crowdLevel === '拥挤') {
        suggestion = '现在人多，建议稍等 30 分钟再去。';
      } else if (crowdLevel === '空闲') {
        suggestion = '现在人少，建议现在去。';
      } else {
        suggestion = '现在人不多不少，可以去。';
      }

      return `余额 ${balance.toFixed(1)} 元（${balanceStatus}），大概能洗 ${remainingCount} 次。澡堂目前${crowdLevel}。${suggestion}`;
    },
  );

  return {
    response: { text: task.result.summary, suggestions: ['现在去洗澡', '充值', '看看什么时候人少'] },
    task,
  };
}

/**
 * 处理「洗完澡」确认
 */
export async function handleShowerDone(): Promise<{ response: AgentResponse; task: OrchestrationTask }> {
  const state = deductShowerBalance();
  const habits = getUserHabits();
  const price = getLongTermKnowledge().campusRules.showerPrice;

  const task = await orchestrate(
    'shower',
    'user_says_shower_done',
    [
      {
        mode: 'serial',
        actions: [
          {
            name: 'deductBalance',
            execute: async () => state,
            fallback: null,
          },
        ],
      },
    ],
    () => {
      if (state.balance < habits.showerThreshold) {
        return `好的！本次消费约 ${price} 元，余额还剩 ${state.balance.toFixed(1)} 元，余额不足，需要充值吗？`;
      }
      return `好的！本次消费约 ${price} 元，余额还剩 ${state.balance.toFixed(1)} 元。`;
    },
  );

  return {
    response: { text: task.result.summary, suggestions: ['充值', '不用了'] },
    task,
  };
}
