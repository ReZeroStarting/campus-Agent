// ============================================================
// 校园搭子 - 核心功能验证脚本 v2
// 覆盖：基础场景 + 多轮对话 + 场景联动 + 主动触发
// ============================================================

import { processMessage, registerBuiltinTriggers, runScheduledCheck } from './agent.js';

async function testAll() {
  console.log('========================================');
  console.log('  校园搭子 - 全链路验证');
  console.log('========================================\n');

  registerBuiltinTriggers();

  // ---- 基础场景 ----
  console.log('========== 基础场景 ==========\n');

  const testCases = [
    '明天什么课',       // 课表 + 天气 + 一卡通联动
    '我要洗澡',
    '卡里还有多少钱',
    '中午吃什么',       // 吃饭联动
    '穿什么',           // 穿衣建议
    '今天天气',
    '今天喝了多少水',
    '这周食堂花了多少',
  ];

  for (const input of testCases) {
    console.log(`> ${input}`);
    const r = await processMessage(input);
    console.log(`  ${r.text.replace(/\n/g, '\n  ')}\n`);
  }

  // ---- 多轮对话 & 场景联动 ----
  console.log('========== 多轮对话 + 场景联动 ==========\n');

  // 洗澡三连
  console.log('【洗澡三连】');
  await processMessage('我要洗澡');
  let r = await processMessage('够不够？');
  console.log(`  够不够？ → ${r.text}`);
  r = await processMessage('几点去比较好？');
  console.log(`  几点去？ → ${r.text}\n`);

  // 课表 → 吃饭联动
  console.log('【课表→吃饭联动】');
  await processMessage('明天什么课');
  r = await processMessage('中午吃什么');
  console.log(`  中午吃什么 → ${r.text}\n`);

  // 天气 → 穿衣联动
  console.log('【天气→穿衣联动】');
  await processMessage('今天天气');
  r = await processMessage('穿什么');
  console.log(`  穿什么 → ${r.text}\n`);

  // 睡眠查询
  console.log('【睡眠查询】');
  r = await processMessage('几点睡');
  console.log(`  几点睡 → ${r.text}\n`);

  // 洗完澡
  console.log('【洗完澡流程】');
  r = await processMessage('洗完了');
  console.log(`  洗完了 → ${r.text}\n`);

  // 记录喝水
  console.log('【记录喝水】');
  r = await processMessage('喝了200ml');
  console.log(`  喝了200ml → ${r.text}\n`);

  // ---- 主动触发器 ----
  console.log('========== 主动触发器 ==========\n');
  const now = new Date();
  const responses = await runScheduledCheck(now);
  for (const resp of responses) {
    console.log(`[推送] ${resp.text}`);
  }
  if (responses.length === 0) console.log('(无触发，冷却中或条件不满足)');

  console.log('\n✅ 全链路验证完成！');
}

testAll().catch(console.error);
