// ============================================================
// Agent 处理管道 V2
// 可组合的中间件链，agent.ts 通过 composePipeline 串联
// ============================================================

import type { AgentResponse, IntentResult } from '../../models/index.js';
import type { ShortTermMemory } from '../../models/index.js';
import { recognizeIntent } from '../intent/engine.js';
import { resolveAnaphora } from '../anaphora/engine.js';
import { recordMessage, updateSessionContext, learnPattern } from '../memory/engine.js';
import { createTimedLogger } from '../../services/logger.js';

// ── 管道类型 ──

export interface PipelineContext {
  text: string;
  session: ShortTermMemory;
  intent?: IntentResult;
  response?: AgentResponse;
  didLLMCall: boolean;
  /** 阶段日志 traceId */
  traceId: string;
}

export type PipelineStage = (ctx: PipelineContext) => Promise<PipelineContext>;

// ── 阶段实现 ──

/** 阶段 1：指代消解（含委托回调） */
export function makeAnaphoraStage(
  delegationHandler: (text: string) => Promise<AgentResponse | null>,
): PipelineStage {
  return async (ctx) => {
    const timed = createTimedLogger('Pipeline', 'anaphora_resolve');

    const result = resolveAnaphora(ctx.text, ctx.session);
    if (result) {
      recordMessage('agent', result.text);
      ctx.response = result;
      timed.finish('anaphora_hit', { rule: result.text.slice(0, 30) });
      return ctx;
    }

    // 引擎未命中 → 尝试委托处理
    const delegated = await delegationHandler(ctx.text);
    if (delegated) {
      recordMessage('agent', delegated.text);
      ctx.response = delegated;
      timed.finish('anaphora_delegated');
      return ctx;
    }

    timed.info('anaphora_miss');
    return ctx;
  };
}

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
    learnPattern(
      intent.category,
      new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
    );
  }

  timed.finish('intent_done', {
    intent: intent.category,
    confidence: intent.confidence,
  });

  return ctx;
};

// ── 管道运行器 ──

/**
 * 顺序运行多个阶段，任一阶段设置了 ctx.response 则短路
 */
export async function composePipeline(
  ctx: PipelineContext,
  stages: PipelineStage[],
): Promise<PipelineContext> {
  for (const stage of stages) {
    ctx = await stage(ctx);
    if (ctx.response) break;
  }
  return ctx;
}
