// ============================================================
// 主动触发器引擎
// 基于时间 + 条件的主动推送
// ============================================================

import type { TriggerRule, TriggerContext } from '../../models/index.js';
import type { AgentResponse } from '../../models/index.js';

const rules: TriggerRule[] = [];

let lastTriggerTimes: Map<string, number> = new Map();

/**
 * 注册触发器规则
 */
export function registerTrigger(rule: TriggerRule): void {
  rules.push(rule);
}

/**
 * 获取所有注册的触发器
 */
export function getTriggers(): TriggerRule[] {
  return [...rules];
}

/**
 * 检查触发器（由外部定时任务调用）
 * @param context 当前系统上下文
 * @returns 触发的响应列表
 */
export async function checkTriggers(context: TriggerContext): Promise<AgentResponse[]> {
  const responses: AgentResponse[] = [];
  const now = Date.now();

  for (const rule of rules) {
    // 冷却检查
    const lastTrigger = lastTriggerTimes.get(rule.id);
    if (lastTrigger && now - lastTrigger < rule.cooldownMinutes * 60_000) {
      continue;
    }

    if (rule.condition(context)) {
      try {
        const response = await rule.action(context);
        responses.push(response);
        lastTriggerTimes.set(rule.id, now);
      } catch {
        // 触发器失败不阻断其他触发器
        console.warn(`[Trigger] ${rule.id} 执行失败，跳过`);
      }
    }
  }

  return responses;
}

/**
 * 手动触发某个规则（调试用）
 */
export async function fireTrigger(
  ruleId: string,
  context: TriggerContext,
): Promise<AgentResponse | null> {
  const rule = rules.find((r) => r.id === ruleId);
  if (!rule) return null;
  return rule.action(context);
}

/**
 * 重置冷却状态
 */
export function resetCooldowns(): void {
  lastTriggerTimes = new Map();
}
