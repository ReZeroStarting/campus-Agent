// ============================================================
// 场景二：课表管家
// 查课表 + 上课提醒 + 早八预警
// ============================================================

import { orchestrate } from '../core/orchestrator/engine.js';
import { getCardState } from '../data/mock.js';
import { fetchWeather } from '../services/weather.js';
import { fetchAllCourses } from '../services/scheduleData.js';
import { getUserHabits, getLongTermKnowledge } from '../core/memory/engine.js';
import type { AgentResponse, OrchestrationTask, Course, WeatherInfo, CardState } from '../models/index.js';

const WEEKDAY_NAMES = ['日', '一', '二', '三', '四', '五', '六'];

/**
 * 处理「明天什么课」等课表查询意图
 */
export async function handleScheduleQuery(dateStr?: string): Promise<{ response: AgentResponse; task: OrchestrationTask }> {
  const today = new Date();
  const targetDate = dateStr === 'tomorrow' ? new Date(today.getTime() + 86400000) : today;
  const isTomorrow = dateStr === 'tomorrow';

  const task = await orchestrate(
    'schedule',
    'user_asks_schedule',
    [
      {
        mode: 'parallel',
        actions: [
          {
            name: 'fetchSchedule',
            execute: async () => {
              const weekday = targetDate.getDay() === 0 ? 7 : targetDate.getDay();
              return fetchAllCourses().filter(c => c.weekday === weekday).sort((a, b) => a.startTime.localeCompare(b.startTime));
            },
            fallback: '暂时查不到课表，请稍后再试',
          },
          {
            name: 'fetchWeather',
            execute: async () => fetchWeather(targetDate),
            fallback: null, // 天气失败不阻断
          },
          {
            name: 'fetchCardState',
            execute: async () => getCardState(),
            fallback: null, // 一卡通失败不阻断
          },
        ],
      },
    ],
    (results) => {
      const courses = results.get('fetchSchedule') as Course[] | undefined;
      const weather = results.get('fetchWeather') as WeatherInfo | undefined;
      const card = results.get('fetchCardState') as CardState | undefined;

      const dateLabel = isTomorrow ? '明天' : '今天';
      const weekDay = WEEKDAY_NAMES[targetDate.getDay()];

      if (!courses || courses.length === 0) {
        const weatherInfo = weather
          ? `${weather.condition} ${weather.tempLow}°C~${weather.tempHigh}°C`
          : '';
        return `${dateLabel}（周${weekDay}）没课！${weatherInfo ? `天气 ${weatherInfo}，${weather.tips}` : '好好休息吧！'}`;
      }

      const lines = courses.map((c) => {
        return `${c.startTime}-${c.endTime} ${c.name} @${c.location}（${c.teacher}）`;
      });

      const firstCourse = courses[0];
      const isEarlyEight = firstCourse.startTime === '08:00';
      const habits = getUserHabits();

      let extraInfo = '';
      if (isTomorrow && isEarlyEight) {
        const wakeTime = habits.wakeTime;
        const commuteMin = getLongTermKnowledge().campusRules.locations[firstCourse.location.split(/\d/)[0]]?.commuteMinutes || 8;
        const [wakeH, wakeM] = wakeTime.split(':').map(Number);
        const departTime = new Date(targetDate);
        departTime.setHours(firstCourse.startTime.split(':').map(Number)[0]);
        departTime.setMinutes(firstCourse.startTime.split(':').map(Number)[1] - commuteMin);
        const departStr = `${String(departTime.getHours()).padStart(2, '0')}:${String(departTime.getMinutes()).padStart(2, '0')}`;

        extraInfo = `\n⚠️ 明天早八！建议 ${wakeTime} 起床，${departStr} 出门（步行 ${commuteMin} 分钟）。`;
      }

      const weatherInfo = weather
        ? `\n天气：${weather.condition} ${weather.tempLow}-${weather.tempHigh}°C，${weather.tips}`
        : '';

      // 一卡通余额提示
      let cardInfo = '';
      if (card && card.balance < 15) {
        cardInfo = `\n💳 一卡通余额 ${card.balance.toFixed(1)} 元（偏低），建议充值。`;
      } else if (card) {
        cardInfo = `\n💳 一卡通余额 ${card.balance.toFixed(1)} 元，够用。`;
      }

      return `${dateLabel}（周${weekDay}）课表：\n${lines.join('\n')}${weatherInfo}${cardInfo}${extraInfo}`;
    },
  );

  return {
    response: { text: task.result.summary, suggestions: ['设置闹钟', '查一卡通余额'] },
    task,
  };
}
