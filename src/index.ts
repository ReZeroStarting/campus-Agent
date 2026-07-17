// ============================================================
// 校园搭子 - 交互式命令行入口
// 用法: npm run dev
// ============================================================

import * as readline from 'readline';
import { processMessage, registerBuiltinTriggers } from './agent.js';

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
  console.log('  输入 "退出" 或 "exit" 结束对话');
  console.log('  试试说：我要洗澡 / 明天什么课 / 卡里还有多少钱');
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
