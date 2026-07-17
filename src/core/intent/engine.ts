// ============================================================
// 意图识别引擎
// 基于关键词 + 规则匹配，后续可升级为 LLM 分类
// ============================================================

import type { IntentResult, IntentCategory } from '../../models/index.js';

/** 意图规则表 */
interface IntentRule {
  category: IntentCategory;
  keywords: string[];          // 触发关键词
  patterns: RegExp[];          // 正则模式
  entities: string[];          // 需要提取的实体名
}

const rules: IntentRule[] = [
  {
    category: 'shower',
    keywords: ['洗澡', '冲凉', '洗浴', '澡堂', '淋浴', '沐浴', '冲个澡', '去洗澡'],
    patterns: [
      /(洗|冲)(个?)(澡|凉)/,
      /去(澡堂|洗澡)/,
      /澡堂(人多|人少|人多不多|怎么样)/,
    ],
    entities: [],
  },
  {
    category: 'schedule',
    keywords: ['课表', '课程', '上课', '什么课', '几点上课', '教室', '早八', '明天', '今天'],
    patterns: [
      /(今天|明天|后天|这周|下周)(什么课|有课|课表)/,
      /(几点|什么时候)上课/,
      /(早八|第一节课)/,
    ],
    entities: ['date'],
  },
  {
    category: 'card',
    keywords: ['一卡通', '余额', '刷卡', '消费', '充值', '卡里', '花了', '食堂', '饭钱'],
    patterns: [
      /(卡|一卡通|余额)(里)?(还有|多少)/,
      /(食堂|吃饭)(花了|消费)/,
      /充值/,
      /(今天|这周|本月)消费/,
    ],
    entities: ['timeRange'],
  },
  {
    category: 'weather',
    keywords: ['天气', '温度', '冷不冷', '热不热', '下雨', '带伞', '穿衣'],
    patterns: [
      /(今天|明天)(天气|温度|冷不冷|热不热)/,
      /带(伞|外套)/,
      /穿(什么|多少)/,
    ],
    entities: ['date'],
  },
  {
    category: 'water',
    keywords: ['喝水', '饮水', '口渴', '接水', '惠生活'],
    patterns: [
      /(喝了|今天)(多少|几杯)(水)/,
      /(接水|打水|喝水提醒)/,
    ],
    entities: ['timeRange'],
  },
  {
    category: 'delivery',
    keywords: ['快递', '包裹', '取件', '外卖', '到了吗', '配送', '取餐', '取件码', '驿站', '菜鸟', '快递柜', '要拿', '拿快递', '拿外卖'],
    patterns: [
      /(有|查|看)(快递|包裹|外卖)/,
      /(快递|外卖)(到|在|怎么)/,
      /(取|拿)(快递|外卖|件)/,
      /(取件码|几号柜|哪个柜)/,
      /规划.*(路线|取件|拿)/,
      /(怎么|路线|先去).*(取|拿)/,
      /(外卖|快递)(送|到|状态)/,
      /(有什么|还有).*(要拿|要取|没拿)/,
    ],
    entities: [],
  },
  {
    category: 'forum',
    keywords: ['论坛', '帖子', '热帖', '发帖', '二手', '闲置', '失物', '捡到', '招领', '课程评价', '选课', '讲座', '宣讲', '活动通知', '树洞', '吐槽', '组队', '求组队', '显示器', '耳机', '钥匙', '教材', '考研', '数模'],
    patterns: [
      /(论坛|帖子|热帖)/,
      /(二手|闲置|求购|出.*卖)/,
      /(失物|捡到|丢了|丢失|寻找|找到)/,
      /(课程|选课|课).*(评价|怎么样|推荐|避坑)/,
      /(老师|老师).*(评价|怎么样|推荐)/,
      /(最近|有什么)(讲座|活动|宣讲)/,
      /(树洞|吐槽|八卦)/,
      /(组队|求组队|求教|代做)/,
      /(有|还有|谁).*(出|卖|求)(显示器|耳机|书|教材|键盘)/,
    ],
    entities: [],
  },
];

/**
 * 识别用户输入意图
 * @param text 用户输入
 * @returns 意图分类结果
 */
export function recognizeIntent(text: string): IntentResult {
  // 默认结果
  const result: IntentResult = {
    category: 'unknown',
    confidence: 0,
    originalText: text,
    extractedEntities: {},
  };

  // 对每个规则打分
  const scores = rules.map((rule) => {
    let score = 0;

    // 关键词匹配（权重 30%）
    for (const kw of rule.keywords) {
      if (text.includes(kw)) {
        score += 0.3;
        break;
      }
    }

    // 正则匹配（权重 70%）
    for (const pattern of rule.patterns) {
      const match = text.match(pattern);
      if (match) {
        score += 0.7;
        // 提取实体
        if (rule.entities.includes('date')) {
          if (text.includes('明天')) result.extractedEntities.date = 'tomorrow';
          else if (text.includes('后天')) result.extractedEntities.date = 'dayAfterTomorrow';
          else result.extractedEntities.date = 'today';
        }
        if (rule.entities.includes('timeRange')) {
          if (text.includes('今天')) result.extractedEntities.timeRange = 'today';
          else if (text.includes('这周') || text.includes('本周')) result.extractedEntities.timeRange = 'week';
          else if (text.includes('这月') || text.includes('本月')) result.extractedEntities.timeRange = 'month';
          else result.extractedEntities.timeRange = 'today';
        }
        break;
      }
    }

    return { category: rule.category, score };
  });

  // 取最高分
  const best = scores.reduce((a, b) => (a.score >= b.score ? a : b));

  if (best.score > 0) {
    result.category = best.category;
    result.confidence = Math.min(best.score, 1);
  }

  return result;
}

/**
 * 获取所有支持的意图类别
 */
export function getSupportedIntents(): IntentCategory[] {
  return ['shower', 'schedule', 'card', 'weather', 'water', 'delivery', 'forum'];
}
