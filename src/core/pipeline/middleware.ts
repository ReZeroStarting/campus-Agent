// ============================================================
// Agent 处理管道
// 将原 agent.ts 的 processMessage 拆成可组合的中间件链
// ============================================================

import type { AgentResponse, IntentResult } from '../../models/index.js';
import type { ShortTermMemory } from '../../models/index.js';
import { recognizeIntent } from '../intent/engine.js';
import { resolveAnaphora } from '../anaphora/engine.js';
import { recordMessage, updateSessionContext, getSession, learnPattern } from '../memory/engine.js';
import { createTimedLogger } from '../../services/logger.js';

// ── 管道类型 ──

export interface PipelineContext {
  text: string;
  session: ShortTermMemory;
  intent?: IntentResult;
  response?: AgentResponse;
  /** 是否已经调用过 LLM */
  didLLMCall: boolean;
}

export type PipelineStage = (
  ctx: PipelineContext,
) => Promise<PipelineContext>;

// ── 各阶段实现 ──

/** 阶段 1：指代消解 */
export const stageResolveAnaphora: PipelineStage = async (ctx) => {
  const timed = createTimedLogger('Pipeline', 'anaphora_resolve');
  const response = resolveAnaphora(ctx.text, ctx.session);
  if (response) {
    recordMessage('agent', response.text);
    ctx.response = response;
    timed.finish('anaphora_hit', { rule: response.text.slice(0, 30) });
  } else {
    timed.info('anaphora_miss');
  }
  return ctx;
};

/** 阶段 2：意图识别 */
export const stageRecognizeIntent: PipelineStage = async (ctx) => {
  if (ctx.response) return ctx; // 已短路

  const timed = createTimedLogger('Pipeline', 'intent_recognize');
  const intent = recognizeIntent(ctx.text);

  ctx.intent = intent;

  if (intent.category !== 'unknown') {
    updateSessionContext({
      lastIntent: intent.category,
      lastTopic: ctx.text,
    });
    learnPattern(intent.category, new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }));
  }

  timed.finish('intent_done', {
    intent: intent.category,
    confidence: intent.confidence,
    elapsedMs: undefined, // 由 finish 自动计算
  });

  return ctx;
};

/** 阶段 3：场景路由 + LLM 增强 */
// 这个阶段由 agent.ts 中的 switch-case 实现，因为场景函数类型各异
// 管道只负责统一接口
