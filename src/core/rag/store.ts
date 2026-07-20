// ============================================================
// RAG 知识库 —— 文档加载 + 分块 + 检索
// 使用字符 Bigram 相似度（中文分词效果好，零依赖）
// ============================================================

import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

/** 一个知识片段 */
export interface KnowledgeChunk {
  id: string;
  source: string;       // 来源文档名
  title: string;         // 章节标题
  content: string;       // 文本内容
  bigrams: Set<string>;  // 预计算的特征
}

let knowledgeBase: KnowledgeChunk[] | null = null;

/**
 * 加载 knowledge/ 目录下的所有 Markdown 文档
 */
function getKnowledgeDir(): string {
  // 兼容不同运行环境（tsx / node / vitest）
  const candidates = [
    join(import.meta.dirname || __dirname, '../../data/knowledge'),
    join(process.cwd(), 'src/data/knowledge'),
    join(process.cwd(), 'data/knowledge'),
  ];
  for (const dir of candidates) {
    try {
      if (readdirSync(dir).length > 0) return dir;
    } catch { /* try next */ }
  }
  throw new Error('找不到 knowledge 目录');
}

/**
 * 字符 Bigram 提取（中文友好）
 * "转专业条件" → ["转专","专业","业条","条件"]
 */
function extractBigrams(text: string): string[] {
  const cleaned = text.replace(/\s+/g, '');
  const result: string[] = [];
  for (let i = 0; i < cleaned.length - 1; i++) {
    result.push(cleaned.substring(i, i + 2));
  }
  return result;
}

/**
 * Bigram Jaccard 相似度
 * score = |A ∩ B| / |A ∪ B|
 */
function bigramSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let intersection = 0;
  for (const item of a) {
    if (b.has(item)) intersection++;
  }
  return intersection / (a.size + b.size - intersection);
}

/**
 * 加载并分块所有知识库文档
 */
export function loadKnowledgeBase(): KnowledgeChunk[] {
  if (knowledgeBase) return knowledgeBase;

  const dir = getKnowledgeDir();
  const files = readdirSync(dir).filter(f => f.endsWith('.md'));
  const chunks: KnowledgeChunk[] = [];

  for (const file of files) {
    const content = readFileSync(join(dir, file), 'utf-8');
    const fileName = file.replace(/\.md$/, '');

    // 按 ## 标题分块
    const sections = content.split(/(?=^## )/m);

    for (const section of sections) {
      const lines = section.trim().split('\n');
      const heading = lines[0].replace(/^## /, '').trim();
      const text = lines.slice(1).join('\n').trim();

      if (!text || text.length < 10) continue; // 跳过空块

      // 如果块太大（超过 500 字符），按段落再分
      if (text.length > 500) {
        const paragraphs = text.split(/\n\n+/);
        let subIdx = 0;
        for (const para of paragraphs) {
          const trimmed = para.trim();
          if (trimmed.length < 10) continue;
          chunks.push({
            id: `${fileName}_${heading}_${subIdx++}`,
            source: fileName,
            title: heading,
            content: trimmed,
            bigrams: new Set(extractBigrams(trimmed)),
          });
        }
      } else {
        chunks.push({
          id: `${fileName}_${heading}`,
          source: fileName,
          title: heading,
          content: text,
          bigrams: new Set(extractBigrams(text)),
        });
      }
    }
  }

  console.log(`[RAG] 知识库已加载: ${files.length} 个文档 → ${chunks.length} 个片段`);
  knowledgeBase = chunks;
  return chunks;
}

/**
 * 检索：返回最相关的 Top-K 片段
 */
export function searchKnowledge(query: string, topK: number = 5): KnowledgeChunk[] {
  const kb = loadKnowledgeBase();
  const queryBigrams = new Set(extractBigrams(query));

  const scored = kb.map(chunk => ({
    chunk,
    score: bigramSimilarity(queryBigrams, chunk.bigrams),
  }));

  // 按分数降序排列
  scored.sort((a, b) => b.score - a.score);

  // 返回 score > 0 的 Top-K
  const results = scored
    .filter(s => s.score > 0)
    .slice(0, topK)
    .map(s => s.chunk);

  return results;
}

/**
 * 将检索结果格式化为 LLM 上下文
 */
export function formatRetrievedContext(chunks: KnowledgeChunk[]): string {
  if (chunks.length === 0) return '（未找到相关知识）';

  return chunks.map((c, i) =>
    `[文档${i + 1}] 来源：《${c.source}》- ${c.title}\n${c.content}`
  ).join('\n\n');
}

/**
 * 重置知识库（测试用）
 */
export function resetKnowledgeBase(): void {
  knowledgeBase = null;
}
