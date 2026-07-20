// ============================================================
// 指代消解引擎
// 将 agent.ts 中 8 段硬编码指代消解规则抽离为独立模块
// ============================================================

import type { AgentResponse, IntentCategory } from '../../models/index.js';
import type { ShortTermMemory } from '../../models/index.js';
import { getShowerState, getCardState, getActivePackages, getPickupPoints, findBuilding } from '../../data/mocks/index.js';
import { getUserHabits } from '../memory/engine.js';
import { setCurrentLocation } from '../../scenes/map.js';

/** 指代消解规则 */
export interface AnaphoraRule {
  name: string;
  /** 匹配条件：可以是正则或自定义判断函数 */
  pattern: RegExp | ((text: string) => boolean);
  /** 可选：要求上次意图匹配 */
  requiresIntent?: IntentCategory | IntentCategory[];
  /** 处理函数 */
  handler: (text: string, context: ShortTermMemory) => AgentResponse | null;
}

function matchPattern(pattern: RegExp | ((text: string) => boolean), text: string): boolean {
  if (pattern instanceof RegExp) return pattern.test(text);
  return pattern(text);
}

function matchIntent(requires: IntentCategory | IntentCategory[] | undefined, lastIntent: IntentCategory | undefined): boolean {
  if (!requires) return true;
  if (Array.isArray(requires)) return requires.includes(lastIntent!);
  return requires === lastIntent;
}

// ── 规则表 ──
// 注：系统命令（重置/喝水/洗完了）由 agent.ts handleShortcut 处理
// 委托类（吃/穿/睡/取快递）由 agent.ts handleDelegatedAnaphora 处理

const RULES: AnaphoraRule[] = [
  {
    name: 'enough_or_not',
    pattern: (text) => text.includes('够不够') || text.includes('够吗'),
    handler: (text, session) => {
      const lastIntent = session.context.lastIntent;
      if (lastIntent === 'shower') {
        const state = getShowerState();
        const count = Math.floor(state.balance / state.pricePerShower);
        return { text: `够的，余额 ${state.balance.toFixed(1)} 元，大概能洗 ${count} 次。`, suggestions: ['现在去洗', '先充值'] };
      }
      if (lastIntent === 'card') {
        const card = getCardState();
        const evalStr = card.balance > 30 ? '很充裕' : card.balance > 15 ? '正常' : '偏低';
        return { text: `一卡通余额 ${card.balance.toFixed(1)} 元，${evalStr}。`, suggestions: ['充值', '查消费'] };
      }
      return null;
    },
  },
  {
    name: 'when_to_go',
    pattern: (text) => (text.includes('几点') && text.includes('去')) || text.includes('什么时候去'),
    handler: (text, session) => {
      const lastIntent = session.context.lastIntent;
      if (lastIntent === 'shower') {
        const habits = getUserHabits();
        const state = getShowerState();
        const response = `你习惯 ${habits.showerTime} 左右去。现在澡堂${state.crowdLevel}，${state.crowdLevel === '空闲' ? '随时可以去。' : state.crowdLevel === '拥挤' ? '建议等半小时。' : '可以去，不挤。'}`;
        return { text: response };
      }
      return null;
    },
  },
  {
    name: 'pickup_code',
    pattern: (text) => text.includes('取件码') || text.includes('货架号') || text.includes('哪个柜'),
    handler: () => {
      const packages = getActivePackages().filter(p => p.status === '已到站');
      if (packages.length === 0) {
        return { text: '没有待取的快递。', suggestions: ['查快递', '查外卖'] };
      }
      const points = getPickupPoints();
      const lines = packages.map(p => {
        const point = points.find(pp => pp.id === p.pickupPoint);
        return `${p.carrier} ${p.description || ''}: ${p.pickupCode}（${point?.name || p.pickupPoint}）`;
      });
      const msg = '📦 取件码：\n' + lines.join('\n');
      return { text: msg, suggestions: ['帮我规划路线', '查外卖'] };
    },
  },
  {
    name: 'set_location',
    pattern: (text) => text.startsWith('我在') || text.startsWith('我现在在'),
    handler: (text) => {
      const locText = text.replace(/^(我在|我现在在)/, '').trim();
      if (!locText) return null;
      const bld = findBuilding(locText);
      if (bld && setCurrentLocation(bld.id)) {
        const msg = `📍 已记录位置：${bld.name}${bld.description ? '（' + bld.description + '）' : ''}`;
        return { text: msg, suggestions: ['附近有什么', '图书馆怎么走', '到二食堂怎么走'] };
      }
      return null;
    },
  },
];

export { RULES as anaphoraRules };

/** 遍历规则表执行指代消解 */
export function resolveAnaphora(text: string, session: ShortTermMemory): AgentResponse | null {
  for (const rule of RULES) {
    if (!matchPattern(rule.pattern, text)) continue;
    if (!matchIntent(rule.requiresIntent, session.context.lastIntent)) continue;

    const result = rule.handler(text, session);
    if (result) return result; // 命中即返回
  }
  return null; // 未命中
}
