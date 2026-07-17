// ============================================================
// 校园搭子 - 演示脚本（录制用）
// 运行后自动播放所有演示场景，直接录屏即可
// ============================================================

import { processMessage, registerBuiltinTriggers, runScheduledCheck } from './agent.js';
import { setImportedSchedule, clearImportedSchedule } from './services/scheduleImport.js';
import { fetchAllCourses } from './services/scheduleData.js';
import { getUserHabits, updateUserHabits } from './core/memory/engine.js';

const DELAY = 1200; // 步骤间停顿（ms），给录屏留呼吸感

function wait(ms = DELAY) {
  return new Promise(r => setTimeout(r, ms));
}

function printDivider(title: string) {
  console.log(`\n${'═'.repeat(50)}`);
  console.log(`  ${title}`);
  console.log(`${'═'.repeat(50)}`);
}

async function demo(text: string) {
  process.stdout.write(`\n👤 你：${text}`);
  await wait(800);
  const r = await processMessage(text);
  await wait(600);
  console.log(`\n🤖 小搭：${r.text.replace(/\n/g, '\n        ')}`);
  if (r.suggestions) {
    await wait(400);
    console.log(`        [${r.suggestions.join(' | ')}]`);
  }
}

async function main() {
  registerBuiltinTriggers();

  // 设定用户习惯，让演示更自然
  updateUserHabits({
    showerTime: '17:30',
    frequentCanteen: '二食堂',
    wakeTime: '07:20',
    sleepReminderTime: '21:30',
  });

  // ============ 开幕 ============
  console.clear();
  console.log(`
╔══════════════════════════════════════════════════╗
║                                                  ║
║         🎒  校 园 搭 子  Campus Buddy           ║
║         一句话，校园琐事全安排好                   ║
║                                                  ║
║         鸿蒙高校创新赛 · Agent 赛道               ║
║                                                  ║
╚══════════════════════════════════════════════════╝
`);
  await wait(2000);

  // ============ 场景1：课表管家 ============
  printDivider('场景一：课表管家 — 一句话查课表，天气+余额联动');
  console.log('   [ 用户询问明天的课程 ]');
  await wait(500);

  await demo('明天什么课');

  // ============ 场景2：洗澡助手 ============
  printDivider('场景二：洗澡助手 — 查余额看拥挤，智能建议');

  await demo('我要洗澡');

  // 指代消解
  console.log('\n   ═══ 多轮对话：自然追问 ═══');
  await wait(800);

  await demo('够不够？');

  await demo('几点去比较好？');

  // ============ 场景3：一卡通管家 ============
  printDivider('场景三：一卡通管家 — 余额监控+消费分析');

  await demo('卡里还有多少钱');

  await demo('这周食堂花了多少');

  // ============ 场景联动 ============
  printDivider('场景联动：跨服务编排');

  console.log('\n   [ 天气 → 穿衣 ]');
  await wait(500);

  await demo('今天天气');
  await demo('穿什么');

  console.log('\n   [ 课表 → 吃饭 ]');
  await wait(500);

  await demo('明天什么课');
  await demo('中午吃什么');

  console.log('\n   [ 课表 → 睡眠 ]');
  await wait(500);

  await demo('几点睡');

  // ============ 喝水记录 ============
  printDivider('场景四：饮水记录');

  await demo('今天喝了多少水');
  await demo('喝了200ml');

  // ============ 洗完澡闭环 ============
  printDivider('场景五：洗完澡流程闭环');

  await demo('我要洗澡');
  await demo('洗完了');

  // ============ 快递 & 外卖 ============
  printDivider('场景七：快递 & 外卖 — 取件追踪+路线规划');

  console.log('\n   [ 查快递状态 ]');
  await wait(500);

  await demo('查快递');

  console.log('\n   [ 查外卖状态 ]');
  await wait(500);

  await demo('外卖到了吗');

  console.log('\n   [ 综合待取清单 ]');
  await wait(500);

  await demo('有什么要拿的');

  console.log('\n   [ 取件码查询 ]');
  await wait(500);

  await demo('取件码是多少');

  console.log('\n   [ 路线规划 ]');
  await wait(500);

  await demo('帮我规划路线');

  console.log('\n   [ 取完标记 ]');
  await wait(500);

  await demo('顺丰取完了');

  // ============ 校园论坛 ============
  printDivider('场景八：校园论坛 — 信息点自动提取');

  console.log('\n   [ 论坛首页 ]');
  await wait(500);

  await demo('论坛');

  console.log('\n   [ 查活动 ]');
  await wait(500);

  await demo('有什么讲座');

  console.log('\n   [ 查失物 ]');
  await wait(500);

  await demo('最近有人捡到东西吗');

  console.log('\n   [ 查课程评价 ]');
  await wait(500);

  await demo('机器学习课怎么样');

  console.log('\n   [ 查二手 ]');
  await wait(500);

  await demo('有人出显示器吗');

  // ============ 校园地图 ============
  printDivider('场景九：校园地图 — 建筑定位 + 服务反查 + 路线规划');

  console.log('\n   [ 设置位置 ]');
  await wait(500);

  await demo('我在教三');

  console.log('\n   [ 查建筑 ]');
  await wait(500);

  await demo('图书馆在哪');

  console.log('\n   [ 服务反查 ]');
  await wait(500);

  await demo('去哪打成绩单');

  console.log('\n   [ 路线导航 ]');
  await wait(500);

  await demo('到图书馆怎么走');

  console.log('\n   [ 校园总览 ]');
  await wait(500);

  await demo('校园地图');

  // ============ 主动触发 ============
  printDivider('场景六：主动服务 — 低余额自动提醒');

  const pushes = await runScheduledCheck(new Date());
  await wait(500);
  for (const p of pushes) {
    console.log(`\n📲 主动推送：${p.text.replace(/\n/g, '\n        ')}`);
  }

  // ============ 谢幕 ============
  printDivider('');
  console.log(`
  校园搭子 — 核心能力总结：

  ✅  校园地图：建筑定位 + 服务反查（去哪打成绩单）+ 楼间导航
  ✅  校园论坛：热帖汇总 + 活动/失物/课程评价/二手自动提取
  ✅  快递追踪：到站通知 + 取件码 + 路线规划
  ✅  外卖追踪：实时配送状态 + 取餐提醒
  ✅  路线规划：多取件点智能排序 + 时间预估
  ✅  意图识别：一句话触发服务链
  ✅  跨服务编排：课表+天气+一卡通并行查询
  ✅  多轮对话：上下文保持 + 指代消解
  ✅  主动服务：低余额预警、早八提醒
  ✅  闭环流程：洗澡→扣费→充值提醒
  ✅  场景联动：天气→穿衣、课表→吃饭→睡眠

  7 个核心场景做深做透，完整闭环可演示。
`);

  await wait(2000);
  console.log('  [ 录制结束 ]\n');
}

main().catch(console.error);
