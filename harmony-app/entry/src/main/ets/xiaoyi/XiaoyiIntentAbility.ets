// 校园搭子 - 小艺意图处理 ServiceAbility
// 接收小艺 Deeper Intent 分发，调用后台 Agent 返回结果
import { ServiceExtensionAbility, Want } from '@kit.AbilityKit';
import { CampusAgent } from '../common/CampusAgent';
import type { AgentResponse } from '../model/Types';

const INTENT_TO_SCENE: Record<string, string> = {
  'com.campusbuddy.action.QUERY_BUILDING':   'map',
  'com.campusbuddy.action.QUERY_EXAM':       'exam',
  'com.campusbuddy.action.QUERY_CLASSROOM':  'classroom',
  'com.campusbuddy.action.QUERY_GPA':        'grade',
  'com.campusbuddy.action.QUERY_SHOWER':     'shower',
  'com.campusbuddy.action.QUERY_SCHEDULE':   'schedule',
  'com.campusbuddy.action.QUERY_CARD':       'card',
  'com.campusbuddy.action.QUERY_DELIVERY':   'delivery',
  'com.campusbuddy.action.QUERY_FORUM':      'forum',
  'com.campusbuddy.action.QUERY_WEATHER':    'weather',
  'com.campusbuddy.action.MORNING_BRIEF':    'morning_brief',
  'com.campusbuddy.action.TRACK_WATER':      'water',
};

export default class XiaoyiIntentAbility extends ServiceExtensionAbility {
  onCreate(want: Want): void {
    this.handleXiaoyiRequest(want);
  }

  async handleXiaoyiRequest(want: Want): Promise<void> {
    const action = want.action || '';
    const params = want.parameters || {};
    const query = (params.query as string) || (params.text as string) || '';

    // 场景映射
    const scene = INTENT_TO_SCENE[action];
    const agent = CampusAgent.getInstance();

    if (scene && query) {
      // 构造场景查询
      const sceneQueryMap: Record<string, string> = {
        map: `校园地图 ${params.buildingName || params.serviceQuery || ''}`,
        exam: `考试 ${params.courseName || '倒计时'}`,
        classroom: `空教室 ${params.building || ''} ${(params.features as string[])?.join(',') || ''}`,
        grade: `绩点${params.targetGpa ? ' 够不够' + params.targetGpa : ''}`,
        shower: '我要洗澡',
        schedule: `课表 ${params.date || params.relativeDate || '今天'}`,
        card: `一卡通 ${params.timeRange || '余额'}`,
        delivery: `快递 ${params.action || '查快递'}`,
        forum: `论坛 ${params.section || '首页'}`,
        weather: `天气 ${params.date || '今天'} ${params.suggestion || ''}`,
        morning_brief: '早安',
        water: params.amount ? `记录喝水${params.amount}ml` : '喝了多少水',
      };
      const finalQuery = sceneQueryMap[scene] || query;

      try {
        const resp: AgentResponse = await agent.sendMessage(finalQuery);

        // 返回结果给 小艺（通过 want 回调或通知）
        const result: Record<string, Object> = {
          'fulfillmentText': resp.text,
          'suggestions': JSON.stringify(resp.suggestions),
          'card': resp.card ? JSON.stringify(resp.card) : '{}',
          'scene': scene,
        };
      } catch (e) {
        console.error('[XiaoyiIntent] handle failed:', JSON.stringify(e));
      }
    }
  }

  onDestroy(): void {
    // 清理
  }
}
