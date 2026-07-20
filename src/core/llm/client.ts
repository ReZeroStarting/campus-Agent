// ============================================================
// DeepSeek API 客户端（OpenAI 兼容接口）
// 超时 5s，失败不抛异常，返回 null
// ============================================================

import 'dotenv/config';

const API_BASE = 'https://api.deepseek.com/v1';
const API_KEY = process.env.DEEPSEEK_API_KEY || '';
const MODEL = process.env.DEEPSEEK_MODEL || 'deepseek-chat';
const TIMEOUT_MS = 5000;

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LlmResponse {
  text: string;
  suggestions: string[];
  finishReason: string;
}

/**
 * 调用 DeepSeek API，返回结构化结果。失败返回 null。
 */
export async function chat(
  messages: ChatMessage[],
  options?: { temperature?: number; maxTokens?: number },
): Promise<LlmResponse | null> {
  if (!API_KEY) {
    console.warn('[LLM] DEEPSEEK_API_KEY 未配置，跳过 LLM 调用');
    return null;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(`${API_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? 512,
        response_format: { type: 'json_object' },
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const errBody = await res.text().catch(() => '');
      console.warn(`[LLM] API 错误 ${res.status}: ${errBody.slice(0, 200)}`);
      return null;
    }

    const data = await res.json() as {
      choices: Array<{
        message: { content: string };
        finish_reason: string;
      }>;
      usage: { total_tokens: number };
    };

    const raw = data.choices?.[0]?.message?.content;
    if (!raw) {
      console.warn('[LLM] 响应内容为空');
      return null;
    }

    // 尝试解析 JSON 响应
    const parsed = JSON.parse(raw);
    const text = typeof parsed.text === 'string' ? parsed.text : String(parsed.text ?? raw);
    const suggestions: string[] = Array.isArray(parsed.suggestions)
      ? parsed.suggestions.filter((s: unknown) => typeof s === 'string').slice(0, 4)
      : [];

    console.log(`[LLM] 调用成功, tokens: ${data.usage?.total_tokens ?? '?'}`);

    return {
      text,
      suggestions,
      finishReason: data.choices?.[0]?.finish_reason ?? 'stop',
    };
  } catch (err: unknown) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      console.warn(`[LLM] 请求超时 (${TIMEOUT_MS}ms)`);
    } else {
      console.warn(`[LLM] 调用失败: ${(err as Error).message}`);
    }
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * 检查 LLM 是否可用
 */
export function isLlmAvailable(): boolean {
  const enabled = process.env.LLM_ENABLED !== 'false';
  return enabled && !!API_KEY;
}
