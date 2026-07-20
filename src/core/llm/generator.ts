// ============================================================
// LLM 回复生成器
// 包装场景结果，调用 LLM 生成自然语言回复 + 兜底降级
// ============================================================

import { chat, isLlmAvailable, type LlmResponse } from './client.js';
import {
  buildSystemPrompt,
  buildScenePrompt,
  buildFallbackPrompt,
  buildConversationMessages,
} from './prompts.js';
import { getSession, getUserHabits } from '../memory/engine.js';
import type { AgentResponse, IntentCategory } from '../../models/index.js';

// 系统提示词缓存（只构建一次）
let _systemPromptCache: string | null = null;
function getSystemPrompt(): string {
  if (!_systemPromptCache) {
    _systemPromptCache = buildSystemPrompt();
  }
  return _systemPromptCache;
}

/**
 * LLM 增强回复：在场景结果基础上用 LLM 润色
 * 失败则返回原始场景结果
 */
export async function enhanceResponse(params: {
  userMessage: string;
  sceneResult: AgentResponse;
  intent: IntentCategory;
}): Promise<AgentResponse> {
  const { userMessage, sceneResult, intent } = params;

  if (!isLlmAvailable()) {
    return sceneResult; // 直接返回模板
  }

  const habits = getUserHabits();
  const session = getSession();

  // 构建 LLM 请求：系统提示词 + 对话历史 + 场景数据
  const systemPrompt = getSystemPrompt();
  const sceneUserMessage = buildScenePrompt({
    userMessage,
    sceneResult: { text: sceneResult.text, suggestions: sceneResult.suggestions ?? [] },
    intent,
    habits,
  });

  const messages = buildConversationMessages(systemPrompt, session, sceneUserMessage);

  const llmResult = await chat(messages);
  if (!llmResult) {
    return sceneResult; // LLM 失败，降级
  }

  return {
    text: llmResult.text || sceneResult.text,
    suggestions:
      llmResult.suggestions.length > 0 ? llmResult.suggestions : sceneResult.suggestions,
  };
}

/**
 * LLM 处理未知意图：让 LLM 自由理解和回复
 * 失败则返回模板兜底
 */
export async function handleUnknownIntent(
  userMessage: string,
  fallbackResponse: AgentResponse,
): Promise<AgentResponse> {
  if (!isLlmAvailable()) {
    return fallbackResponse;
  }

  const habits = getUserHabits();
  const session = getSession();

  const systemPrompt = getSystemPrompt();
  const userPrompt = buildFallbackPrompt({ userMessage, habits });

  const messages = buildConversationMessages(systemPrompt, session, userPrompt);

  const llmResult = await chat(messages);
  if (!llmResult || !llmResult.text) {
    return fallbackResponse;
  }

  return {
    text: llmResult.text,
    suggestions: llmResult.suggestions.length > 0 ? llmResult.suggestions : fallbackResponse.suggestions,
  };
}

/**
 * 综合生成器：接收场景原始结果，决定如何处理
 */
export async function generateResponse(params: {
  userMessage: string;
  intent: IntentCategory;
  sceneResult: AgentResponse;
  fallbackForUnknown: AgentResponse;
}): Promise<AgentResponse> {
  const { userMessage, intent, sceneResult, fallbackForUnknown } = params;

  // 未知意图：让 LLM 自由发挥
  if (intent === 'unknown') {
    return handleUnknownIntent(userMessage, fallbackForUnknown);
  }

  // 已知意图：LLM 增强回复
  return enhanceResponse({
    userMessage,
    sceneResult,
    intent,
  });
}
