// ============================================================
// RAG 生成管道
// 检索 → 上下文注入 → LLM 生成 → 返回答案
// ============================================================

import { searchKnowledge, formatRetrievedContext, type KnowledgeChunk } from './store.js';
import { chat, isLlmAvailable } from '../llm/client.js';
import { getSession } from '../memory/engine.js';

/**
 * RAG 增强回复：基于知识库回答用户问题
 */
export async function ragQuery(userQuestion: string): Promise<{
  text: string;
  suggestions: string[];
  sources: string[];
} | null> {
  if (!isLlmAvailable()) return null;

  // 1. 检索相关片段
  const chunks = searchKnowledge(userQuestion, 5);
  if (chunks.length === 0) {
    // 无相关结果，返回 null 让上层兜底
    console.log('[RAG] 未检索到相关知识');
    return null;
  }

  console.log(`[RAG] 检索到 ${chunks.length} 个片段: ${chunks.map(c => c.title).join(', ')}`);

  // 2. 组装上下文
  const context = formatRetrievedContext(chunks);

  // 3. 构建 LLM 请求
  const systemPrompt = `你是校园助手「小搭」，正在根据校园知识库回答用户问题。
请严格基于下面的知识库内容回答。如果知识库中没有相关信息，诚实说明。
回答要简洁（3-5句话），口语化，适当使用 emoji。

## 知识库内容
${context}

## 回复格式
返回 JSON：{"text": "回答", "suggestions": ["建议追问1", "建议追问2"]}`;

  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userQuestion },
  ];

  // 4. 调用 LLM
  const result = await chat(messages, { maxTokens: 400 });
  if (!result) return null;

  // 5. 记录来源
  const sources = [...new Set(chunks.map(c => c.title))];

  return {
    text: result.text,
    suggestions: result.suggestions.length > 0 ? result.suggestions : ['还有别的问题吗？'],
    sources,
  };
}

/**
 * 判断用户问题是否应该走 RAG
 * 匹配校园知识类关键词
 */
const RAG_TRIGGER_KEYWORDS = [
  '转专业', '奖学金', '助学金', '贷款', '处分', '退学', '休学',
  '补办', '挂失', '怎么申请', '条件是什么', '需要什么',
  '成绩单', '学生证', '宿舍', '调换', '门禁', '户籍',
  '毕业', '学位', '选修', '辅修', '双学位', '重修',
  '校医院', '医保', '心理咨询', '图书馆', '借书',
  '学分', '绩点', '选课', '怎么选', '什么时候',
  '在哪里', '去哪', '怎么去', '在哪儿', '哪里',
  '怎么办', '政策', '规定', '规则', '流程', '手续',
  '保研', '考研', '出国', '交换',
];

export function shouldUseRag(query: string): boolean {
  return RAG_TRIGGER_KEYWORDS.some(kw => query.includes(kw));
}
