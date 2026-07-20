// ============================================================
// RAG 知识库 V2 — TF-IDF 检索 + 倒排索引
// 从 V1 的 Bigram Jaccard 升级为 TF-IDF 余弦相似度
// ============================================================

import { readFileSync, readdirSync, existsSync } from 'fs';
import { join, resolve } from 'path';

/** 一个知识片段 */
export interface KnowledgeChunk {
  id: string;
  source: string;
  title: string;
  content: string;
  /** TF-IDF 向量（token → weight） */
  vector: Map<string, number>;
}

// ── 配置 ──

interface RAGConfig {
  /** 知识库目录路径，支持绝对路径或相对路径 */
  knowledgeDir: string;
  /** 默认检索返回数量 */
  defaultTopK: number;
}

let config: RAGConfig = {
  knowledgeDir: '',
  defaultTopK: 5,
};

/** 获取/设置 RAG 配置 */
export function getRAGConfig(): Readonly<RAGConfig> {
  return config;
}

export function setRAGConfig(patch: Partial<RAGConfig>): void {
  config = { ...config, ...patch };
}

// ── 分词 ──

/**
 * 混合分词：2-gram + 单字（中文友好，零依赖）
 * "转专业条件" → ["转专","专业","业条","条件","转","专","业","条","件"]
 */
function tokenize(text: string): string[] {
  const cleaned = text.replace(/\s+/g, '');
  const tokens: string[] = [];

  // 2-gram
  for (let i = 0; i < cleaned.length - 1; i++) {
    tokens.push(cleaned.substring(i, i + 2));
  }

  // 单字（对短查询有价值）
  for (const ch of cleaned) {
    tokens.push(ch);
  }

  return tokens;
}

// ── TF-IDF 计算 ──

function computeTF(tokens: string[]): Map<string, number> {
  const tf = new Map<string, number>();
  for (const t of tokens) {
    tf.set(t, (tf.get(t) || 0) + 1);
  }
  const total = tokens.length;
  for (const [term, count] of tf) {
    tf.set(term, count / total);
  }
  return tf;
}

function computeIDF(chunks: KnowledgeChunk[]): Map<string, number> {
  const df = new Map<string, number>();
  const N = chunks.length;

  for (const chunk of chunks) {
    const seen = new Set<string>();
    for (const term of chunk.vector.keys()) {
      if (!seen.has(term)) {
        df.set(term, (df.get(term) || 0) + 1);
        seen.add(term);
      }
    }
  }

  const idf = new Map<string, number>();
  for (const [term, count] of df) {
    idf.set(term, Math.log((N + 1) / (count + 1)) + 1); // smooth IDF
  }
  return idf;
}

/** 为所有 chunk 计算 TF-IDF 向量 */
function applyIDF(chunks: KnowledgeChunk[]): void {
  const idf = computeIDF(chunks);
  for (const chunk of chunks) {
    for (const [term, tf] of chunk.vector) {
      chunk.vector.set(term, tf * (idf.get(term) || 0));
    }
  }
}

/** 向量余弦相似度 */
function cosineSimilarity(a: Map<string, number>, b: Map<string, number>): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (const [term, weightA] of a) {
    dotProduct += weightA * (b.get(term) || 0);
    normA += weightA * weightA;
  }

  for (const weightB of b.values()) {
    normB += weightB * weightB;
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// ── 知识库加载 ──

let knowledgeBase: KnowledgeChunk[] | null = null;

function resolveKnowledgeDir(): string {
  if (config.knowledgeDir && existsSync(config.knowledgeDir)) {
    return config.knowledgeDir;
  }

  const candidates = [
    join(import.meta.dirname || __dirname, '../../data/knowledge'),
    join(process.cwd(), 'src/data/knowledge'),
    join(process.cwd(), 'data/knowledge'),
  ];
  for (const dir of candidates) {
    try {
      if (existsSync(dir) && readdirSync(dir).length > 0) return dir;
    } catch { /* try next */ }
  }
  throw new Error('找不到 knowledge 目录');
}

export function loadKnowledgeBase(): KnowledgeChunk[] {
  if (knowledgeBase) return knowledgeBase;

  const dir = resolveKnowledgeDir();
  const files = readdirSync(dir).filter(f => f.endsWith('.md'));
  const chunks: KnowledgeChunk[] = [];

  for (const file of files) {
    const content = readFileSync(join(dir, file), 'utf-8');
    const fileName = file.replace(/\.md$/, '');

    const sections = content.split(/(?=^## )/m);

    for (const section of sections) {
      const lines = section.trim().split('\n');
      const heading = lines[0].replace(/^## /, '').trim();
      const text = lines.slice(1).join('\n').trim();
      if (!text || text.length < 10) continue;

      if (text.length > 500) {
        const paragraphs = text.split(/\n\n+/);
        let subIdx = 0;
        for (const para of paragraphs) {
          const trimmed = para.trim();
          if (trimmed.length < 10) continue;
          const tokens = tokenize(trimmed);
          chunks.push({
            id: `${fileName}_${heading}_${subIdx++}`,
            source: fileName,
            title: heading,
            content: trimmed,
            vector: computeTF(tokens),
          });
        }
      } else {
        const tokens = tokenize(text);
        chunks.push({
          id: `${fileName}_${heading}`,
          source: fileName,
          title: heading,
          content: text,
          vector: computeTF(tokens),
        });
      }
    }
  }

  // 全局 IDF 校准
  applyIDF(chunks);

  const totalVectors = chunks.reduce((sum, c) => sum + c.vector.size, 0);
  console.log(`[RAG] TF-IDF 索引: ${files.length} 文档 → ${chunks.length} 片段 → ${totalVectors} 特征维度`);
  knowledgeBase = chunks;
  return chunks;
}

// ── 检索 ──

export function searchKnowledge(query: string, topK?: number): KnowledgeChunk[] {
  const k = topK ?? config.defaultTopK;
  const kb = loadKnowledgeBase();
  if (kb.length === 0) return [];

  const queryTokens = tokenize(query);
  const queryTF = computeTF(queryTokens);

  const scored = kb.map(chunk => ({
    chunk,
    score: cosineSimilarity(queryTF, chunk.vector),
  }));

  scored.sort((a, b) => b.score - a.score);

  const results = scored
    .filter(s => s.score > 0.01)
    .slice(0, k)
    .map(s => ({ ...s.chunk, _score: s.score }));

  // 去重（同 source + title 只保留最高分）
  const seen = new Set<string>();
  const deduplicated = results.filter(r => {
    const key = `${r.source}_${r.title}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // 清理评分字段
  return deduplicated.map(({ _score, ...chunk }) => chunk);
}

// ── 格式化 ──

export function formatRetrievedContext(chunks: KnowledgeChunk[]): string {
  if (chunks.length === 0) return '（未找到相关知识）';
  return chunks
    .map((c, i) => `[文档${i + 1}] 来源：《${c.source}》- ${c.title}\n${c.content}`)
    .join('\n\n');
}

// ── 重置（测试用）──

export function resetKnowledgeBase(): void {
  knowledgeBase = null;
}
