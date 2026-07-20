// ============================================================
// 校园搭子 - 交互式命令行入口
// ============================================================

import 'dotenv/config';
import * as readline from 'readline';
import { processMessage, registerBuiltinTriggers } from './agent.js';
import { isLlmAvailable } from './core/llm/client.js';
import { loadKnowledgeBase } from './core/rag/store.js';
import { getStorageStatus } from './services/storage.js';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function main() {
  // 注册内置触发器
  registerBuiltinTriggers();

  console.log('========================================');
  console.log('  🎒 校园搭子 - Campus Buddy Agent');
  console.log('  你的大学生活助手');
  console.log('========================================');
  console.log('');
  const llmStatus = isLlmAvailable() ? '✅ DeepSeek LLM 已启用' : '⚠️  LLM 未配置，使用模板回复';
  console.log(`  ${llmStatus}`);
  try {
    const kb = loadKnowledgeBase();
    console.log(`  ✅ RAG 知识库：${kb.length} 个片段（5 个文档）`);
  } catch {
    console.log('  ⚠️  RAG 知识库未找到');
  }
  const status = getStorageStatus();
  const dataParts: string[] = [];
  if (status.schedule.imported) dataParts.push(`课表(${status.schedule.count}门)`);
  if (status.grades.imported) dataParts.push(`成绩(${status.grades.count}门)`);
  if (status.exams.imported) dataParts.push(`考试(${status.exams.count}场)`);
  if (dataParts.length > 0) {
    console.log(`  💾 已导入数据：${dataParts.join('、')}`);
  } else {
    console.log('  💾 使用模拟数据（可通过 API 导入真实数据）');
  }
  console.log('  试试说：早安 / 考试倒计时 / 找空教室 / 绩点多少 / 教三在哪');
  console.log('');

  const ask = () => {
    rl.question('你 > ', async (input) => {
      const trimmed = input.trim();
      if (trimmed === '退出' || trimmed === 'exit' || trimmed === 'quit') {
        console.log('小搭 > 再见！有需要随时找我~');
        rl.close();
        return;
      }

      if (!trimmed) {
        ask();
        return;
      }

      const response = await processMessage(trimmed);
      console.log(`小搭 > ${response.text}`);
      if (response.suggestions && response.suggestions.length > 0) {
        console.log(`        [${response.suggestions.join(' | ')}]`);
      }
      console.log('');
      ask();
    });
  };

  ask();
}

main().catch(console.error);
